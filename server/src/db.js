const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db;

async function initDB() {
  db = await open({
    filename: path.join(__dirname, '../database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_number TEXT,
      name TEXT NOT NULL,
      description TEXT,
      rate REAL DEFAULT 0,
      hsn_code TEXT,
      tax_rate REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      gstin TEXT
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      client_name TEXT,
      client_address TEXT,
      client_gstin TEXT,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'DRAFT',
      discount_type TEXT DEFAULT 'PERCENT',
      discount_value REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      item_id INTEGER,
      model_number TEXT,
      name TEXT NOT NULL,
      description TEXT,
      note TEXT,
      hsn_code TEXT,
      rate REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      is_manual BOOLEAN DEFAULT 0,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      quotation_id INTEGER,
      client_name TEXT,
      date TEXT,
      total_amount REAL,
      status TEXT DEFAULT 'UNPAID',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id)
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      gstin TEXT,
      pan TEXT,
      bank_name TEXT,
      account_no TEXT,
      ifsc TEXT,
      account_holder_name TEXT,
      upi_id TEXT,
      is_default BOOLEAN DEFAULT 0
    );
  `);

  // Seed default company if none exists
  const companyCount = await db.get('SELECT COUNT(*) as count FROM companies');
  if (companyCount.count === 0) {
    await db.run(`
      INSERT INTO companies (name, address, phone, email, gstin, pan, bank_name, account_no, ifsc, account_holder_name, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      'ELIZA INFOTECH',
      'Near SP Office, Narnaul, Haryana (123001)',
      '+91 9728266497',
      'elizainfotech.solutions@gmail.com',
      '06HPSPK0735M1Z8',
      'HPSPK0735M',
      'Kotak Mahindra Bank',
      '4046029995',
      'KKBK0000293',
      'Aditya Kaushik'
    ]);
    console.log('Seeded default company: ELIZA INFOTECH');
  }

  console.log('Database initialized');
  return db;
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { initDB, getDB };
