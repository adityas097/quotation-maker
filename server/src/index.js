const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/items', require('./routes/items'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/invoices', require('./routes/invoices'));

app.get('/', (req, res) => {
    res.send('QuoteMaker API is running');
});

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize database', err);
});
