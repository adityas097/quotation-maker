import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, PlusCircle, Book, Users } from 'lucide-react';
import { Outlet } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Quotations', path: '/quotations', icon: FileText },
        { label: 'Invoices', path: '/billbook', icon: Book },
        { label: 'Items', path: '/items', icon: Package },
        { label: 'Clients', path: '/clients', icon: Users },
        { label: 'Settings', path: '/settings', icon: LayoutDashboard },
    ];

    return (
        <div className="app-container">
            <header className="navbar">
                <div className="navbar-content">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link to="/" className="logo">
                            Eliza Infotech Billbook
                        </Link>
                        <nav className="nav-links">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`nav-link ${isActive ? 'active' : ''}`}
                                    >
                                        <Icon size={16} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div>
                        <Link to="/quotations/new" className="btn btn-primary">
                            <PlusCircle size={16} />
                            New Quote
                        </Link>
                    </div>
                </div>
            </header>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
