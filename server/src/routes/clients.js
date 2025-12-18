const express = require('express');
const { getDB } = require('../db');

const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        let query = 'SELECT * FROM clients';
        const params = [];
        if (req.user.role !== 'admin') {
            query += ' WHERE user_id = ?';
            params.push(req.user.id);
        }
        query += ' ORDER BY name';
        const clients = await db.all(query, params);
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search clients (Autocomplete)
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    try {
        const db = getDB();
        let query = 'SELECT * FROM clients WHERE name LIKE ?';
        const params = [`%${q}%`];
        if (req.user.role !== 'admin') {
            query += ' AND user_id = ?';
            params.push(req.user.id);
        }
        query += ' ORDER BY name LIMIT 10';

        const clients = await db.all(query, params);
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create client
router.post('/', async (req, res) => {
    const { name, email, phone, address, gstin } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const db = getDB();
        const result = await db.run(
            'INSERT INTO clients (user_id, name, email, phone, address, gstin) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, name, email, phone, address, gstin || '']
        );
        res.status(201).json({ id: result.lastID, name, email, phone, address, gstin });
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Client already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, gstin } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const db = getDB();
        let query = 'UPDATE clients SET name = ?, email = ?, phone = ?, address = ?, gstin = ? WHERE id = ?';
        const params = [name, email, phone, address, gstin || '', id];

        if (req.user.role !== 'admin') {
            query += ' AND user_id = ?';
            params.push(req.user.id);
        }

        const result = await db.run(query, params);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Client not found or not authorized' });
        }
        res.json({ id, name, email, phone, address, gstin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDB();
        let query = 'DELETE FROM clients WHERE id = ?';
        const params = [id];

        if (req.user.role !== 'admin') {
            query += ' AND user_id = ?';
            params.push(req.user.id);
        }

        const result = await db.run(query, params);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Client not found or not authorized' });
        }
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk Upsert Clients
router.post('/bulk', async (req, res) => {
    const clients = req.body;
    if (!Array.isArray(clients)) {
        return res.status(400).json({ error: 'Body must be an array' });
    }

    try {
        const db = getDB();
        await db.exec('BEGIN TRANSACTION');
        const stmt = await db.prepare(`
            INSERT INTO clients (user_id, name, email, phone, address, gstin) 
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET 
            email=excluded.email,
            phone=excluded.phone,
            address=excluded.address,
            gstin=excluded.gstin
        `);

        for (const c of clients) {
            if (!c.name) continue;
            await stmt.run(
                req.user.id,
                c.name,
                c.email || null,
                c.phone || null,
                c.address || null,
                c.gstin || null
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

// Bulk Delete Clients
router.delete('/bulk', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'IDs must be an array' });
    }

    try {
        const db = getDB();
        const placeholders = ids.map(() => '?').join(',');
        let query = `DELETE FROM clients WHERE id IN (${placeholders})`;
        const params = [...ids];

        if (req.user.role !== 'admin') {
            query += ' AND user_id = ?';
            params.push(req.user.id);
        }

        await db.run(query, params);
        res.json({ message: 'Deleted clients' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
