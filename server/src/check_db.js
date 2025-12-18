const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function checkCompanies() {
    try {
        const db = await open({
            filename: path.join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });

        const companies = await db.all('SELECT * FROM companies');
        console.log('Companies found:', companies.length);
        console.log(JSON.stringify(companies, null, 2));

        // Check table info
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables:', tables.map(t => t.name));

    } catch (err) {
        console.error('Error:', err);
    }
}

checkCompanies();
