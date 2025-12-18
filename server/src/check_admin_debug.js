const { getDB, initDB } = require('./db');

async function checkAdmin() {
    try {
        await initDB();
        const db = getDB();
        const user = await db.get("SELECT * FROM users WHERE username = 'admineliza'");
        console.log("Admin User:", user);
    } catch (err) {
        console.error(err);
    }
}

checkAdmin();
