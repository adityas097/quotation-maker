import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, FileCheck } from 'lucide-react';

const QuotationView = () => {
    const { id } = useParams();
    const [quote, setQuote] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuote();
    }, [id]);

    const fetchQuote = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/quotations/${id}`);
            const data = await res.json();
            setQuote(data);
            if (data.company_snapshot) {
                try {
                    setCompany(typeof data.company_snapshot === 'string'
                        ? JSON.parse(data.company_snapshot)
                        : data.company_snapshot);
                } catch (e) { console.error(e); }
            }
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

    const convertNumberToWords = (amount) => {
        return `Rupees ${Math.round(amount)} Only`;
    }

    if (loading || !quote) return <div className="p-8 text-center">Loading...</div>;

    const { subtotal, totalTax, discountAmount, grandTotal, taxBreakdown } = calculateTotals();
    const isInvoice = quote.status === 'INVOICED' || quote.status === 'PAID';

    return (
        <div className="max-w-4xl mx-auto print-container" style={{ padding: '20px' }}>
            {/* Action Buttons */}
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

            {/* Main Document Card - Content Flow */}
            <div className="card quote-paper" style={{ minHeight: '80vh', border: '1px solid #ddd', padding: '40px', position: 'relative', marginBottom: '100px' }}>

                {/* Header: Company Details (From) - First Page Flow */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary-color)', paddingBottom: '20px', marginBottom: '20px' }}>
                    <div>
                        {company ? (
                            <>
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{company.name}</h1>
                                <p style={{ margin: '5px 0', fontSize: '1rem', fontWeight: 500 }}>{company.address}</p>
                                <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', marginTop: '5px' }}>
                                    {company.gstin && <span><strong>GSTIN:</strong> {company.gstin}</span>}
                                    {company.pan && <span><strong>PAN:</strong> {company.pan}</span>}
                                </div>
                                <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem' }}>
                                    {company.phone && <span style={{ marginRight: '15px' }}>📞 {company.phone}</span>}
                                    {company.email && <span>📧 {company.email}</span>}
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>ELIZA INFOTECH</h1>
                                <p style={{ margin: '5px 0', fontSize: '1rem', fontWeight: 500 }}>29/20, 8 MARLA, PANIPAT - 132103</p>
                                <p style={{ margin: '0', fontSize: '0.9rem' }}><strong>GSTIN:</strong> 06HHQPS1919L1ZJ</p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                    <span style={{ marginRight: '15px' }}>📞 +91 893082398</span>
                                    <span style={{ marginRight: '15px' }}>🌐 elizainfotech.com</span>
                                    <br />
                                    <span>📧 infotecheliza@gmail.com</span>
                                </p>
                            </>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '1.5rem', color: '#555', marginTop: '0' }}>{isInvoice ? 'TAX INVOICE' : 'QUOTATION'}</h2>
                        <table style={{ float: 'right', fontSize: '0.9rem' }}>
                            <tbody>
                                <tr>
                                    <td style={{ textAlign: 'right', paddingRight: '10px', color: '#666' }}># :</td>
                                    <td style={{ fontWeight: 600 }}>{isInvoice ? quote.invoice_number : `QT-${quote.id}`}</td>
                                </tr>
                                <tr>
                                    <td style={{ textAlign: 'right', paddingRight: '10px', color: '#666' }}>Date :</td>
                                    <td style={{ fontWeight: 600 }}>{quote.date}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Client Details (To) */}
                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#888', marginBottom: '5px' }}>Bill To:</h3>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 5px 0' }}>{quote.client_name}</p>
                    {quote.client_address && <p style={{ margin: '0', fontSize: '0.95rem', maxWidth: '300px' }}>{quote.client_address}</p>}
                    {quote.client_gstin && <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}><strong>GSTIN:</strong> {quote.client_gstin}</p>}
                </div>

                {/* Items Table - Natural Flow */}
                <div className="table-container" style={{ marginBottom: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <th style={{ textAlign: 'left', padding: '10px' }}>#</th>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Description</th>
                                <th style={{ textAlign: 'left', padding: '10px' }}>HSN</th>
                                <th style={{ textAlign: 'right', padding: '10px' }}>Qty</th>
                                <th style={{ textAlign: 'right', padding: '10px' }}>Rate</th>
                                <th style={{ textAlign: 'right', padding: '10px' }}>Tax</th>
                                <th style={{ textAlign: 'right', padding: '10px' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map((item, index) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{index + 1}</td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                                        {item.model_number && <div style={{ fontSize: '0.8rem', color: '#666' }}>Model: {item.model_number}</div>}
                                        {item.description && <div style={{ fontSize: '0.85rem', color: '#555' }}>{item.description}</div>}
                                    </td>
                                    <td style={{ padding: '10px' }}>{item.hsn_code}</td>
                                    <td style={{ textAlign: 'right', padding: '10px' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right', padding: '10px' }}>₹{item.rate.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '10px' }}>{item.tax_rate}%</td>
                                    <td style={{ textAlign: 'right', padding: '10px', fontWeight: 600 }}>
                                        ₹{(item.quantity * item.rate).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Lower Section: Bank Details & Totals - Natural Flow Pushes to Next Page if needed */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '30px', flexWrap: 'wrap', pageBreakInside: 'avoid' }}>

                    {/* Left Side: Bank Details, Terms, Notes */}
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        {/* Bank Details */}
                        <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '4px', marginBottom: '15px', backgroundColor: '#f9fafb' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.8rem', fontWeight: 700, borderBottom: '1px solid #ddd', paddingBottom: '2px' }}>Bank Details</h4>
                            <table style={{ fontSize: '0.75rem', width: '100%', lineHeight: '1.4' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ color: '#666', width: '70px', padding: '1px' }}>Bank:</td>
                                        <td style={{ padding: '1px' }}><strong>{company ? company.bank_name : 'Central Bank of India'}</strong></td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: '#666', padding: '1px' }}>A/C Name:</td>
                                        <td style={{ padding: '1px' }}><strong>{company ? (company.account_holder_name || company.name) : 'Eliza Infotech'}</strong></td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: '#666', padding: '1px' }}>A/C No:</td>
                                        <td style={{ padding: '1px' }}><strong>{company ? company.account_no : '5213284825'}</strong></td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: '#666', padding: '1px' }}>IFSC:</td>
                                        <td style={{ padding: '1px' }}><strong>{company ? company.ifsc : 'CBIN0283246'}</strong></td>
                                    </tr>
                                    {company && company.upi_id && (
                                        <tr>
                                            <td style={{ color: '#666', padding: '1px' }}>UPI:</td>
                                            <td style={{ padding: '1px' }}><strong>{company.upi_id}</strong></td>
                                        </tr>
                                    )}
                                    {!company && (
                                        <tr>
                                            <td style={{ color: '#666', padding: '1px' }}>UPI:</td>
                                            <td style={{ padding: '1px' }}><strong>8930082398</strong></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Notes */}
                        {quote.notes && (
                            <div style={{ marginBottom: '15px', fontSize: '0.8rem' }}>
                                <strong>Notes:</strong>
                                <p style={{ margin: '5px 0', whiteSpace: 'pre-line', color: '#444' }}>{quote.notes}</p>
                            </div>
                        )}

                        {/* Terms */}
                        {quote.terms && (
                            <div style={{ marginBottom: '15px', fontSize: '0.8rem' }}>
                                <strong>Terms & Conditions:</strong>
                                <p style={{ margin: '5px 0', whiteSpace: 'pre-line', color: '#444' }}>{quote.terms}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Totals */}
                    <div style={{ width: '300px' }}>
                        <div className="flex-between" style={{ padding: '5px 0' }}>
                            <span>Subtotal:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex-between" style={{ padding: '5px 0' }}>
                            <span>Total Tax:</span>
                            <span>₹{totalTax.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex-between" style={{ padding: '5px 0', color: 'red' }}>
                                <span>Discount:</span>
                                <span>- ₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex-between" style={{ padding: '10px 0', borderTop: '2px solid #ddd', fontSize: '1.2rem', fontWeight: 800 }}>
                            <span>Grand Total:</span>
                            <span>₹{grandTotal.toFixed(0)}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px', textAlign: 'right' }}>
                            Amount (in words):<br /> {convertNumberToWords(grandTotal)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Footer - Fixed on Every Page */}
            <div className="print-footer" style={{
                marginTop: 'auto',
                padding: '10px',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: '#666',
                borderTop: '1px solid #eee',
                background: 'white'
            }}>
                <p style={{ fontWeight: 700, margin: '0 0 5px 0' }}>CONTACT FOR:</p>
                <p style={{ margin: 0, lineHeight: '1.4' }}>
                    CCTV CAMERAS • INTERNET NETWORKING EQUIPMENT • FTTH AND RADIO FREQUENCY NETWORKING DEVICES<br />
                    INTERNET MARKETING • WEB & APP DEVELOPMENT • SOCIAL MEDIA MANAGEMENT • SEO AND MORE
                </p>
            </div>

            <style>{`
        @media print {
          .no-print { display: none !important; }
          .app-container { min-height: auto; width: 100%; margin: 0; padding: 0; }
          .navbar { display: none; }
          .card { box-shadow: none; border: none !important; padding: 0 !important; margin: 0 !important; }
          body { background: white; margin: 0; padding: 0; }
          .print-container { max-width: 100% !important; margin: 0 !important; width: 100%; }
          
          /* Footer Fix */
          .print-footer {
             position: fixed;
             bottom: 0;
             left: 0;
             right: 0;
             height: 50px; /* Approx height of footer content */
             background: white;
          }
          
          /* Page Margin to prevent overlap with fixed footer */
          @page {
             margin: 10mm;
             margin-bottom: 25mm; /* 1 inch approx for footer space */
          }
        }
      `}</style>
        </div>
    );
};

export default QuotationView;
