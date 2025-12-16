const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function migrate() {
    const db = await open({
        filename: path.join(__dirname, '../database.sqlite'),
        driver: sqlite3.Database
    });

    console.log('Running Migration V3...');

    try {
        // Add company_snapshot column
        // We store it as TEXT (JSON string)
        await db.exec("ALTER TABLE quotations ADD COLUMN company_snapshot TEXT");
        console.log('✅ Updated quotations table with company_snapshot');
    } catch (e) {
        console.log('⚠️ quotations table update skipped (possibly already exists): ' + e.message);
    }

    console.log('Migration V3 Complete.');
}

migrate().catch(console.error);
