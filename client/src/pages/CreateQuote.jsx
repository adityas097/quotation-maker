import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Autocomplete from '../components/Autocomplete';

const CreateQuote = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Client State
    const [clientName, setClientName] = useState('');
    const [clientId, setClientId] = useState(null);
    const [clientAddress, setClientAddress] = useState('');
    const [clientGstin, setClientGstin] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('DRAFT');

    // Company State
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);

    // Items State
    const [items, setItems] = useState([
        {
            id: Date.now(),
            item_id: null,
            model_number: '',
            name: '',
            description: '',
            hsn_code: '',
            rate: 0,
            tax_rate: 0,
            quantity: 1,
            is_manual: true
        }
    ]);
    const [loading, setLoading] = useState(false);

    // Discount & Extra Fields
    const [discountType, setDiscountType] = useState('PERCENT'); // PERCENT or FIXED
    const [discountValue, setDiscountValue] = useState(0);
    const [notes, setNotes] = useState(''); // New
    const [terms, setTerms] = useState(''); // New

    useEffect(() => {
        fetchCompanies();
        if (id) fetchQuoteData();
        if (!id) {
            // Default Terms 
            setTerms("1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within the due date.\n3. Subject to Panipat Jurisdiction only.");
        }
    }, [id]);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('/api/companies');
            const data = await res.json();
            setCompanies(data);

            // If creating new quote, set default company
            if (!id && data.length > 0) {
                const defaultCo = data.find(c => c.is_default) || data[0];
                setSelectedCompany(defaultCo);
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    const fetchQuoteData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`http://localhost:3000/api/quotations/${id}`);
            if (res.ok) {
                const data = await res.json();
                setClientName(data.client_name);
                setClientId(data.client_id);
                setClientAddress(data.client_address || '');
                setClientGstin(data.client_gstin || '');
                setDate(data.date);
                setStatus(data.status || 'DRAFT');
                setDiscountType(data.discount_type || 'PERCENT');
                setDiscountValue(data.discount_value || 0);
                setDiscountValue(data.discount_value || 0);
                setNotes(data.notes || '');
                setTerms(data.terms || '');

                if (data.company_snapshot) {
                    try {
                        setSelectedCompany(typeof data.company_snapshot === 'string' ? JSON.parse(data.company_snapshot) : data.company_snapshot);
                    } catch (e) {
                        console.error("Error parsing company snapshot", e);
                    }
                }

                const mappedItems = data.items.map(i => ({
                    id: i.id || Date.now() + Math.random(),
                    item_id: i.item_id,
                    model_number: i.model_number || '',
                    name: i.name,
                    description: i.description || '',
                    note: i.note || '',
                    hsn_code: i.hsn_code || '',
                    rate: i.rate || 0,
                    tax_rate: i.tax_rate || 0,
                    quantity: i.quantity,
                    is_manual: !!i.is_manual
                }));
                setItems(mappedItems);
            }
        } catch (err) {
            console.error("Error fetching quote", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async (query) => {
        const res = await fetch(`http://localhost:3000/api/clients/search?q=${query}`);
        return await res.json();
    };

    const fetchItems = async (query) => {
        const res = await fetch('http://localhost:3000/api/items');
        const allItems = await res.json();
        const q = query.toLowerCase();
        return allItems.filter(i =>
            i.name.toLowerCase().includes(q) ||
            (i.model_number && i.model_number.toLowerCase().includes(q)) ||
            (i.description && i.description.toLowerCase().includes(q))
        ).map(i => ({
            ...i,
            label: `${i.name} ${i.model_number ? `(${i.model_number})` : ''} - ${i.description || 'No Desc'}`
        }));
    };

    const handleClientSelect = (client) => {
        setClientName(client.name);
        setClientId(client.id);
        setClientAddress(client.address || '');
        setClientGstin(client.gstin || '');
    };

    const handleItemSelect = (index, item) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            item_id: item.id,
            model_number: item.model_number || item.model || '',
            name: item.name,
            description: item.description || item.desc || '',
            hsn_code: item.hsn_code || item.hsn || '',
            rate: item.rate || 0,
            tax_rate: item.tax_rate || 0,
            is_manual: false
        };
        setItems(newItems);
    };

    const updateItemRow = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItemRow = () => {
        setItems([...items, {
            id: Date.now(),
            model_number: '',
            name: '',
            description: '',
            hsn_code: '',
            rate: 0,
            tax_rate: 0,
            quantity: 1,
            is_manual: true
        }]);
    };

    const removeItemRow = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;

        items.forEach(item => {
            const lineTotal = item.rate * item.quantity;
            subtotal += lineTotal;
            totalTax += lineTotal * (item.tax_rate / 100);
        });

        let discountAmount = 0;
        if (discountType === 'PERCENT') {
            discountAmount = subtotal * (discountValue / 100);
        } else {
            discountAmount = parseFloat(discountValue) || 0;
        }

        const grandTotal = subtotal + totalTax - discountAmount;

        return { subtotal, totalTax, discountAmount, grandTotal };
    };

    const { subtotal, totalTax, discountAmount, grandTotal } = calculateTotals();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // If client ID is null but name exists, try to create or find? 
        // For now assumes manual client name is fine.
        let finalClientId = clientId;

        // Backend logic handles creating client if needed usually, but here we just pass ID or name?
        // Let's assume user selected or typed. 
        if (!clientName) return alert("Client name required");

        const payload = {
            client_id: finalClientId,
            client_name: clientName,
            client_address: clientAddress,
            client_gstin: clientGstin,
            date,
            status,
            discount_type: discountType,
            discount_value: parseFloat(discountValue),
            notes,
            terms,
            items: items.map(i => ({
                ...i,
                rate: parseFloat(i.rate),
                quantity: parseFloat(i.quantity),
                tax_rate: parseFloat(i.tax_rate)
            }))
        };

        const url = id ? `http://localhost:3000/api/quotations/${id}` : 'http://localhost:3000/api/quotations';
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, { method, body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
            if (res.ok) {
                navigate('/quotations');
            } else {
                alert("Failed to save");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            {/* Company Header for Create View */}
            <div className="card mb-6" style={{ border: '1px solid #ddd', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary-color)', paddingBottom: '20px' }}>
                    <div className="w-full">
                        <div className="flex justify-between items-start mb-4">
                            {/* Company Select Dropdown */}
                            <div className="mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">From Company</label>
                                <select
                                    className="border border-gray-300 rounded p-1 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedCompany?.id || ''}
                                    onChange={(e) => {
                                        const co = companies.find(c => c.id === parseInt(e.target.value));
                                        if (co) setSelectedCompany(co);
                                    }}
                                >
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedCompany ? (
                            <>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{selectedCompany.name}</h1>
                                <p style={{ margin: '5px 0', fontSize: '0.9rem', fontWeight: 500 }}>{selectedCompany.address}</p>
                                <div className="flex gap-4 text-sm mt-2">
                                    {selectedCompany.gstin && <p><strong>GSTIN:</strong> {selectedCompany.gstin}</p>}
                                    {selectedCompany.pan && <p><strong>PAN:</strong> {selectedCompany.pan}</p>}
                                </div>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem' }}>
                                    {selectedCompany.phone && <span style={{ marginRight: '10px' }}>📞 {selectedCompany.phone}</span>}
                                    {selectedCompany.email && <span>✉️ {selectedCompany.email}</span>}
                                </p>
                            </>
                        ) : (
                            <p className="text-red-500">Please create a company profile in Settings</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn btn-secondary p-2"><ArrowLeft size={20} /></button>
                    <h1 className="text-2xl font-bold">{id ? 'Edit Quotation' : 'New Quotation'}</h1>
                </div>
                <div className="flex gap-4">
                    <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
                    <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="DRAFT">Draft</option>
                        <option value="SENT">Sent</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Client Section */}
                <div className="card mb-6 grid grid-cols-2 gap-6 mobile-stack">
                    <div>
                        <Autocomplete
                            label="Client Name"
                            value={clientName}
                            onChange={setClientName}
                            onSelect={handleClientSelect}
                            fetchSuggestions={fetchClients}
                            placeholder="Enter Client Name"
                        />
                        <textarea
                            className="input mt-2"
                            placeholder="Address"
                            rows="3"
                            value={clientAddress}
                            onChange={e => setClientAddress(e.target.value)}
                        ></textarea>
                        <input
                            className="input mt-2"
                            placeholder="GSTIN"
                            value={clientGstin}
                            onChange={e => setClientGstin(e.target.value)}
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div className="card">
                    <div className="table-container" style={{ overflow: 'visible' }}>
                        <div className="item-row-header" style={{ display: 'grid', gridTemplateColumns: '40px 3fr 1fr 1fr 1fr 1fr 1fr 40px', gap: '10px', fontWeight: 600, paddingBottom: '10px', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', minWidth: '800px' }}>
                            <span>#</span>
                            <span>Item Details</span>
                            <span>HSN</span>
                            <span>Rate</span>
                            <span>Tax %</span>
                            <span>Qty</span>
                            <span>Total</span>
                            <span></span>
                        </div>

                        <div className="flex flex-col gap-4 mt-4">
                            {items.map((item, index) => (
                                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '40px 3fr 1fr 1fr 1fr 1fr 1fr 40px', gap: '10px', alignItems: 'start', minWidth: '800px' }}>
                                    <span style={{ paddingTop: '8px' }}>{index + 1}</span>

                                    {/* Item Details */}
                                    <div>
                                        <Autocomplete
                                            placeholder="Search Item..."
                                            value={item.name}
                                            onChange={(val) => updateItemRow(index, 'name', val)}
                                            onSelect={(selected) => handleItemSelect(index, selected)}
                                            fetchSuggestions={fetchItems}
                                        />
                                        <div className="mt-2 grid grid-cols-2 gap-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                            <input placeholder="Model" className="input text-sm" value={item.model_number} onChange={e => updateItemRow(index, 'model_number', e.target.value)} />
                                            <input placeholder="Description" className="input text-sm" value={item.description} onChange={e => updateItemRow(index, 'description', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* HSN */}
                                    <input className="input" value={item.hsn_code} onChange={e => updateItemRow(index, 'hsn_code', e.target.value)} placeholder="HSN" />

                                    {/* Rate */}
                                    <input type="number" className="input" value={item.rate} onChange={e => updateItemRow(index, 'rate', e.target.value)} />

                                    {/* Tax */}
                                    <input type="number" className="input" value={item.tax_rate} onChange={e => updateItemRow(index, 'tax_rate', e.target.value)} />

                                    {/* Qty */}
                                    <input type="number" className="input" value={item.quantity} onChange={e => updateItemRow(index, 'quantity', e.target.value)} />

                                    {/* Total */}
                                    <div className="font-bold py-2 text-right">
                                        ₹{((item.rate * item.quantity)).toFixed(2)}
                                    </div>

                                    <button type="button" onClick={() => removeItemRow(index)} className="text-red-500 hover:text-red-700 py-2">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button type="button" onClick={addItemRow} className="btn btn-secondary mt-4 w-full dashed-border">
                            <Plus size={16} /> Add Item
                        </button>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end mt-4">
                        <div className="w-64">
                            <div className="flex-between mb-2">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex-between mb-2">
                                <span>Total Tax</span>
                                <span>₹{totalTax.toFixed(2)}</span>
                            </div>

                            <div className="flex-between mb-2 items-center">
                                <span>Discount</span>
                                <div className="flex gap-1" style={{ width: '60%' }}>
                                    <select
                                        className="input py-1 px-2 text-sm"
                                        style={{ width: '40%' }}
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value)}
                                    >
                                        <option value="PERCENT">%</option>
                                        <option value="FIXED">₹</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="input py-1 px-2 text-sm"
                                        style={{ width: '60%' }}
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-between pt-2 border-t font-bold text-lg">
                                <span>Grand Total</span>
                                <span>₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes & Terms Section with Bank Details Preview */}
                <div className="grid grid-cols-2 gap-6 mt-6 mb-6 mobile-stack">
                    <div className="card">
                        <h3 className="font-semibold mb-2">Bank Details (Preview)</h3>
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border leading-tight">
                            {selectedCompany ? (
                                <div className="grid grid-cols-[80px_1fr] gap-1">
                                    <span className="text-gray-500">Bank:</span>
                                    <span className="font-medium">{selectedCompany.bank_name}</span>
                                    <span className="text-gray-500">A/C Name:</span>
                                    <span className="font-medium">{selectedCompany.account_holder_name}</span>
                                    <span className="text-gray-500">A/C No:</span>
                                    <span className="font-medium">{selectedCompany.account_no}</span>
                                    <span className="text-gray-500">IFSC:</span>
                                    <span className="font-medium">{selectedCompany.ifsc}</span>
                                    {selectedCompany.upi_id && (
                                        <>
                                            <span className="text-gray-500 mt-1">UPI:</span>
                                            <span className="font-bold mt-1">{selectedCompany.upi_id}</span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p>No Company Selected</p>
                            )}
                        </div>

                        <h3 className="font-semibold mt-4 mb-2">Notes</h3>
                        <textarea
                            className="input h-24"
                            placeholder="Add additional notes here..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="card">
                        <h3 className="font-semibold mb-2">Terms & Conditions</h3>
                        <textarea
                            className="input h-64"
                            placeholder="Enter terms and conditions..."
                            value={terms}
                            onChange={e => setTerms(e.target.value)}
                        ></textarea>
                    </div>
                </div>

                {/* Footer Services */}
                <div className="card mt-6 text-center text-xs text-gray-500 mb-20">
                    <p className="font-bold mb-1">CONTACT FOR:</p>
                    <p>
                        CCTV CAMERAS • INTERNET NETWORKING EQUIPMENT • FTTH AND RADIO FREQUENCY NETWORKING DEVICES<br />
                        INTERNET MARKETING • WEB & APP DEVELOPMENT • SOCIAL MEDIA MANAGEMENT • SEO AND MORE
                    </p>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-end gap-2 shadow-lg" style={{ zIndex: 100 }}>
                    <button type="button" onClick={() => navigate('/quotations')} className="btn btn-secondary">Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Quotation</button>
                </div>
            </form>
        </div>
    );
};

export default CreateQuote;
