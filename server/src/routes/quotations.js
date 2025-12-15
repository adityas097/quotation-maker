const express = require('express');
const { getDB } = require('../db');

const router = express.Router();

// Get all quotations (Admin sees all, User sees own)
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        let query = `
      SELECT q.*, count(qi.id) as item_count 
      FROM quotations q 
      LEFT JOIN quotation_items qi ON q.id = qi.quotation_id 
    `;

        const params = [];
        if (req.user.role !== 'admin') {
            query += ` WHERE q.user_id = ? `;
            params.push(req.user.id);
        }

        query += ` GROUP BY q.id ORDER BY q.date DESC, q.created_at DESC`;

        const quotes = await db.all(query, params);
        res.json(quotes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single quotation with items
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDB();
        const quote = await db.get('SELECT * FROM quotations WHERE id = ?', [id]);
        if (!quote) return res.status(404).json({ error: 'Quotation not found' });

        const items = await db.all('SELECT * FROM quotation_items WHERE quotation_id = ?', [id]);
        res.json({ ...quote, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create quotation
router.post('/', async (req, res) => {
    const { client_id, client_name, client_address, client_gstin, date, items, status, discount_type, discount_value } = req.body;

    if (!client_name || !date || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = getDB();
        await db.exec('BEGIN TRANSACTION');

        const result = await db.run(
            'INSERT INTO quotations (user_id, client_id, client_name, client_address, client_gstin, date, status, discount_type, discount_value, notes, terms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, client_id, client_name, client_address || '', client_gstin || '', date, status || 'DRAFT', discount_type, discount_value || 0, req.body.notes || '', req.body.terms || '']
        );
        const quoteId = result.lastID;

        // 2. Insert Items
        const stmt = await db.prepare(`
      INSERT INTO quotation_items 
      (quotation_id, item_id, model_number, name, description, note, quantity, is_manual, rate, hsn_code, tax_rate, discount, amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        for (const item of items) {
            const rate = item.rate || 0;
            const qty = item.quantity || 1;
            const taxableValue = (rate * qty);

            await stmt.run(
                quoteId,
                item.item_id || null, // null if manual
                item.model_number,
                item.name,
                item.description,
                item.note,
                qty,
                item.is_manual ? 1 : 0,
                rate,
                item.hsn_code || '',
                item.tax_rate || 0,
                item.discount || 0,
                taxableValue
            );
        }
        await stmt.finalize();

        await db.exec('COMMIT');
        res.status(201).json({ id: quoteId, message: 'Quotation created' });
    } catch (err) {
        await getDB().exec('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Update quotation
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { client_id, client_name, client_address, client_gstin, date, items, status, discount_type, discount_value } = req.body;

    try {
        const db = getDB();
        await db.exec('BEGIN TRANSACTION');

        // Check ownership first
        if (req.user.role !== 'admin') {
            const existing = await db.get('SELECT id FROM quotations WHERE id = ? AND user_id = ?', [id, req.user.id]);
            if (!existing) {
                await db.exec('ROLLBACK');
                return res.status(404).json({ error: 'Quotation not found or unauthorized' });
            }
        }

        // Update Quote Details
        await db.run(
            'UPDATE quotations SET client_id = ?, client_name = ?, client_address = ?, client_gstin = ?, date = ?, status = ?, discount_type = ?, discount_value = ?, notes = ?, terms = ? WHERE id = ?',
            [client_id, client_name, client_address || '', client_gstin || '', date, status, discount_type, discount_value, req.body.notes || '', req.body.terms || '', id]
        );

        // Delete existing items
        await db.run('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);

        // Insert new items
        const stmt = await db.prepare(`
      INSERT INTO quotation_items 
      (quotation_id, item_id, model_number, name, description, note, quantity, is_manual, rate, hsn_code, tax_rate, discount, amount) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        for (const item of items) {
            const rate = item.rate || 0;
            const qty = item.quantity || 1;
            const taxableValue = (rate * qty);

            await stmt.run(
                id,
                item.item_id || null,
                item.model_number,
                item.name,
                item.description,
                item.note,
                qty,
                item.is_manual ? 1 : 0,
                rate,
                item.hsn_code || '',
                item.tax_rate || 0,
                item.discount || 0,
                taxableValue
            );
        }
        await stmt.finalize();

        await db.exec('COMMIT');
        res.json({ message: 'Quotation updated' });
    } catch (err) {
        await getDB().exec('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Duplicate quotation
router.post('/duplicate/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDB();

        // 1. Get Original Quote
        const quote = await db.get('SELECT * FROM quotations WHERE id = ?', [id]);
        if (!quote) return res.status(404).json({ error: 'Quotation not found' });

        // 2. Get Items
        const items = await db.all('SELECT * FROM quotation_items WHERE quotation_id = ?', [id]);

        await db.exec('BEGIN TRANSACTION');

        // 3. Insert New Quote (Status DRAFT, Today's Date)
        const today = new Date().toISOString().split('T')[0];
        const resQuote = await db.run(
            `INSERT INTO quotations (user_id, client_id, client_name, client_address, client_gstin, date, status, discount_type, discount_value, notes, terms) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, quote.client_id, quote.client_name, quote.client_address, quote.client_gstin, today, 'DRAFT', quote.discount_type, quote.discount_value, quote.notes, quote.terms]
        );
        const newId = resQuote.lastID;

        // 4. Insert Items
        const stmt = await db.prepare(`
            INSERT INTO quotation_items 
            (quotation_id, item_id, model_number, name, description, note, quantity, is_manual, rate, hsn_code, tax_rate, discount, amount) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
            await stmt.run(
                newId,
                item.item_id,
                item.model_number,
                item.name,
                item.description,
                item.note,
                item.quantity,
                item.is_manual,
                item.rate,
                item.hsn_code,
                item.tax_rate,
                item.discount,
                item.amount
            );
        }
        await stmt.finalize();

        await db.exec('COMMIT');
        res.status(201).json({ id: newId, message: 'Quotation duplicated' });

    } catch (err) {
        await getDB().exec('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

// Delete quotation
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const db = getDB();

        if (req.user.role !== 'admin') {
            const existing = await db.get('SELECT id FROM quotations WHERE id = ? AND user_id = ?', [id, req.user.id]);
            if (!existing) return res.status(404).json({ error: 'Quotation not found or unauthorized' });
        }

        await db.exec('BEGIN TRANSACTION');
        await db.run('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);
        await db.run('DELETE FROM quotations WHERE id = ?', [id]);
        await db.exec('COMMIT');
        res.json({ message: 'Quotation deleted' });
    } catch (err) {
        await getDB().exec('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
