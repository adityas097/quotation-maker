const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const FILE_PATH = 'C:/Users/Aditya Kaushik/Downloads/updated_prices_with_hsn.csv';
const DB_PATH = './server/database.sqlite';

async function importData() {
    if (!fs.existsSync(FILE_PATH)) {
        console.error('File not found:', FILE_PATH);
        return;
    }

    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('Reading file...');
    const workbook = xlsx.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`Found ${data.length} rows.`);

    let inserted = 0;
    let updated = 0;

    const stmtInsert = await db.prepare(`
        INSERT INTO items (name, rate, hsn_code, tax_rate, description) 
        VALUES (?, ?, ?, ?, ?)
    `);

    const stmtUpdate = await db.prepare(`
        UPDATE items SET rate = ?, hsn_code = ? WHERE id = ?
    `);

    try {
        await db.exec('BEGIN TRANSACTION');

        for (const row of data) {
            // Normalize keys
            const normalized = {};
            Object.keys(row).forEach(k => normalized[k.trim().toLowerCase()] = row[k]);

            const name = normalized['name'] || normalized['item name'] || normalized['product'];
            const rate = normalized['price'] || normalized['rate'] || normalized['final price'];
            const hsn = normalized['hsn'] || normalized['hsn code'];
            const tax = 18; // Defaulting to 18% as per previous context

            if (!name) continue;

            const existing = await db.get('SELECT id, rate FROM items WHERE name = ?', [name]);

            if (existing) {
                // Update if rate is different or just update anyway?
                // User said "updated_prices", so we should update.
                await stmtUpdate.run(rate || existing.rate, hsn || '', existing.id);
                updated++;
            } else {
                await stmtInsert.run(name, rate || 0, hsn || '', tax, '');
                inserted++;
            }
        }

        await db.exec('COMMIT');
        console.log(`Import Complete. Inserted: ${inserted}, Updated: ${updated}`);

    } catch (err) {
        console.error('Error:', err);
        await db.exec('ROLLBACK');
    } finally {
        await stmtInsert.finalize();
        await stmtUpdate.finalize();
        await db.close();
    }
}

importData();
