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
        const user = await db.get('SELECT id, username, role, status FROM users WHERE id = ?', [decoded.id]);

        if (!user) {
            return res.status(403).json({ error: 'User not found' });
        }

        if (user.status === 'disabled') {
            return res.status(403).json({ error: 'Account is disabled. Please contact admin.' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole };
