const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const DB_PATH = './server/database.sqlite';

const PRODUCTS = [
    { model: "HIK-BIOMETRIC-DS-KIT320MWX", desc: "BIOMETRIC(FACE+KEY+CARD)", price: 3600, type: "Bio" },
    { model: "DS-7104HGHI-K1", desc: "4 CHANNEL DVR ECO", price: 2300, type: "DVR" },
    { model: "DS-7108HGHI-K1", desc: "8 CHANNEL DVR ECO", price: 3250, type: "DVR" },
    { model: "DS-7116HGHI-K1", desc: "16 CHANNEL DVR ECO", price: 5880, type: "DVR" },
    { model: "DS-2CE76D0T-ITPFS", desc: "2MP HD DOME WITH MIC", price: 880, type: "Cam" },
    { model: "DS-2CE16D0T-ITPFS", desc: "2MP HD BULLET WITH MIC", price: 930, type: "Cam" },
    { model: "DS-2CE76D0T-LPFS", desc: "2MP HD DOME COLOUR WITH MIC SMART HYBRID LIGHT", price: 1130, type: "Cam" },
    { model: "DS-2CE16D0T-LPFS", desc: "2MP HD BULLET COLOUR WITH MIC SMART HYBRID LIGHT", price: 1250, type: "Cam" },
    { model: "DS-2CE17D0T-LFS 6MM", desc: "2MP HD BULLET COLOUR WITH MIC SMART HYBRID LIGHT 6MM", price: 1770, type: "Cam" },
    { model: "DS-2CE70DF0T-PF 3.6MM", desc: "2MP HD DOME FULL COLOUR WITHOUT MIC", price: 1660, type: "Cam" },
    { model: "DS-2CE70DF0T-PFS 3.6MM", desc: "2MP HD DOME FULL COLOUR WITH MIC", price: 1730, type: "Cam" },
    { model: "DS-2CE10DF0T-PFS 3.6MM", desc: "2MP HD BULLET FULL COLOUR WITH MIC", price: 1790, type: "Cam" },
    { model: "DVR-IDS-7104HQHI-M1/S", desc: "4 CHANNEL DVR REGULAR UP TO 5MP", price: 3530, type: "DVR" },
    { model: "DVR-IDS-7108HQHI-M1/S", desc: "8 CHANNEL DVR REGULAR UP TO 5MP", price: 5080, type: "DVR" },
    { model: "DVR-IDS-71016HQHI-M1/S", desc: "16 CHANNEL DVR REGULAR UP TO 5MP", price: 8770, type: "DVR" },
    { model: "DS-2CE76H0T-ITPFS", desc: "5 MP HD DOME WITH MIC", price: 1370, type: "Cam" },
    { model: "DS-2CE16H0T-ITPFS", desc: "5 MP HD BULLET WITH MIC", price: 1320, type: "Cam" },
    { model: "DS-2CE76K0T-LPFS", desc: "3K DOME COLOUR WITH MIC SMART HYBRID LIGHT", price: 1640, type: "Cam" },
    { model: "DS-2CE16K0T-LPFS", desc: "3K BULLET COLOUR WITH MIC SMART HYBRID LIGHT", price: 1600, type: "Cam" },
    { model: "DS-2CE70KF0T-PFS", desc: "3K DOME FULL COLOUR WITH MIC", price: 2200, type: "Cam" },
    { model: "DS-2CE10KF0T-PFS", desc: "3K BULLET FULL COLOUR WITH MIC", price: 2310, type: "Cam" },
    { model: "IDS-7204HUHI-M1/FA", desc: "5MP 04 CHANNEL DVR UP TO 8MP", price: 5520, type: "DVR" },
    { model: "IDS-7208HUHI-M1/FA", desc: "5MP 08 CHANNEL DVR UP TO 8MP", price: 8440, type: "DVR" },
    { model: "DS-2CE1AC0T-IRP", desc: "1MP HD CAMERA ECO", price: 590, type: "Cam" },
    { model: "DS-2CD1041G0-I", desc: "4 MP IP BULLET NORMAL", price: 3640, type: "Cam" },
    { model: "DS-2CD1383G0E-I", desc: "8MP IP DOME", price: 8210, type: "Cam" },
    { model: "DS-2CD1083G0E-I", desc: "8MP IP BULLET", price: 8320, type: "Cam" },
    { model: "DS-7104NI-Q1/M", desc: "4 CHANNEL NVR Q1/M", price: 3540, type: "NVR" },
    { model: "DS-7108NI-Q1/M", desc: "8 CHANNEL NVR Q1/M", price: 4140, type: "NVR" },
    { model: "DS-71016NI-Q1/M", desc: "16 CHANNEL NVR Q1/M", price: 5760, type: "NVR" },
    { model: "DS-7604NI-Q1", desc: "4 CHANNEL NVR Q1", price: 4920, type: "NVR" },
    { model: "DS-7604NXI-K1", desc: "4 CHANNEL NVR K1", price: 6700, type: "NVR" },
    { model: "DS-7608NXI-K1", desc: "8 CHANNEL NVR K1", price: 7260, type: "NVR" },
    { model: "DS-7616NXI-K1", desc: "16 CHANNEL NVR K1", price: 8690, type: "NVR" },
    { model: "DS-7632NXI-K2", desc: "32 CHANNEL NVR 2 SATA", price: 15200, type: "NVR" },
    { model: "DS-3E0105P-E/M", desc: "4+1 POE NORMAL", price: 1670, type: "Switch" },
    { model: "DS-3E0109P-E/M", desc: "8+1 POENORMAL", price: 2490, type: "Switch" },
    { model: "DS-3E0318P-E/M(B)", desc: "16+2 PORT UPLINK GIGA POE", price: 9760, type: "Switch" },
    { model: "DS-KIS204T VDP", desc: "204 VDP", price: 4220, type: "VDP" },
    { model: "DS-KIS603T VDP", desc: "603 VDP", price: 11620, type: "VDP" },
    { model: "DS-KIS602T VDP", desc: "602 VDP", price: 14720, type: "VDP" },
    { model: "2CD1043G2-LIDUF/4G", desc: "4 MP IP BULLET HYBRID +4G CAMERA", price: 3040, type: "Cam" },
    { model: "DS-2DEC400MWG-4G-4MM", desc: "4G +NETWORK CAMERA", price: 3630, type: "Cam" },
    { model: "H8C-3MP-POE", desc: "H8C 3MP POE CAMERA", price: 4230, type: "Cam" },
];

