import React, { useState, useEffect } from 'react';
import { Upload, Plus } from 'lucide-react';
import Modal from '../components/Modal';

const ItemMaster = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Form States
    const [newItem, setNewItem] = useState({ model_number: '', name: '', description: '', rate: '', hsn_code: '', tax_rate: '' });
    const [importFile, setImportFile] = useState(null);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:3000/api/items');
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newItem)
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                setNewItem({ model_number: '', name: '', description: '', rate: '', hsn_code: '', tax_rate: '' });
                fetchItems();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleImport = async (e) => {
        e.preventDefault();
        if (!importFile) return;

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const res = await fetch('http://localhost:3000/api/items/upload', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                setIsImportModalOpen(false);
                setImportFile(null);
                fetchItems();
                alert('Import successful');
            } else {
                alert('Import failed');
            }
        } catch (err) {
            console.error(err);
            alert('Error importing');
        }
    };

    return (
        <div className="card">
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                <h2>Item Master</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(true)}>
                        <Upload size={16} /> Import CSV/XLS
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={16} /> Add Item
                    </button>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <p>Loading items...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Model #</th>
                                <th>Name</th>
                                <th>HSN</th>
                                <th>Rate</th>
                                <th>Tax %</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.model_number}</td>
                                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                                    <td>{item.hsn_code || '-'}</td>
                                    <td>{item.rate ? `₹${item.rate}` : '-'}</td>
                                    <td>{item.tax_rate ? `${item.tax_rate}%` : '-'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{item.description}</td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No items found. Add or import items.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Item Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Item"
            >
                <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Model Number</label>
                            <input
                                className="input"
                                value={newItem.model_number}
                                onChange={e => setNewItem({ ...newItem, model_number: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>HSN Code</label>
                            <input
                                className="input"
                                value={newItem.hsn_code}
                                onChange={e => setNewItem({ ...newItem, hsn_code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Item Name *</label>
                        <input
                            className="input"
                            required
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rate</label>
                            <input
                                type="number"
                                className="input"
                                value={newItem.rate}
                                onChange={e => setNewItem({ ...newItem, rate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tax Rate (%)</label>
                            <select
                                className="input"
                                value={newItem.tax_rate}
                                onChange={e => setNewItem({ ...newItem, tax_rate: e.target.value })}
                            >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                        <textarea
                            className="input"
                            rows="3"
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Item</button>
                    </div>
                </form>
            </Modal>

            {/* Import Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import Items"
            >
                <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Upload a CSV or Excel file with header columns:
                        <br /><strong>Model, Name, Description, Rate, HSN, Tax</strong>.
                    </p>
                    <input
                        type="file"
                        accept=".csv, .xlsx, .xls"
                        onChange={e => setImportFile(e.target.files[0])}
                        className="input"
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={!importFile}>Import</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ItemMaster;
