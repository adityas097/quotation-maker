const { getDB, initDB } = require('./db');

async function cleanupUsers() {
    try {
        await initDB();
        const db = getDB();

        // Keep ID 1 (admineliza)
        // Check if admineliza is ID 1 first for safety
        const master = await db.get("SELECT username FROM users WHERE id = 1");
        if (master && master.username === 'admineliza') {
            await db.run("DELETE FROM users WHERE id != 1");
            console.log("Cleanup complete. Only admineliza remains.");
        } else {
            console.log("Safety Check Failed: ID 1 is not admineliza. Aborting.");
        }

    } catch (err) {
        console.error(err);
    }
}

cleanupUsers();
