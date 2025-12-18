const BASE_URL = 'http://localhost:3000/api';

async function test() {
    console.log('--- Starting V2 Verification ---');

    // 1. Create Item with Rate/HSN/Tax
    const itemRes = await fetch(`${BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Pro Widget',
            model_number: 'PW-100',
            rate: 1000,
            hsn_code: '8471',
            tax_rate: 18,
            description: 'Professional Widget'
        })
    });
    const item = await itemRes.json();
    console.log('Item Created:', item.id, item.rate === 1000 ? '✅' : '❌');

    // 2. Create Quote with this Item
    const quoteRes = await fetch(`${BASE_URL}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_name: 'Test Client V2',
            date: '2023-10-27',
            status: 'DRAFT',
            discount_type: 'PERCENT',
            discount_value: 10,
            items: [
                {
                    item_id: item.id,
                    name: item.name,
                    model_number: item.model_number,
                    rate: item.rate,
                    quantity: 2, // 2000
                    tax_rate: item.tax_rate, // 18% -> 360
                    description: 'Test Item'
                }
            ]
        })
    });
    const quote = await quoteRes.json();
    console.log('Quote Created:', quote.id, quote.message === 'Quotation created' ? '✅' : '❌');

    // 3. Convert to Invoice
    const invRes = await fetch(`${BASE_URL}/invoices/convert/${quote.id}`, { method: 'POST' });
    const inv = await invRes.json();
    console.log('Invoice Created:', inv.invoice_number, inv.id ? '✅' : '❌');

    // 4. Verify Invoice Details
    const invoicesRes = await fetch(`${BASE_URL}/invoices`);
    const invoices = await invoicesRes.json();
    const createdInv = invoices.find(i => i.id === inv.id);

    // Expected: 2000 (Subtotal) - 200 (10% Disc on what? My logic was Discount on result? No, logic was GrandTotal - Discount or Subtotal - Discount)
    // Let's check my logic in invoices.js
    // Logic: Total += Taxable + Tax. 
    // Taxable stored was (Rate*Qty). Tax = Taxable * Tax%.
    // Total = (2000) + (360) = 2360.
    // If Discount Type PERCENT, Total = Total * (1 - 10/100) = 2360 * 0.9 = 2124.

    console.log('Invoice Amount:', createdInv.total_amount, createdInv.total_amount === 2124 ? '✅ (2124)' : `❌ (${createdInv.total_amount})`);

    console.log('--- Verification Complete ---');
}

test().catch(console.error);
