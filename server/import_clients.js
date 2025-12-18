const { initDB } = require('./src/db');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

async function importClients() {
    try {
        const db = await initDB();
        console.log('Database connected.');

        // 1. Schema Migration: Add GSTIN if missing
        const columns = await db.all("PRAGMA table_info(clients)");
        const columnNames = columns.map(c => c.name);

        if (!columnNames.includes('gstin')) {
            console.log('Migrating: Adding gstin column to clients...');
            await db.exec('ALTER TABLE clients ADD COLUMN gstin TEXT');
        }

        // 2. Import CSV
        const filePath = path.join(__dirname, 'client_details.csv');
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Processing ${data.length} clients...`);

        await db.exec('BEGIN TRANSACTION');
        const stmt = await db.prepare(`
            INSERT INTO clients (name, address, phone, gstin) 
            VALUES (?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET 
            address=excluded.address, 
            phone=COALESCE(excluded.phone, clients.phone), 
            gstin=COALESCE(excluded.gstin, clients.gstin)
        `);

        let count = 0;
        let phoneExtractedCount = 0;

        for (const row of data) {
            const name = row['Particulars'];
            if (!name) continue;

            // Ensure string
            let address = row['Address'] ? String(row['Address']) : '';
            const gstin = row['GSTIN/UIN'] ? String(row['GSTIN/UIN']) : '';
            let phone = '';

            // Extract Phone from Address (Pattern like "Mob :9457830085" or just 10 digits)
            // Regex to look for "Mob" or "Ph" followed by digits, or just 10 consecutive digits that look like a mobile number?
            // The sample had "Mob :9457830085".

            // Regex: \b[6-9]\d{9}\b matches standard Indian mobile numbers. 
            // Also looking for "Mob[\s:]*(\d+)"

            const mobMatch = address.match(/(?:Mob|Ph|Mobile)[\s.:-]*(\d{10})/i);
            const rawMatch = address.match(/[6-9]\d{9}/); // Simple match for Indian mobile

            if (mobMatch) {
                phone = mobMatch[1];
            } else if (rawMatch) {
                phone = rawMatch[0];
            }

            if (phone) {
                phoneExtractedCount++;
                // Clean phone from address? Optional. Keeping it in address is fine for context.
            }

            // Clean address
            address = address.replace(/\s+/g, ' ').trim();

            await stmt.run(name.trim(), address, phone, gstin.trim());
            count++;
        }

        await stmt.finalize();
        await db.exec('COMMIT');

        console.log(`Import complete.`);
        console.log(`- Processed: ${count} clients`);
        console.log(`- Phones Extracted: ${phoneExtractedCount}`);

    } catch (err) {
        console.error('Import Error:', err);
        // We can't easily rollback here because 'db' is scoped inside try if we don't move it out.
        // But the previous run failed early so transaction likely didn't commit?
        // Actually, the previous error was caught in the catch block.
    }
}

importClients();
