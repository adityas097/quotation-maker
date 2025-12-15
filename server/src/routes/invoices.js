const express = require('express');
const { getDB } = require('../db');

const router = express.Router();

// List invoices
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        let query = 'SELECT * FROM invoices';
        const params = [];
        if (req.user.role !== 'admin') {
            query += ' WHERE user_id = ?';
            params.push(req.user.id);
        }
        query += ' ORDER BY date DESC, created_at DESC';
        const invoices = await db.all(query, params);
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Convert Quote to Invoice
router.post('/convert/:quoteId', async (req, res) => {
    const { quoteId } = req.params;
    try {
        const db = getDB();

        // 1. Get Quote Details
        const quote = await db.get('SELECT * FROM quotations WHERE id = ?', [quoteId]);
        if (!quote) return res.status(404).json({ error: 'Quotation not found' });

        // 2. Check if already invoiced
        const existing = await db.get('SELECT * FROM invoices WHERE quotation_id = ?', [quoteId]);
        if (existing) return res.status(409).json({ error: 'Invoice already exists for this quotation', id: existing.id });

        // 3. Generate Invoice Number (Simple Auto-Increment Logic or Date based)
        // Let's use INV-YYYY-ID format or just sequential if we had a sequence table. 
        // For simplicity: INV-{Date}-{QuoteID}
        const today = new Date();
        const invNum = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${quoteId.toString().padStart(3, '0')}`;

        // 4. Calculate Total Amount (Need to fetch items to sum up)
        // Or we can trust frontend to pass total? Better to calculate from DB items.
        const items = await db.all('SELECT * FROM quotation_items WHERE quotation_id = ?', [quoteId]);

        // Calculate Total
        let total = 0;
        for (const item of items) {
            const taxable = item.amount; // We stored taxable value
            const tax = taxable * (item.tax_rate / 100);
            total += taxable + tax;
        }

        // Apply Global Discount if any
        if (quote.discount_type === 'PERCENT') {
            total = total * (1 - quote.discount_value / 100);
        } else if (quote.discount_type === 'FIXED') {
            total = total - quote.discount_value;
        }

        // 5. Create Invoice
        const result = await db.run(
            'INSERT INTO invoices (user_id, invoice_number, quotation_id, client_name, date, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, invNum, quoteId, quote.client_name, new Date().toISOString().split('T')[0], total, 'UNPAID']
        );

        // 6. Update Quote Status
        await db.run("UPDATE quotations SET status = 'INVOICED' WHERE id = ?", [quoteId]);

        res.status(201).json({ id: result.lastID, invoice_number: invNum });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
