const { initDB } = require('./src/db');
const fs = require('fs');
const path = require('path');

// HSN Mapping Config
const HSN_MAP = {
    'Graphic Card': '847330',
    'Cartridge': '844399',
    'Hard Disk': '847170',
    'Keyboard': '847160',
    'RAM': '847330',
    'Monitor': '852852',
    'Motherboard': '847330',
    'Mouse': '847160',
    'Pendrive': '852351',
    'Processor': '847330',
    'Router': '851762',
    'SSD': '852351',
    'UPS': '850440',
    'Network': '851762',
    'CCTV Power': '850440',
    'Camera': '852580',
    'Cable': '854442',
    'DVR': '852190',
    'NVR': '852190',
    'Connector': '853690',
    'Switch': '851762',
    'Rack': '940320'
};

const DEFAULT_HSN = '8471'; // General Computing
const MARGIN_MULTIPLIER = 1.18;
const TAX_RATE = 18;

async function importScannedData() {
    try {
        const db = await initDB();
        const dataPath = path.join(__dirname, 'scanned_products.json');

        if (!fs.existsSync(dataPath)) {
            console.error('Data file not found!');
            return;
        }

        const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`Processing ${rawData.length} items...`);

        await db.exec('BEGIN TRANSACTION');
        const stmt = await db.prepare('INSERT INTO items (model_number, name, description, rate, hsn_code, tax_rate) VALUES (?, ?, ?, ?, ?, ?)');

        let count = 0;
        for (const item of rawData) {
            // Apply Logic
            const hsn = HSN_MAP[item.category] || DEFAULT_HSN;

            // Calculate Rate: Raw Price + 18% Margin
            // Usually margin is added to cost to get selling price.
            // "Add 18% margin to the prices" -> Price = Raw * 1.18
            const finalRate = Math.ceil(item.raw_price * MARGIN_MULTIPLIER);

            await stmt.run(
                item.model || '',
                item.name,
                item.description || item.category, // Use category as desc if empty
                finalRate,
                hsn,
                TAX_RATE
            );
            count++;
        }

        await stmt.finalize();
        await db.exec('COMMIT');

        console.log(`Successfully imported ${count} items with 18% margin and 18% Tax.`);

    } catch (err) {
        console.error('Import Error:', err);
    }
}

importScannedData();
