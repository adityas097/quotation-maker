const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDB } = require('../db');
const { authorizeRole } = require('../middleware/auth');

// ==========================================
// USER PROFILE ROUTES (Accessible to all authenticated users)
// ==========================================

// GET Current User Profile
router.get('/profile', async (req, res) => {
    try {
        const db = getDB();
        const user = await db.get(
            'SELECT id, username, role, status, business_category, turnover, employee_count FROM users WHERE id = ?',
            [req.user.id]
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Current User Profile
router.put('/profile', async (req, res) => {
    const { password, business_category, turnover, employee_count } = req.body;
    const userId = req.user.id;

    try {
        const db = getDB();

        // Update basic fields
        await db.run(
            `UPDATE users SET 
                business_category = COALESCE(?, business_category),
                turnover = COALESCE(?, turnover),
                employee_count = COALESCE(?, employee_count)
            WHERE id = ?`,
            [business_category, turnover, employee_count, userId]
        );

        // Update Password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ADMIN ROUTES check
// ==========================================
// All routes below require Admin role
router.use(authorizeRole('admin'));

// Get all users
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const users = await db.all('SELECT id, username, role, status, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new user (Admin only)
router.post('/', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const db = getDB();
        const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, role || 'user', 'active']
        );

        res.status(201).json({
            id: result.lastID,
            username,
            role: role || 'user',
            status: 'active'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user (Role only for now)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent Admin from demoting themselves (basic check, can be improved)
    if (parseInt(id) === req.user.id && role !== 'admin') {
        return res.status(400).json({ error: 'Cannot demote your own admin account' });
    }

    try {
        const db = getDB();
        await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle User Status (Disable/Enable)
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'disabled'

    if (!['active', 'disabled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot change status of your own account' });
    }

    try {
        const db = getDB();
        await db.run('UPDATE users SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: `User ${status} successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    try {
        const db = getDB();
        await db.run('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
