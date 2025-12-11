const { initDB, getDB } = require('./src/db');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

async function run() {
    try {
        // 1. Initialize DB (Creates tables if missing, with NEW schema)
        const db = await initDB();

        // 2. Double check and migrate if needed (for existing tables without new columns)
        const columns = await db.all("PRAGMA table_info(items)");
        const columnNames = columns.map(c => c.name);

        if (!columnNames.includes('rate')) {
            console.log('Migrating: Adding rate column...');
            await db.exec('ALTER TABLE items ADD COLUMN rate REAL DEFAULT 0');
        }
        if (!columnNames.includes('hsn_code')) {
            console.log('Migrating: Adding hsn_code column...');
            await db.exec('ALTER TABLE items ADD COLUMN hsn_code TEXT');
        }
        if (!columnNames.includes('tax_rate')) {
            console.log('Migrating: Adding tax_rate column...');
            await db.exec('ALTER TABLE items ADD COLUMN tax_rate REAL DEFAULT 0');
        }

        console.log('Schema verification complete.');

        // 3. Import Data
        const filePath = path.join(__dirname, '../debug_prices.xlsx');
        if (!fs.existsSync(filePath)) {
            console.error('Debug file not found at ' + filePath);
            return;
        }

        console.log('Reading file...');
        const buffer = fs.readFileSync(filePath);
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let importedCount = 0;
        await db.exec('BEGIN TRANSACTION');
        const stmt = await db.prepare('INSERT INTO items (model_number, name, description, rate, hsn_code, tax_rate) VALUES (?, ?, ?, ?, ?, ?)');

        for (const row of data) {
            // Normalize keys (COPIED LOGIC FROM SERVER)
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.trim().toLowerCase()] = row[key];
            });

            const getValue = (keys) => {
                for (const key of keys) {
                    if (normalizedRow[key] !== undefined) return normalizedRow[key];
                }
                return undefined;
            };

            const model = getValue(['model', 'model_number', 'model number']) || '';
            const name = getValue(['name', 'item name']);
            const desc = getValue(['description']) || '';
            let rate = getValue(['rate', 'price']) || 0;
            const hsn = getValue(['hsn', 'hsn code', 'hsn_code']) || '';
            let tax = getValue(['tax', 'tax_rate', 'tax rate', 'gst', 'gst%']) || 0;

            // Normalize Tax (0.18 -> 18)
            if (tax < 1 && tax > 0) {
                tax = tax * 100;
            }

            if (name) {
                await stmt.run(model, name, desc, rate, hsn, tax);
                importedCount++;
            }
        }
        await stmt.finalize();
        await db.exec('COMMIT');
        console.log(`Successfully imported ${importedCount} items into database.`);

    } catch (err) {
        if (getDB()) await getDB().exec('ROLLBACK').catch(() => { });
        console.error('Error:', err);
    }
}

run();
