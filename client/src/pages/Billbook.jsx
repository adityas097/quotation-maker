import React, { useState, useEffect } from 'react';
import usePagination from '../hooks/usePagination';
import PaginationControls from '../components/PaginationControls';
import { FileText, Printer, CheckCircle, Edit, Copy } from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { API_BASE_URL } from '../apiConfig';

const Billbook = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    const {
        currentPage,
        totalPages,
        pageSize,
        totalItems,
        currentItems: currentInvoices,
        goToPage,
        changePageSize
    } = usePagination(invoices);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await authFetch(`${API_BASE_URL}/api/invoices`);
            if (!res.ok) throw new Error("Failed to fetch invoices");
            const data = await res.json();
            setInvoices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicateInvoice = async (quoteId) => {
        if (!window.confirm('Create a new Draft Quote from this Invoice?')) return;
        try {
            const res = await authFetch(`${API_BASE_URL}/api/quotations/duplicate/${quoteId}`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                // Redirect to edit the new quote
                window.location.href = `/quotations/${data.id}/edit`;
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="card">
            <h2 className="mb-6">Billbook (Invoices)</h2>

            <div className="table-container">
                {loading ? (
                    <p>Loading invoices...</p>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Date</th>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentInvoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                                        <td>{inv.date}</td>
                                        <td>{inv.client_name}</td>
                                        <td style={{ fontWeight: 600 }}>₹{inv.total_amount?.toFixed(2)}</td>
                                        <td>
                                            <span className={`badge ${inv.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <a href={`/quotations/${inv.quotation_id}`} className="btn btn-secondary p-2" title="View Quote/Invoice">
                                                    <FileText size={16} />
                                                </a>
                                                <a href={`/quotations/${inv.quotation_id}/edit`} className="btn btn-secondary p-2" title="Edit">
                                                    <Edit size={16} />
                                                </a>
                                                <button className="btn btn-secondary p-2" onClick={() => handleDuplicateInvoice(inv.quotation_id)} title="Duplicate to New Draft">
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {currentInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                            No invoices found. Convert a quote to an invoice to see it here.
                                        </td>
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
        </div>
    );
};

export default Billbook;
