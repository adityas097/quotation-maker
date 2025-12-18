const xlsx = require('xlsx');
const path = require('path');
const { getDB } = require('./src/db'); // Adjust path as needed

// Mock DB context
// Since I can't easily spin up the full express app in a script without potential port conflicts or dependency chains,
// I will just test the logic logic in isolation if possible, OR
// I will hit the running server if it is running.
// Given I don't know if the server is running, I'll attempt to use curl (send_command) in the next step to hit the actual endpoint.
// But first I need to check if the server IS running or if I need to start it.

// Actually, I can just write a script that imports the 'items.js' logic? No, that's an express router.
// I will write a script that mimics the logic I just wrote to verify it works on the file.

const fs = require('fs');

async function testImport() {
    try {
        const filePath = path.join(__dirname, '../debug_prices.xlsx');
        const buffer = fs.readFileSync(filePath);
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Read ${data.length} rows`);

        let importedCount = 0;
        const validItems = [];

        for (const row of data) {
            // Normalize keys (COPIED LOGIC FROM SERVER)
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.trim().toLowerCase()] = row[key];
            });

            const getValue = (keys) => {
                for (const key of keys) {
                    if (normalizedRow[key] !== undefined) return normalizedRow[key];
                }
                return undefined;
            };

            const model = getValue(['model', 'model_number', 'model number']) || '';
            const name = getValue(['name', 'item name']);
            const desc = getValue(['description']) || '';
            let rate = getValue(['rate', 'price']) || 0;
            const hsn = getValue(['hsn', 'hsn code', 'hsn_code']) || '';
            let tax = getValue(['tax', 'tax_rate', 'tax rate', 'gst', 'gst%']) || 0;

            // Normalize Tax (0.18 -> 18)
            if (tax < 1 && tax > 0) {
                tax = tax * 100;
            }

            if (name) {
                validItems.push({ model, name, desc, rate, hsn, tax });
                importedCount++;
            }
        }

        console.log(`Successfully parsed ${importedCount} items`);
        if (validItems.length > 0) {
            console.log('Sample Item:', JSON.stringify(validItems[0], null, 2));
        }

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

testImport();
