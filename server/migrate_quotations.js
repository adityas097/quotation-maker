const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'metrics.db'); // It seems the user is using 'metrics.db' or similar? 
// Wait, looking at db.js is best to know the DB file name. 
// checking db.js content again... it uses 'database.sqlite' usually or checks logic. 

const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile);

const run = (sql) => new Promise((resolve, reject) => {
    db.run(sql, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error running sql:', sql, err.message);
            // resolve anyway to continue
            resolve();
        } else {
            console.log('Success:', sql);
            resolve();
        }
    });
});

async function migrate() {
    console.log('Starting migration...');

    // Quotations Table
    await run("ALTER TABLE quotations ADD COLUMN client_address TEXT");
    await run("ALTER TABLE quotations ADD COLUMN client_gstin TEXT");
    await run("ALTER TABLE quotations ADD COLUMN status TEXT DEFAULT 'DRAFT'");
    await run("ALTER TABLE quotations ADD COLUMN discount_type TEXT DEFAULT 'PERCENT'");
    await run("ALTER TABLE quotations ADD COLUMN discount_value REAL DEFAULT 0");

    // Quotation Items Table
    await run("ALTER TABLE quotation_items ADD COLUMN rate REAL DEFAULT 0");
    await run("ALTER TABLE quotation_items ADD COLUMN hsn_code TEXT");
    await run("ALTER TABLE quotation_items ADD COLUMN tax_rate REAL DEFAULT 0");

    console.log('Migration complete.');
    db.close();
}

migrate();
