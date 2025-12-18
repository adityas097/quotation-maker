const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { JWT_SECRET } = require('../config');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = getDB();

        // 1. Load the Authenticated User (Identity)
        const identity = await db.get('SELECT id, username, role, status, parent_user_id, permissions FROM users WHERE id = ?', [decoded.id]);

        if (!identity) {
            return res.status(403).json({ error: 'User not found' });
        }

        if (identity.status === 'disabled') {
            return res.status(403).json({ error: 'Account is disabled. Please contact admin.' });
        }

        // 2. Handle Context Switching
        const contextHeader = req.headers['x-context-id'];
        let contextUser = identity; // Default to self

        if (contextHeader) {
            const targetId = parseInt(contextHeader);

            // Authorization for Context Switch
            if (identity.role === 'admin') {
                // Multi-tenancy: Admin can impersonate anyone
                // Just verify existence if strict, but for performance we might skip or fetch
                const target = await db.get('SELECT id, username, role, status, parent_user_id, permissions FROM users WHERE id = ?', [targetId]);
                if (target) contextUser = target;
            } else if (identity.parent_user_id) {
                // Sub-User (Level 2)
                // Can switch to Parent (Level 1)
                if (targetId === identity.parent_user_id) {
                    const parent = await db.get('SELECT id, username, role, status, parent_user_id, permissions FROM users WHERE id = ?', [targetId]);
                    if (parent) contextUser = parent;
                } else if (targetId !== identity.id) {
                    return res.status(403).json({ error: 'Unauthorized context switch' });
                }
            } else {
                // Level 1 User
                // Can switch to Self (default) or arguably SubUsers (but usually not needed for data ownership)
                if (targetId !== identity.id) {
                    return res.status(403).json({ error: 'Unauthorized context switch' });
                }
            }
        } else if (identity.parent_user_id) {
            // Default Context for SubUser: Their Parent (Organization)
            // This ensures they see the Org data by default
            const parent = await db.get('SELECT id, username, role, status, parent_user_id, permissions FROM users WHERE id = ?', [identity.parent_user_id]);
            if (parent) contextUser = parent;
        }

        // 3. Attach to Request
        req.identity = identity; // The actual logged-in user
        req.user = contextUser;  // The effective user for data ownership

        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.identity) {
            // Fallback if identity not set (should not happen if authenticated)
            if (req.user && roles.includes(req.user.role)) return next();
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!roles.includes(req.identity.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole };
