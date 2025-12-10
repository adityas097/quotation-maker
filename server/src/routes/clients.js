const express = require('express');
const { getDB } = require('../db');

const router = express.Router();

// Search clients (Autocomplete)
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const db = getDB();
        // Search by name, case insensitive (SQLite LIKE is case insensitive for ASCII)
        const clients = await db.all(
            'SELECT * FROM clients WHERE name LIKE ? ORDER BY name LIMIT 10',
            [`%${q}%`]
        );
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create client
router.post('/', async (req, res) => {
    const { name, email, phone, address } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const db = getDB();
        const result = await db.run(
            'INSERT INTO clients (name, email, phone, address) VALUES (?, ?, ?, ?)',
            [name, email, phone, address]
        );
        res.status(201).json({ id: result.lastID, name, email, phone, address });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Client already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
