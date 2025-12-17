const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDB } = require('../db');
const { authorizeRole } = require('../middleware/auth');

// ==========================================
// USER PROFILE ROUTES (Accessible to all authenticated users)
// ==========================================

// GET Current User Profile (Identity)
router.get('/profile', async (req, res) => {
    try {
        const db = getDB();
        // Return the identity (actual user), not the context
        const user = await db.get(
            'SELECT id, username, role, status, business_category, turnover, employee_count, permissions, parent_user_id FROM users WHERE id = ?',
            [req.identity.id]
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
    const userId = req.identity.id; // Correctly identifying the logged-in user

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
// USER MANAGEMENT ROUTES
// ==========================================
// Accessible by Admin (Level 0) and Org User (Level 1)
// Sub-users (Level 2) are blocked by the following check:

router.use((req, res, next) => {
    // Check if user is Admin or Level 1 User
    // Level 1 User has role 'user' and NO parent_user_id (usually)
    // Or we explicitly check roles.

    const allowedRoles = ['admin', 'user'];
    if (!allowedRoles.includes(req.identity.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient privileges to manage users' });
    }

    // Additional check: Level 2 Users might have role 'subuser' (future proofing)
    if (req.identity.role === 'subuser' || req.identity.parent_user_id) {
        return res.status(403).json({ error: 'Forbidden: Sub-users cannot manage other users' });
    }

    next();
});

// Get all users (Scoped)
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        let users;

        if (req.identity.role === 'admin') {
            // Admin sees all
            users = await db.all('SELECT id, username, role, status, created_at, parent_user_id FROM users ORDER BY created_at DESC');
        } else {
            // Org User sees ONLY their sub-users
            users = await db.all('SELECT id, username, role, status, created_at, permissions FROM users WHERE parent_user_id = ? ORDER BY created_at DESC', [req.identity.id]);
        }
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new user
router.post('/', async (req, res) => {
    const { username, password, role, permissions } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Role Validation
    let targetRole = 'user'; // Default
    let parentId = null;
    let perms = null;

    if (req.identity.role === 'admin') {
        // Admin can create 'admin', 'user', or 'subuser' (though subuser usually needs parent)
        if (role) targetRole = role;
    } else {
        // Level 1 User can ONLY create 'subuser'
        targetRole = 'subuser';
        parentId = req.identity.id;

        // Validate Permissions JSON
        if (permissions) {
            try {
                // Ensure valid JSON
                JSON.parse(JSON.stringify(permissions)); // Checking structure roughly
                perms = JSON.stringify(permissions);
            } catch (e) {
                return res.status(400).json({ error: "Invalid permissions format" });
            }
        }
    }

    try {
        const db = getDB();
        const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.run(
            'INSERT INTO users (username, password_hash, role, status, parent_user_id, permissions) VALUES (?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, targetRole, 'active', parentId, perms]
        );

        res.status(201).json({
            id: result.lastID,
            username,
            role: targetRole,
            parent_user_id: parentId,
            status: 'active'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user settings (Role, Status, Permissions)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { role, status, permissions } = req.body;

    // Permissions Check
    const db = getDB();
    const targetUser = await db.get('SELECT id, parent_user_id FROM users WHERE id = ?', [id]);

    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (req.identity.role !== 'admin') {
        // Org User Check: Must be the parent
        if (targetUser.parent_user_id !== req.identity.id) {
            return res.status(403).json({ error: 'Unauthorized to modify this user' });
        }
        // Org User cannot change Role (Subuser is fixed)
        if (role && role !== 'subuser') {
            return res.status(403).json({ error: 'Cannot change role of subuser' });
        }
    }

    // Prevent Self-Destruction (Role/Status)
    if (parseInt(id) === req.identity.id) {
        if (role && role !== req.identity.role) return res.status(400).json({ error: 'Cannot change your own role' });
        if (status && status === 'disabled') return res.status(400).json({ error: 'Cannot disable your own account' });
    }

    try {
        // Construct Update Query dynamically
        const updates = [];
        const params = [];

        if (req.identity.role === 'admin' && role) {
            updates.push('role = ?');
            params.push(role);
        }

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }

        if (permissions) {
            updates.push('permissions = ?');
            params.push(JSON.stringify(permissions));
        }

        if (updates.length > 0) {
            params.push(id);
            await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (parseInt(id) === req.identity.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    try {
        const db = getDB();

        // Scope Check
        if (req.identity.role !== 'admin') {
            const targetUser = await db.get('SELECT parent_user_id FROM users WHERE id = ?', [id]);
            if (!targetUser || targetUser.parent_user_id !== req.identity.id) {
                return res.status(403).json({ error: 'Unauthorized to delete this user' });
            }
        }

        await db.run('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
