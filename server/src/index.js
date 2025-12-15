require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : '*', // Strict CORS in production
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json());

const path = require('path');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/setup', require('./routes/setup'));

const { authenticateToken } = require('./middleware/auth');

// Protected Routes
app.use('/api/users', authenticateToken, require('./routes/users')); // New Admin Route
app.use('/api/items', authenticateToken, require('./routes/items'));
app.use('/api/clients', authenticateToken, require('./routes/clients'));
app.use('/api/quotations', authenticateToken, require('./routes/quotations'));
app.use('/api/invoices', authenticateToken, require('./routes/invoices'));
app.use('/api/companies', authenticateToken, require('./routes/companies'));

// Determine Environment (Production vs Dev)
// In production (Hostinger), we serve the built frontend
// Serve static files from the React app (client/dist)
if (process.env.NODE_ENV === 'production' || process.argv.includes('--serve-client')) {
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('QuoteMaker API is running. In dev, run client separately.');
    });
}

// Fallback for any other request (if not handled above)
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' || process.argv.includes('--serve-client')) {
        res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'));
    } else {
        next();
    }
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize database', err);
});
