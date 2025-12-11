const { initDB } = require('./src/db');

async function checkClients() {
    try {
        const db = await initDB();
        const count = await db.get('SELECT COUNT(*) as c FROM clients');
        console.log(`Total Clients in DB: ${count.c}`);

        const sample = await db.all('SELECT * FROM clients LIMIT 5');
        console.log('Sample Clients:', JSON.stringify(sample, null, 2));

    } catch (err) {
        console.error(err);
    }
}

checkClients();
