import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Smartphone, Mail, MapPin, Building, CreditCard } from 'lucide-react';

function CompanySettings() {
    const [companies, setCompanies] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        gstin: '',
        pan: '',
        bank_name: '',
        account_no: '',
        ifsc: '',
        account_holder_name: '',
        upi_id: '',
        is_default: false
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const response = await fetch('/api/companies');
            const data = await response.json();
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const url = editingCompany
            ? `/api/companies/${editingCompany.id}`
            : '/api/companies';
        const method = editingCompany ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setShowModal(false);
                setEditingCompany(null);
                setFormData({
                    name: '', address: '', phone: '', email: '', gstin: '', pan: '',
                    bank_name: '', account_no: '', ifsc: '', account_holder_name: '', upi_id: '', is_default: false
                });
                fetchCompanies();
            } else {
                const err = await response.json();
                alert('Success: ' + response.ok + ' but something went wrong: ' + (err.error || response.statusText));
            }
        } catch (error) {
            console.error('Error saving company:', error);
            alert('Error saving company: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (company) => {
        setEditingCompany(company);
        setFormData({ ...company, is_default: !!company.is_default });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            try {
                await fetch(`/api/companies/${id}`, { method: 'DELETE' });
                fetchCompanies();
            } catch (error) {
                console.error('Error deleting company:', error);
            }
        }
    };

    const handleAddNew = () => {
        setEditingCompany(null);
        setFormData({
            name: '', address: '', phone: '', email: '', gstin: '', pan: '',
            bank_name: '', account_no: '', ifsc: '', account_holder_name: '', upi_id: '', is_default: false
        });
        setShowModal(true);
    }

    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    };

    const modalContentStyle = {
        backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto'
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div className="flex-between mb-6">
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Company Settings</h1>
                <button onClick={handleAddNew} className="btn btn-primary">
                    <Plus size={18} /> Add New Company
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {companies.map(company => (
                    <div key={company.id} className="card" style={{ position: 'relative', border: company.is_default ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
                        {company.is_default && (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#eff6ff', color: 'var(--accent)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} /> Default
                            </div>
                        )}

                        <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', paddingRight: '30px' }}>{company.name}</h3>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span>{company.address}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Smartphone size={16} /> {company.phone}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <Mail size={16} /> {company.email}
                            </div>

                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div><strong>GSTIN:</strong> {company.gstin}</div>
                                    <div><strong>PAN:</strong> {company.pan}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 600, marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Building size={16} /> Bank Details
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'x 10px', rowGap: '4px', fontSize: '0.85rem' }}>
                                    <span style={{ color: '#666' }}>Bank:</span> <span>{company.bank_name}</span>
                                    <span style={{ color: '#666' }}>A/c No:</span> <span>{company.account_no}</span>
                                    <span style={{ color: '#666' }}>IFSC:</span> <span>{company.ifsc}</span>
                                    <span style={{ color: '#666' }}>Holder:</span> <span>{company.account_holder_name}</span>
                                    {company.upi_id && (
                                        <>
                                            <span style={{ color: '#666' }}>UPI:</span> <span>{company.upi_id}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' }}>
                            <button onClick={() => handleEdit(company)} className="btn btn-secondary" style={{ flex: 1 }}>
                                <Edit2 size={16} /> Edit
                            </button>
                            <button onClick={() => handleDelete(company.id)} className="btn btn-danger" style={{ flex: 1, background: '#fee2e2', color: '#ef4444', borderColor: '#fee2e2' }}>
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div className="flex-between mb-6">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{editingCompany ? 'Edit Company' : 'Add New Company'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>Company Name</label>
                                    <input className="input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>

                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>Address</label>
                                    <textarea className="input" rows="2" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}></textarea>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>Phone</label>
                                    <input className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>Email</label>
                                    <input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>GSTIN</label>
                                    <input className="input" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>PAN</label>
                                    <input className="input" value={formData.pan} onChange={e => setFormData({ ...formData, pan: e.target.value })} />
                                </div>

                                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '10px' }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Bank Details</h3>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>Bank Name</label>
                                    <input className="input" value={formData.bank_name} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>Account Holder Name</label>
                                    <input className="input" value={formData.account_holder_name} onChange={e => setFormData({ ...formData, account_holder_name: e.target.value })} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>Account Number</label>
                                    <input className="input" value={formData.account_no} onChange={e => setFormData({ ...formData, account_no: e.target.value })} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>IFSC Code</label>
                                    <input className="input" value={formData.ifsc} onChange={e => setFormData({ ...formData, ifsc: e.target.value })} />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '0.9rem' }}>UPI ID</label>
                                    <input className="input" value={formData.upi_id} onChange={e => setFormData({ ...formData, upi_id: e.target.value })} />
                                </div>

                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        checked={formData.is_default}
                                        onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                                    />
                                    <label htmlFor="is_default" style={{ fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text-main)' }}>
                                        Set as Default Company for new Quotes
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={loading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : (editingCompany ? 'Update Company' : 'Save Company')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CompanySettings;
