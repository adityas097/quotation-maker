const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function migrate() {
    const db = await open({
        filename: path.join(__dirname, '../database.sqlite'),
        driver: sqlite3.Database
    });

    console.log('Running Migration V2...');

    try {
        // Items Table Updates
        await db.exec("ALTER TABLE items ADD COLUMN rate REAL");
        await db.exec("ALTER TABLE items ADD COLUMN hsn_code TEXT");
        await db.exec("ALTER TABLE items ADD COLUMN tax_rate REAL DEFAULT 0");
        console.log('✅ Updated items table');
    } catch (e) { console.log('⚠️ items table update skipped (possibly already exists)'); }

    try {
        // Quotations Table Updates
        await db.exec("ALTER TABLE quotations ADD COLUMN status TEXT DEFAULT 'DRAFT'");
        await db.exec("ALTER TABLE quotations ADD COLUMN discount_type TEXT");
        await db.exec("ALTER TABLE quotations ADD COLUMN discount_value REAL DEFAULT 0");
        console.log('✅ Updated quotations table');
    } catch (e) { console.log('⚠️ quotations table update skipped'); }

    try {
        // Quotation Items Table Updates
        await db.exec("ALTER TABLE quotation_items ADD COLUMN rate REAL DEFAULT 0");
        await db.exec("ALTER TABLE quotation_items ADD COLUMN hsn_code TEXT");
        await db.exec("ALTER TABLE quotation_items ADD COLUMN tax_rate REAL DEFAULT 0");
        await db.exec("ALTER TABLE quotation_items ADD COLUMN discount REAL DEFAULT 0");
        await db.exec("ALTER TABLE quotation_items ADD COLUMN amount REAL DEFAULT 0");
        console.log('✅ Updated quotation_items table');
    } catch (e) {
        console.log('⚠️ quotation_items table update skipped: ' + e.message);
        // If one fails, others might fail too in catch block, but simplistic approach for now
    }

    try {
        // New Invoices Table
        await db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        quotation_id INTEGER,
        client_name TEXT,
        date TEXT NOT NULL,
        total_amount REAL,
        status TEXT DEFAULT 'PAID', -- or PENDING
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id)
      );
    `);
        console.log('✅ Created invoices table');
    } catch (e) { console.error('❌ Failed to create invoices table', e); }

    console.log('Migration Complete.');
}

migrate().catch(console.error);
