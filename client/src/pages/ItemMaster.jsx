import React, { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Download, Search } from 'lucide-react';
import Modal from '../components/Modal';
import ImportWizard from '../components/ImportWizard';
import usePagination from '../hooks/usePagination';
import PaginationControls from '../components/PaginationControls';
import * as XLSX from 'xlsx';

const ItemMaster = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);

    // Selection & Bulk
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [search, setSearch] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);

    // Form States
    const [newItem, setNewItem] = useState({ model_number: '', name: '', description: '', rate: '', hsn_code: '', tax_rate: '' });

    const ITEM_FIELDS = [
        { key: 'name', label: 'Item Name', required: true },
        { key: 'model_number', label: 'Model Number' },
        { key: 'description', label: 'Description' },
        { key: 'rate', label: 'Rate/Price' },
        { key: 'hsn_code', label: 'HSN Code' },
        { key: 'tax_rate', label: 'Tax Rate (%)' }
    ];

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        if (!search) {
            setFilteredItems(items);
        } else {
            const q = search.toLowerCase();
            setFilteredItems(items.filter(i =>
                i.name.toLowerCase().includes(q) ||
                (i.model_number && i.model_number.toLowerCase().includes(q))
            ));
        }
    }, [search, items]);

    const {
        currentData: currentItems,
        currentPage,
        totalPages,
        pageSize,
        totalItems,
        goToPage,
        changePageSize
    } = usePagination(filteredItems, 30);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:3000/api/items');
            const data = await res.json();
            setItems(data);
            setFilteredItems(data);
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

    const handleBulkImport = async (data) => {
        try {
            const res = await fetch('http://localhost:3000/api/items/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setIsImportWizardOpen(false);
                fetchItems();
                alert('Bulk processing complete');
            } else {
                alert('Import failed');
            }
        } catch (err) {
            console.error(err);
            alert('Error during import');
        }
    };

    const handleToggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredItems.map(i => i.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.size} items?`)) return;
        try {
            const res = await fetch('http://localhost:3000/api/items/bulk', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            if (res.ok) {
                setSelectedIds(new Set());
                fetchItems();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(items);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Items");
        XLSX.writeFile(wb, "Items_Export.xlsx");
    };

    return (
        <div className="card">
            <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>Item Master</h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                        <Search size={18} color="#6b7280" />
                        <input
                            style={{ border: 'none', background: 'transparent', marginLeft: '0.5rem', outline: 'none' }}
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {selectedIds.size > 0 && (
                        <button className="btn" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={handleBulkDelete}>
                            <Trash2 size={16} /> Delete ({selectedIds.size})
                        </button>
                    )}

                    <button className="btn btn-secondary" onClick={handleExport}>
                        <Download size={16} /> Export
                    </button>
                    <button className="btn btn-secondary" onClick={() => setIsImportWizardOpen(true)}>
                        <Upload size={16} /> Bulk Import/Edit
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
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                                    />
                                </th>
                                <th>Model</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Rate</th>
                                <th>Tax %</th>
                                <th>HSN</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(item => (
                                <tr key={item.id} className={selectedIds.has(item.id) ? 'selected-row' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(item.id)}
                                            onChange={() => handleToggleSelect(item.id)}
                                        />
                                    </td>
                                    <td>{item.model_number || '-'}</td>
                                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.description}>
                                        {item.description || '-'}
                                    </td>
                                    <td>₹{item.rate}</td>
                                    <td>{item.tax_rate}%</td>
                                    <td>{item.hsn_code || '-'}</td>
                                    <td style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                        <button className="icon-btn" title="Delete" onClick={() => handleDelete(item.id)}>
                                            <Trash2 size={16} color="#ef4444" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {currentItems.length === 0 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No items found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                {!loading && (
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={totalItems}
                        onPageChange={goToPage}
                        onPageSizeChange={changePageSize}
                    />
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

            {/* Import Wizard */}
            <ImportWizard
                isOpen={isImportWizardOpen}
                onClose={() => setIsImportWizardOpen(false)}
                onImport={handleBulkImport}
                fieldConfig={ITEM_FIELDS}
                title="Bulk Import Items"
            />
        </div>
    );
};

export default ItemMaster;
