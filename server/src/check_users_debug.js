const { getDB, initDB } = require('./db');

async function listUsers() {
    try {
        await initDB();
        const db = getDB();
        const users = await db.all("SELECT id, username, role, status FROM users");
        console.log("Users:", users);
    } catch (err) {
        console.error(err);
    }
}

listUsers();
