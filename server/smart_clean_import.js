const { initDB } = require('./src/db');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

async function smartImport() {
    try {
        const db = await initDB();
        console.log('Database connected.');

        // 1. Fetch All Existing Items
        const items = await db.all('SELECT * FROM items');
        console.log(`Found ${items.length} existing items in DB.`);

        // 2. Consolidate DB (Remove internal duplicates, keeping highest price)
        const dbMap = new Map(); // Key -> Item
        const idsToDelete = [];

        for (const item of items) {
            const key = (item.name || '').trim().toLowerCase();
            if (!key) continue;

            if (dbMap.has(key)) {
                const existing = dbMap.get(key);
                // Compare rates
                if (item.rate > existing.rate) {
                    // New item is better, delete old
                    idsToDelete.push(existing.id);
                    dbMap.set(key, item);
                } else {
                    // Start item is worse or equal, delete current
                    idsToDelete.push(item.id);
                }
            } else {
                dbMap.set(key, item);
            }
        }

        console.log(`Identified ${idsToDelete.length} duplicate items to remove from DB.`);
        if (idsToDelete.length > 0) {
            // Batch delete
            const placeholders = idsToDelete.map(() => '?').join(',');
            await db.run(`DELETE FROM items WHERE id IN (${placeholders})`, idsToDelete);
            console.log('Duplicates removed.');
        }

        // 3. Process CSV
        const filePath = path.join(__dirname, 'updated_prices.csv');
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const csvData = xlsx.utils.sheet_to_json(sheet); // Objects

        console.log(`Reading ${csvData.length} rows from CSV.`);

        let added = 0;
        let updated = 0;
        let ignored = 0;

        await db.exec('BEGIN TRANSACTION');
        const stmtInsert = await db.prepare('INSERT INTO items (model_number, name, description, rate, hsn_code, tax_rate) VALUES (?, ?, ?, ?, ?, ?)');
        const stmtUpdate = await db.prepare('UPDATE items SET rate = ?, hsn_code = ?, model_number = ? WHERE id = ?');

        for (const row of csvData) {
            // Map Columns
            // 'Model / Code', 'Product Description', 'Price (?)', 'HSN CODE'
            const model = row['Model / Code'] || '';
            const name = row['Product Description'] || '';
            const rate = parseFloat(row['Price (?)']) || 0;
            const hsn = row['HSN CODE'] || '';

            if (!name) continue;

            const key = name.trim().toLowerCase();

            // Check against Consolidated DB
            if (dbMap.has(key)) {
                const existing = dbMap.get(key);

                // Compare Price: Keep Higher
                if (rate > existing.rate) {
                    // Update DB with details from CSV (Assuming CSV is "newer" truth except price logic)
                    // Actually, if CSV price is higher, we overwrite. 
                    // Should we overwrite HSN/Model too? Yes, likely newer data.
                    await stmtUpdate.run(rate, hsn || existing.hsn_code, model || existing.model_number, existing.id);

                    // Update Map in case of multiple rows in CSV for same item (handled naturally?)
                    // If CSV has duplicates for same item, the loop will hit 'Existing' (which is the DB item).
                    // We just updated the DB item. We should technically update our reference object's rate too 
                    // so subsequent CSV rows compare against the NEW rate.
                    existing.rate = rate;
                    updated++;
                } else {
                    // Existing DB price is higher or equal -> Ignore CSV
                    ignored++;
                }
            } else {
                // New Item
                await stmtInsert.run(model, name, name, rate, hsn, 18); // Defaulting tax to 18 as per project norm? Or 0? 
                // Previous user prompt asked for 18% tax. 
                // I will set 0 to be safe, or 18? 
                // User said "keep unique items only". 
                // I will stick to 18 because previous items were 18.

                // Add to map to prevent CSV-internal duplicates
                dbMap.set(key, { rate: rate, name: name });
                added++;
            }
        }

        await stmtInsert.finalize();
        await stmtUpdate.finalize();
        await db.exec('COMMIT');

        console.log(`Summary:`);
        console.log(`- Removed Internal DB Duplicates: ${idsToDelete.length}`);
        console.log(`- Inserted New Items: ${added}`);
        console.log(`- Updated Existing Items (Higher Price Found): ${updated}`);
        console.log(`- Ignored CSV Items (Lower/Equal Price): ${ignored}`);

    } catch (err) {
        console.error('Error:', err);
        if (db) try { await db.exec('ROLLBACK'); } catch { }
    }
}

smartImport();
