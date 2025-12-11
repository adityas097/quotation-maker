const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile);

db.run("ALTER TABLE quotation_items ADD COLUMN discount REAL DEFAULT 0", (err) => {
    if (!err) console.log("Added discount column");
    else console.log(err.message);
});
db.run("ALTER TABLE quotation_items ADD COLUMN amount REAL DEFAULT 0", (err) => {
    if (!err) console.log("Added amount column");
    else console.log(err.message);
    db.close();
});