const HSN_MAP = {
    "Cam": "85258090", // CCTV/Cameras
    "DVR": "85219090", // Video Recording
    "NVR": "85219090",
    "Switch": "85176290", // Network Switch
    "VDP": "85176990", // Video Door Phone
    "Bio": "85437099" // Biometric
};

async function importHikvision() {
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log(`Processing ${PRODUCTS.length} items...`);

    const stmtInsert = await db.prepare(`
        INSERT INTO items (model_number, name, description, rate, hsn_code, tax_rate) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Check for duplicates to avoid constraint errors if we re-run, or just upsert?
    // User wants to "Import these", implying add. I will use simple insert for now, 
    // or better, check if exists and update price.

    // Actually, sqlite3 with simple INSERT might fail on UNIQUE constraint if model_number was unique?
    // But our schema: model_number text, name text, etc. No unique on model number.
    // We should probably check if *model* exists to avoid duplicate entries of same product.

    const stmtCheck = await db.prepare('SELECT id FROM items WHERE model_number = ?');
    const stmtUpdate = await db.prepare('UPDATE items SET rate = ?, name = ?, description = ? WHERE id = ?');

    let inserted = 0;
    let updated = 0;

    await db.exec('BEGIN TRANSACTION');

    for (const p of PRODUCTS) {
        if (p.price <= 0) continue; // Skip 0 price

        // 1. Prefix Name
        const name = `Hikvision ${p.desc}`; // "Hikvision " + Description as requested (or model)
        // User said: "mention Hikvision in each products name"
        // Let's format nicely: "Hikvision [Model] [Description]" or just "Hikvision [Description]"
        // The image has descriptions like "2MP HD DOME". 
        // Let's do: "Hikvision " + p.desc. 
        // Also ensure Model is stored.

        // 2. Add 20% Margin
        const finalPrice = Math.round(p.price * 1.20);

        // 3. Tax 18%
        const tax = 18;

        // 4. HSN
        const hsn = HSN_MAP[p.type] || "8529";

        const existing = await stmtCheck.get(p.model);

        if (existing) {
            await stmtUpdate.run(finalPrice, name, p.desc, existing.id);
            updated++;
        } else {
            await stmtInsert.run(p.model, name, p.desc, finalPrice, hsn, tax);
            inserted++;
        }
    }

    await db.exec('COMMIT');
    console.log(`Hikvision Import Done. Inserted: ${inserted}, Updated: ${updated}`);
    await db.close();
}

importHikvision().catch(console.error);
