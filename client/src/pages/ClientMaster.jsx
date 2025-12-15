import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';
import { API_BASE_URL } from '../apiConfig';
import { Plus, Edit, Trash2, Search, User, Phone, MapPin, FileText, Upload, Download } from 'lucide-react';
import Modal from '../components/Modal';
import ImportWizard from '../components/ImportWizard';
import usePagination from '../hooks/usePagination';
import PaginationControls from '../components/PaginationControls';
import * as XLSX from 'xlsx';

const ClientMaster = () => {
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        gstin: ''
    });

    const {
        currentPage,
        totalPages,
        pageSize,
        totalItems,
        currentItems: currentClients,
        goToPage,
        changePageSize
    } = usePagination(filteredClients);

    const CLIENT_FIELDS = [
        { label: 'Client Name', key: 'name', required: true },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Address', key: 'address' },
        { label: 'GSTIN', key: 'gstin' }
    ];

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        const lowerSearch = search.toLowerCase();
        const filtered = clients.filter(c =>
            c.name.toLowerCase().includes(lowerSearch) ||
            (c.email && c.email.toLowerCase().includes(lowerSearch)) ||
            (c.phone && c.phone.includes(search))
        );
        setFilteredClients(filtered);
        goToPage(1);
    }, [search, clients]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await authFetch(`${API_BASE_URL}/api/clients`);
            if (!res.ok) throw new Error("Failed to fetch clients");
            const data = await res.json();
            const safeData = Array.isArray(data) ? data : [];
            setClients(safeData);
            setFilteredClients(safeData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editingClient
                ? `${API_BASE_URL}/api/clients/${editingClient.id}`
                : `${API_BASE_URL}/api/clients`;

            const method = editingClient ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingClient(null);
                setFormData({ name: '', email: '', phone: '', address: '', gstin: '' });
                fetchClients();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Failed to save client: ${err.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/api/clients/${id}`, { method: 'DELETE' });
            if (res.ok) fetchClients();
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.size} clients?`)) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/api/clients/bulk`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            if (res.ok) {
                setSelectedIds(new Set());
                fetchClients();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkImport = async (data) => {
        try {
            const res = await authFetch(`${API_BASE_URL}/api/clients/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setIsImportWizardOpen(false);
                fetchClients();
                alert('Bulk processing complete');
            } else {
                alert('Import failed');
            }
        } catch (err) {
            console.error(err);
            alert('Error during import');
        }
    };

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(clients);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clients");
        XLSX.writeFile(wb, "Clients_Export.xlsx");
    };

    const handleToggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredClients.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const openEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            gstin: client.gstin || ''
        });
        setIsModalOpen(true);
    };

    const openAdd = () => {
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', address: '', gstin: '' });
        setIsModalOpen(true);
    };

    return (
        <div className="card">
            <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <h2>Client Master</h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                        <Search size={18} color="#6b7280" />
                        <input
                            style={{ border: 'none', background: 'transparent', marginLeft: '0.5rem', outline: 'none' }}
                            placeholder="Search clients..."
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
                        <Upload size={16} /> Bulk Import
                    </button>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <Plus size={16} /> Add Client
                    </button>
                </div>
            </div>

            <div className="table-container">
                {loading ? <p>Loading clients...</p> : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={filteredClients.length > 0 && selectedIds.size === filteredClients.length}
                                        />
                                    </th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>GSTIN</th>
                                    <th>Address</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentClients.map(client => (
                                    <tr key={client.id} className={selectedIds.has(client.id) ? 'selected-row' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(client.id)}
                                                onChange={() => handleToggleSelect(client.id)}
                                            />
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{client.name}</td>
                                        <td>{client.phone || '-'}</td>
                                        <td>{client.gstin || '-'}</td>
                                        <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={client.address}>
                                            {client.address || '-'}
                                        </td>
                                        <td style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                            <button className="icon-btn" onClick={() => openEdit(client)} title="Edit">
                                                <Edit size={16} color="var(--primary-color)" />
                                            </button>
                                            <button className="icon-btn" onClick={() => handleDelete(client.id)} title="Delete">
                                                <Trash2 size={16} color="#ef4444" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {currentClients.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No clients found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            onPageChange={goToPage}
                            onPageSizeChange={changePageSize}
                        />
                    </>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingClient ? 'Edit Client' : 'Add New Client'}
            >
                <form onSubmit={handleSave} className="form-grid">
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label className="label">Client Name *</label>
                            <div className="input-group">
                                <User size={18} color="#9ca3af" />
                                <input
                                    className="input-field"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter client name"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Phone</label>
                                <div className="input-group">
                                    <Phone size={18} color="#9ca3af" />
                                    <input
                                        className="input-field"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">GSTIN</label>
                                <div className="input-group">
                                    <FileText size={18} color="#9ca3af" />
                                    <input
                                        className="input-field"
                                        value={formData.gstin}
                                        onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                                        placeholder="GST Number"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Email address (optional)"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label className="label">Address</label>
                            <div className="input-group" style={{ alignItems: 'flex-start' }}>
                                <MapPin size={18} color="#9ca3af" style={{ marginTop: '0.5rem' }} />
                                <textarea
                                    className="input-field"
                                    rows="3"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full billing address"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Client</button>
                    </div>
                </form>
            </Modal>

            <ImportWizard
                isOpen={isImportWizardOpen}
                onClose={() => setIsImportWizardOpen(false)}
                onImport={handleBulkImport}
                fieldConfig={CLIENT_FIELDS}
                title="Bulk Import Clients"
            />
        </div>
    );
};

export default ClientMaster;
