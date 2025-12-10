import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, Trash2 } from 'lucide-react';

const QuotationsList = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:3000/api/quotations');
            const data = await res.json();
            setQuotes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quote?')) return;
        try {
            await fetch(`http://localhost:3000/api/quotations/${id}`, { method: 'DELETE' });
            fetchQuotes();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="card">
            <div className="flex-between mb-6">
                <h2>Quotations</h2>
                <Link to="/quotations/new" className="btn btn-primary">
                    <FileText size={16} /> New Quote
                </Link>
            </div>

            <div className="table-container">
                {loading ? (
                    <p>Loading quotations...</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Items</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map((q) => (
                                <tr key={q.id}>
                                    <td>{q.date}</td>
                                    <td style={{ fontWeight: 500 }}>{q.client_name}</td>
                                    <td>{q.item_count} Items</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <Link to={`/quotations/${q.id}`} className="btn btn-secondary p-2" title="View">
                                                <Eye size={16} />
                                            </Link>
                                            <Link to={`/quotations/${q.id}/edit`} className="btn btn-secondary p-2" title="Edit">
                                                <FileText size={16} />
                                            </Link>
                                            <button className="btn btn-danger p-2" onClick={() => handleDelete(q.id)} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {quotes.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No quotations found. Create your first quote!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default QuotationsList;
