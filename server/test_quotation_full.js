// const fetch = require('node-fetch'); // Native fetch in Node 18+

async function test() {
    console.log('Testing Create Quotation...');
    const payload = {
        client_name: "Test Client " + Date.now(),
        client_address: "123 Test St, Tech Park",
        client_gstin: "29AAAAA0000A1Z5",
        date: "2024-12-11",
        status: "DRAFT",
        discount_type: "PERCENT",
        discount_value: 10,
        items: [
            {
                name: "Test Item 1",
                model_number: "T-100",
                rate: 1000,
                quantity: 2,
                tax_rate: 18,
                hsn_code: "8517",
                is_manual: true
            }
        ]
    };

    try {
        const res = await fetch('http://localhost:3000/api/quotations', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            console.error('Create failed:', await res.text());
            return;
        }

        const data = await res.json();
        console.log('Created Quotation ID:', data.id);

        console.log('Fetching Quotation...');
        const res2 = await fetch(`http://localhost:3000/api/quotations/${data.id}`);
        const quote = await res2.json();

        console.log('--- Quote Details ---');
        console.log('Client:', quote.client_name);
        console.log('Address:', quote.client_address); // Should match
        console.log('GSTIN:', quote.client_gstin); // Should match
        console.log('Discount:', quote.discount_value, quote.discount_type); // Should match
        console.log('Items:', quote.items.length);
        console.log('Item 1 Rate:', quote.items[0].rate); // Should match
        console.log('Item 1 Tax:', quote.items[0].tax_rate); // Should match

        if (quote.client_address === payload.client_address && quote.items[0].rate === payload.items[0].rate) {
            console.log('VERIFICATION SUCCESSFUL');
        } else {
            console.log('VERIFICATION FAILED');
        }

    } catch (err) {
        console.error(err);
    }
}

test();
