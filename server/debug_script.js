const xlsx = require('xlsx');
const path = require('path');

try {
    const filePath = path.join(__dirname, '../debug_prices.xlsx');
    console.log(`Reading file from: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Get headers
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (json.length > 0) {
        console.log('Headers:', JSON.stringify(json[0]));
        console.log('First row data:', JSON.stringify(json[1]));
    } else {
        console.log('Sheet is empty');
    }
} catch (err) {
    console.error('Error reading file:', err);
}
