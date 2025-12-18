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
        let query = 'SELECT * FROM items';
        const params = [];
        if (req.user.role !== 'admin') {
            query += ' WHERE user_id = ?';
            params.push(req.user.id);
        }
        query += ' ORDER BY name';
        const items = await db.all(query, params);
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
            'INSERT INTO items (user_id, model_number, name, description, rate, hsn_code, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, model_number, name, description, rate || 0, hsn_code || '', tax_rate || 0]
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
        const stmt = await db.prepare('INSERT INTO items (user_id, model_number, name, description, rate, hsn_code, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)');

        for (const row of data) {
            // Normalize keys to lowercase and trimmed for easier matching
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.trim().toLowerCase()] = row[key];
            });

            // Helper to find value by possible keys
            const getValue = (keys) => {
                for (const key of keys) {
                    if (normalizedRow[key] !== undefined) return normalizedRow[key];
                }
                return undefined;
            };

            const model = getValue(['model', 'model_number', 'model number']) || '';
            const name = getValue(['name', 'item name']);
            const desc = getValue(['description']) || '';
            let rate = getValue(['rate', 'price']) || 0;
            const hsn = getValue(['hsn', 'hsn code', 'hsn_code']) || '';
            let tax = getValue(['tax', 'tax_rate', 'tax rate', 'gst', 'gst%']) || 0;

            // Normalize Tax (0.18 -> 18)
            if (tax < 1 && tax > 0) {
                tax = tax * 100;
            }

            if (name) {
                await stmt.run(req.user.id, model, name, desc, rate, hsn, tax);
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

// Bulk Upsert Items
router.post('/bulk', async (req, res) => {
    const items = req.body; // Array of items
    console.log(`Bulk Upsert items: ${items.length}`);
    if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Body must be an array' });
    }

    try {
        const db = getDB();
        await db.exec('BEGIN TRANSACTION');
        const stmt = await db.prepare(`
            INSERT INTO items (user_id, model_number, name, description, rate, hsn_code, tax_rate) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET 
            model_number=excluded.model_number,
            description=excluded.description,
            rate=excluded.rate,
            hsn_code=excluded.hsn_code,
            tax_rate=excluded.tax_rate
        `);

        for (const item of items) {
            if (!item.name) continue;
            await stmt.run(
                req.user.id,
                item.model_number || '',
                item.name,
                item.description || '',
                item.rate || 0,
                item.hsn_code || '',
                item.tax_rate || 0
            );
        }

        await stmt.finalize();
        await db.exec('COMMIT');
        res.json({ message: 'Bulk processing complete' });
    } catch (err) {
        await getDB().exec('ROLLBACK').catch(() => { });
        res.status(500).json({ error: err.message });
    }
});

// Bulk Delete Items
router.delete('/bulk', async (req, res) => {
    const { ids } = req.body; // Array of IDs
    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'IDs must be an array' });
    }

    try {
        const db = getDB();
        const placeholders = ids.map(() => '?').join(',');

        let query = `DELETE FROM items WHERE id IN (${placeholders})`;
        const params = [...ids];

        if (req.user.role !== 'admin') {
            query += ' AND user_id = ?';
            params.push(req.user.id);
        }

        await db.run(query, params);
        res.json({ message: 'Deleted items' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
