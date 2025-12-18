const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const FILE_PATH = "C:/Users/Aditya Kaushik/Desktop/cp plus hikvision tenda.xlsx";
const DB_PATH = './server/database.sqlite';

async function importExcel() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Reading file...');
    const workbook = xlsx.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Found ${data.length} rows.`);

    const stmtInsert = await db.prepare(`
        INSERT INTO items (model_number, name, description, rate, hsn_code, tax_rate) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Check for existing items by Model Number to avoid duplicates?
    // Let's rely on basic logic: Insert. (Or Update if Model matches?)
    // Given previous pattern, I'll update if model exists, insert if not.
    const stmtCheck = await db.prepare('SELECT id FROM items WHERE model_number = ?');
    const stmtUpdate = await db.prepare('UPDATE items SET rate = ?, name = ?, description = ? WHERE id = ?');

    let inserted = 0;
    let updated = 0;

    await db.exec('BEGIN TRANSACTION');

    for (const row of data) {
        // Normalize keys
        const normalized = {};
        Object.keys(row).forEach(k => {
            // remove (₹) and trim
            const key = k.replace(/\(₹\)/g, '').trim().toLowerCase();
            normalized[key] = row[k];
        });

        const model = normalized['model number'] || '';
        const name = normalized['name'] || '';
        const desc = normalized['description'] || '';
        const rate = normalized['rate'] || 0;
        const hsn = normalized['hsn code'] || '';
        const tax = 18;

        if (!name) continue;

        let finalName = name;
        // Basic heuristic: if name is too short/generic and model has brand, maybe prefix?
        // But let's trust the Excel "Name" column for now.

        // Check validation
        if (model) {
            const existing = await stmtCheck.get(model);
            if (existing) {
                await stmtUpdate.run(rate, finalName, desc, existing.id);
                updated++;
            } else {
                await stmtInsert.run(model, finalName, desc, rate, hsn, tax);
                inserted++;
            }
        } else {
            // If no model, just insert? Or check by name? 
            // Let's insert.
            await stmtInsert.run(model, finalName, desc, rate, hsn, tax);
            inserted++;
        }
    }

    await db.exec('COMMIT');
    console.log(`Import Done. Inserted: ${inserted}, Updated: ${updated}`);
    await db.close();
}

importExcel().catch(console.error);
