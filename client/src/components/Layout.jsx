import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, PlusCircle, Book, Users as UsersIcon, Settings } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Quotations', path: '/quotations', icon: FileText },
        { label: 'Invoices', path: '/billbook', icon: Book },
        { label: 'Items', path: '/items', icon: Package },
        { label: 'Clients', path: '/clients', icon: UsersIcon },
    ];

    if (user && user.role === 'admin') {
        navItems.push({ label: 'Users', path: '/users', icon: Settings }); // Reusing icon or new one
    }

    // Always keep settings
    navItems.push({ label: 'Settings', path: '/settings', icon: LayoutDashboard });

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
                        <Link to="/quotations/new" className="btn btn-primary" style={{ marginRight: '1rem' }}>
                            <PlusCircle size={16} />
                            New Quote
                        </Link>
                        <Link to="/profile" className="btn btn-secondary" style={{ marginRight: '0.5rem', fontSize: '0.8rem', padding: '0.5rem' }}>
                            Profile
                        </Link>
                        <button onClick={logout} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
                            Logout
                        </button>
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
