const express = require('express');
const router = express.Router();
const { getDB } = require('../db');

// GET all companies
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const companies = await db.all('SELECT * FROM companies');
        res.json(companies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET company by ID
router.get('/:id', async (req, res) => {
    try {
        const db = getDB();
        const company = await db.get('SELECT * FROM companies WHERE id = ?', [req.params.id]);
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json(company);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE new company
router.post('/', async (req, res) => {
    const { name, address, phone, email, gstin, pan, bank_name, account_no, ifsc, account_holder_name, upi_id, is_default } = req.body;
    try {
        const db = getDB();

        // If this is set as default, unset others
        if (is_default) {
            await db.run('UPDATE companies SET is_default = 0');
        }

        const result = await db.run(`
            INSERT INTO companies (name, address, phone, email, gstin, pan, bank_name, account_no, ifsc, account_holder_name, upi_id, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, address, phone, email, gstin, pan, bank_name, account_no, ifsc, account_holder_name, upi_id, is_default ? 1 : 0]);

        const newCompany = await db.get('SELECT * FROM companies WHERE id = ?', [result.lastID]);
        res.status(201).json(newCompany);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE company
router.put('/:id', async (req, res) => {
    const { name, address, phone, email, gstin, pan, bank_name, account_no, ifsc, account_holder_name, upi_id, is_default } = req.body;
    const { id } = req.params;
    try {
        const db = getDB();

        if (is_default) {
            await db.run('UPDATE companies SET is_default = 0');
        }

        await db.run(`
            UPDATE companies SET 
                name = COALESCE(?, name),
                address = COALESCE(?, address),
                phone = COALESCE(?, phone),
                email = COALESCE(?, email),
                gstin = COALESCE(?, gstin),
                pan = COALESCE(?, pan),
                bank_name = COALESCE(?, bank_name),
                account_no = COALESCE(?, account_no),
                ifsc = COALESCE(?, ifsc),
                account_holder_name = COALESCE(?, account_holder_name),
                upi_id = COALESCE(?, upi_id),
                is_default = COALESCE(?, is_default)
            WHERE id = ?
        `, [name, address, phone, email, gstin, pan, bank_name, account_no, ifsc, account_holder_name, upi_id, is_default !== undefined ? (is_default ? 1 : 0) : null, id]);

        const updatedCompany = await db.get('SELECT * FROM companies WHERE id = ?', [id]);
        res.json(updatedCompany);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE company
router.delete('/:id', async (req, res) => {
    try {
        const db = getDB();
        await db.run('DELETE FROM companies WHERE id = ?', [req.params.id]);
        res.json({ message: 'Company deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
