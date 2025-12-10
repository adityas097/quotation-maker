const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { getDB } = require('../db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all items
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const items = await db.all('SELECT * FROM items ORDER BY name');
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create single item
router.post('/', async (req, res) => {
    const { model_number, name, description, rate, hsn_code, tax_rate } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    try {
        const db = getDB();
        const result = await db.run(
            'INSERT INTO items (model_number, name, description, rate, hsn_code, tax_rate) VALUES (?, ?, ?, ?, ?, ?)',
            [model_number, name, description, rate || 0, hsn_code || '', tax_rate || 0]
        );
        res.status(201).json({ id: result.lastID, model_number, name, description, rate, hsn_code, tax_rate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Import Items from CSV/XLS
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const db = getDB();
        let importedCount = 0;

        await db.exec('BEGIN TRANSACTION');
        const stmt = await db.prepare('INSERT INTO items (model_number, name, description, rate, hsn_code, tax_rate) VALUES (?, ?, ?, ?, ?, ?)');

        for (const row of data) {
            const model = row['Model'] || row['model_number'] || row['Model Number'] || '';
            const name = row['Name'] || row['name'] || row['Item Name'];
            const desc = row['Description'] || row['description'] || '';
            const rate = row['Rate'] || row['Price'] || row['rate'] || 0;
            const hsn = row['HSN'] || row['hsn_code'] || row['HSN Code'] || '';
            const tax = row['Tax'] || row['tax_rate'] || 0;

            if (name) {
                await stmt.run(model, name, desc, rate, hsn, tax);
                importedCount++;
            }
        }
        await stmt.finalize();
        await db.exec('COMMIT');

        res.json({ message: `Successfully imported ${importedCount} items` });
    } catch (err) {
        await getDB().exec('ROLLBACK');
        res.status(500).json({ error: 'Failed to process file: ' + err.message });
    }
});

module.exports = router;
