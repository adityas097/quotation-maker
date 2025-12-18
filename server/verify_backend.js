const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('Starting Verification...');

    // 1. Create Item
    const itemRes = await request({
        hostname: 'localhost', port: 3000, path: '/api/items', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { model_number: 'TEST-01', name: 'Test Item', description: 'A test item' });

    if (itemRes.status === 201) console.log('✅ Item created');
    else console.error('❌ Create Item failed', itemRes);

    // 2. Create Client
    const clientRes = await request({
        hostname: 'localhost', port: 3000, path: '/api/clients', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { name: 'Test Client', email: 'test@example.com' });

    if (clientRes.status === 201 || clientRes.status === 409) console.log('✅ Client created/found');
    else console.error('❌ Create Client failed', clientRes);

    // 3. Create Quotation
    const quoteRes = await request({
        hostname: 'localhost', port: 3000, path: '/api/quotations', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        client_name: 'Test Client',
        date: '2025-01-01',
        items: [{ name: 'Test Item', quantity: 2, model_number: 'TEST-01', is_manual: false }]
    });

    if (quoteRes.status === 201) console.log('✅ Quotation created');
    else console.error('❌ Create Quotation failed', quoteRes.body);

    // 4. List Quotations
    const listRes = await request({
        hostname: 'localhost', port: 3000, path: '/api/quotations', method: 'GET'
    });

    if (listRes.status === 200 && listRes.body.length > 0) console.log(`✅ Listed ${listRes.body.length} quotations`);
    else console.error('❌ List Quotations failed', listRes);

    console.log('Verification Complete.');
}

runTests().catch(console.error);
