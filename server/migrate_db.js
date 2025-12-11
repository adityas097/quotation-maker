const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function migrate() {
    try {
        const db = await open({
            filename: path.join(__dirname, '../database.sqlite'),
            driver: sqlite3.Database
        });

        console.log('Connected to database.');

        // Get current columns
        const columns = await db.all("PRAGMA table_info(items)");
        const columnNames = columns.map(c => c.name);

        if (!columnNames.includes('rate')) {
            console.log('Adding rate column...');
            await db.exec('ALTER TABLE items ADD COLUMN rate REAL DEFAULT 0');
        }
        if (!columnNames.includes('hsn_code')) {
            console.log('Adding hsn_code column...');
            await db.exec('ALTER TABLE items ADD COLUMN hsn_code TEXT');
        }
        if (!columnNames.includes('tax_rate')) {
            console.log('Adding tax_rate column...');
            await db.exec('ALTER TABLE items ADD COLUMN tax_rate REAL DEFAULT 0');
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
