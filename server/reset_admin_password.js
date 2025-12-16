const { getDB, initDB } = require('./db');
const bcrypt = require('bcrypt');

async function resetPassword() {
    try {
        await initDB();
        const db = getDB();
        const username = 'admineliza';
        // Password provided by user
        const newPassword = 'Adi.0082398';
        const hash = await bcrypt.hash(newPassword, 10);

        await db.run('UPDATE users SET password_hash = ? WHERE username = ?', [hash, username]);
        console.log(`Password for ${username} updated successfully to 'Adi.0082398'`);
    } catch (err) {
        console.error(err);
    }
}

resetPassword();
