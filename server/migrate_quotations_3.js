const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("ALTER TABLE quotations ADD COLUMN notes TEXT", (err) => {
        if (err && err.message.includes('duplicate column')) {
            console.log("Column 'notes' already exists.");
        } else if (err) {
            console.error("Error adding notes:", err);
        } else {
            console.log("Added 'notes' column.");
        }
    });

    db.run("ALTER TABLE quotations ADD COLUMN terms TEXT", (err) => {
        if (err && err.message.includes('duplicate column')) {
            console.log("Column 'terms' already exists.");
        } else if (err) {
            console.error("Error adding terms:", err);
        } else {
            console.log("Added 'terms' column.");
        }
    });
});

db.close();
