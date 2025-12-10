import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, FileCheck } from 'lucide-react';

const QuotationView = () => {
    const { id } = useParams();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuote();
    }, [id]);

    const fetchQuote = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/quotations/${id}`);
            const data = await res.json();
            setQuote(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConvertToInvoice = async () => {
        if (!window.confirm("Convert this quotation to an invoice?")) return;
        try {
            const res = await fetch(`http://localhost:3000/api/invoices/convert/${id}`, { method: 'POST' });
            if (res.ok) {
                alert("Invoice created successfully!");
                fetchQuote(); // Refresh to show updated status
            } else {
                const d = await res.json();
                alert("Error: " + d.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Calculations for display
    const calculateTotals = () => {
        if (!quote) return { subtotal: 0, tax: 0, total: 0 };

        let subtotal = 0;
        let totalTax = 0;
        let taxBreakdown = {}; // { "18": { taxable: 0, tax: 0 } }

        quote.items.forEach(item => {
            const qty = item.quantity || 0;
            const rate = item.rate || 0;
            const lineTotal = qty * rate;
            const taxRate = item.tax_rate || 0;
            const taxParams = taxBreakdown[taxRate] || { taxable: 0, tax: 0 };

            taxParams.taxable += lineTotal;
            taxParams.tax += lineTotal * (taxRate / 100);
            taxBreakdown[taxRate] = taxParams;

            subtotal += lineTotal;
            totalTax += lineTotal * (taxRate / 100);
        });

        let discountAmount = 0;
        if (quote.discount_type === 'PERCENT') {
            discountAmount = subtotal * (quote.discount_value / 100);
        } else {
            discountAmount = quote.discount_value || 0;
        }

        const grandTotal = subtotal + totalTax - discountAmount;

        return { subtotal, totalTax, discountAmount, grandTotal, taxBreakdown };
    };

    if (loading || !quote) return <div className="p-8 text-center">Loading...</div>;

    const { subtotal, totalTax, discountAmount, grandTotal, taxBreakdown } = calculateTotals();
    const isInvoice = quote.status === 'INVOICED' || quote.status === 'PAID';

    return (
        <div className="max-w-4xl mx-auto print-container" style={{ padding: '20px' }}>
            <div className="flex-between mb-6 no-print">
                <div className="flex gap-2">
                    <Link to="/quotations" className="btn btn-secondary">
                        <ArrowLeft size={16} /> Back
                    </Link>
                    {!isInvoice && (
                        <button onClick={handleConvertToInvoice} className="btn btn-success">
                            <FileCheck size={16} /> Convert to Invoice
                        </button>
                    )}
                </div>
                <button onClick={() => window.print()} className="btn btn-primary">
                    <Printer size={16} /> Print / Save PDF
                </button>
            </div>

            <div className="card" style={{ minHeight: '80vh', border: '1px solid #eee', padding: '40px' }}>
                {/* Header */}
                <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', lineHeight: 1, marginBottom: '0.5rem' }}>
                            {isInvoice ? 'INVOICE' : 'QUOTATION'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                            #{isInvoice ? (quote.invoice_number || `INV-REF-${quote.id}`) : `QT-${quote.id}`}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{quote.client_name}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Date: {quote.date}</p>
                        {isInvoice && <span className="badge badge-success" style={{ marginTop: '5px', display: 'inline-block' }}>INVOICED</span>}
                    </div>
                </div>

                {/* Items Table */}
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '10px', textAlign: 'left' }}>#</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Item & Description</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>HSN</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Qty</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Rate</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{index + 1}</td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.model_number}</div>
                                        {item.description && <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.description}</div>}
                                    </td>
                                    <td style={{ padding: '10px' }}>{item.hsn_code}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{item.quantity}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{item.rate?.toFixed(2)}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{(item.quantity * item.rate).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer: Tax Analysis & Totals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '3rem' }}>

                    {/* Tax Analysis */}
                    <div>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tax Analysis</h4>
                        <table style={{ width: '100%', fontSize: '0.85rem', border: '1px solid #eee' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa' }}>
                                    <th style={{ padding: '5px', textAlign: 'left' }}>Tax Class</th>
                                    <th style={{ padding: '5px', textAlign: 'right' }}>Taxable</th>
                                    <th style={{ padding: '5px', textAlign: 'right' }}>Tax Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(taxBreakdown).map(([rate, data]) => (
                                    <tr key={rate} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '5px' }}>GST {rate}%</td>
                                        <td style={{ padding: '5px', textAlign: 'right' }}>{data.taxable.toFixed(2)}</td>
                                        <td style={{ padding: '5px', textAlign: 'right' }}>{data.tax.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                            <span>Sub Total:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--danger)' }}>
                                <span>Discount:</span>
                                <span>- ₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                            <span>Tax:</span>
                            <span>₹{totalTax.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #ddd', fontSize: '1.25rem', fontWeight: 700 }}>
                            <span>Grand Total:</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            <p>Amount in Words: {convertNumberToWords(Math.round(grandTotal))} Only</p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <p>This is a computer generated document.</p>
                </div>
            </div>

            <style>{`
        @media print {
          .no-print { display: none !important; }
          .app-container { min-height: auto; width: 100%; margin: 0; padding: 0; }
          .navbar { display: none; }
          .card { box-shadow: none; border: none !important; padding: 0 !important; }
          body { background: white; margin: 0; padding: 0; }
          .print-container { max-width: 100% !important; margin: 0 !important; }
        }
      `}</style>
        </div>
    );
};

// Simple Number to Words Converter (Indian Format approx)
function convertNumberToWords(amount) {
    // Basic placeholder. Real implementation needs a library or a bigger function.
    // For this demo, just returning the number string or a placeholder.
    // Implementing a simple version...
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (amount === 0) return "Zero";
    return `(Rupees ${amount})`; // Placeholder
}

export default QuotationView;
