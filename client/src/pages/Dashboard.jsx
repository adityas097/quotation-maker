import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Users, FileText } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ quotes: 0, items: 0, clients: 0 });
    const [recentQuotes, setRecentQuotes] = useState([]);

    useEffect(() => {
        // Determine stats from API calls
        const fetchData = async () => {
            try {
                const [quotesRes, itemsRes] = await Promise.all([
                    fetch('http://localhost:3000/api/quotations'),
                    fetch('http://localhost:3000/api/items')
                ]);
                const quotes = await quotesRes.json();
                const items = await itemsRes.json();

                // Unique clients from quotes (approximation)
                const uniqueClients = new Set(quotes.map(q => q.client_name)).size;

                setStats({
                    quotes: quotes.length,
                    items: items.length,
                    clients: uniqueClients
                });
                setRecentQuotes(quotes.slice(0, 5));
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card flex-between">
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Quotes</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.quotes}</p>
                    </div>
                    <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '50%', color: 'var(--accent)' }}>
                        <FileText size={24} />
                    </div>
                </div>
                <div className="card flex-between">
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Items</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.items}</p>
                    </div>
                    <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '50%', color: 'var(--success)' }}>
                        <ShoppingBag size={24} />
                    </div>
                </div>
                <div className="card flex-between">
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Active Clients</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.clients}</p>
                    </div>
                    <div style={{ padding: '1rem', background: '#fdf2f8', borderRadius: '50%', color: '#db2777' }}>
                        <Users size={24} />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Recent Quotations</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Items</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentQuotes.map(q => (
                                <tr key={q.id}>
                                    <td>{q.date}</td>
                                    <td style={{ fontWeight: 500 }}>{q.client_name}</td>
                                    <td>{q.item_count} Items</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link to={`/quotations/${q.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {recentQuotes.length === 0 && (
                                <tr><td colSpan="4">No recent activity.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
