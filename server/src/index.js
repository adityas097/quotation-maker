const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const path = require('path');

// Routes
app.use('/api/items', require('./routes/items'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/invoices', require('./routes/invoices'));

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

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize database', err);
});
