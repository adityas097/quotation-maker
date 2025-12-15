import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'; // Fixed imports
import {
    LayoutDashboard,
    Package,
    FileText,
    PlusCircle,
    Book,
    Users as UsersIcon,
    Settings,
    Menu,
    X,
    User,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
        { label: 'Quotations', path: '/quotations', icon: FileText },
        { label: 'Invoices', path: '/billbook', icon: Book },
        { label: 'Items', path: '/items', icon: Package },
        { label: 'Clients', path: '/clients', icon: UsersIcon },
    ];

    if (user && user.role === 'admin') {
        navItems.push({ label: 'Users', path: '/users', icon: Settings });
    }

    // Settings is always available
    navItems.push({ label: 'Settings', path: '/settings', icon: Settings });

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">

                        {/* Logo and Desktop Nav */}
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/" className="text-xl font-bold text-indigo-600 tracking-tight" onClick={closeMenu}>
                                    QuoteMaker
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:ml-8 md:flex md:space-x-4 items-center">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive
                                                    ? 'text-indigo-600 bg-indigo-50'
                                                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <Icon size={16} className="mr-1.5" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Desktop Right Actions */}
                        <div className="hidden md:flex items-center space-x-3">
                            <Link
                                to="/quotations/new"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                            >
                                <PlusCircle size={16} className="mr-2" />
                                New Quote
                            </Link>

                            <div className="h-6 w-px bg-gray-200 mx-2"></div>

                            <Link
                                to="/profile"
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                                title="Profile"
                            >
                                <User size={20} />
                            </Link>

                            <button
                                onClick={logout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center md:hidden">
                            <button
                                onClick={toggleMenu}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? (
                                    <X className="block h-6 w-6" aria-hidden="true" />
                                ) : (
                                    <Menu className="block h-6 w-6" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
                        <div className="pt-2 pb-3 space-y-1 px-4 sm:px-6">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={closeMenu}
                                        className={`flex items-center px-3 py-3 rounded-md text-base font-medium ${isActive
                                                ? 'text-indigo-600 bg-indigo-50'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon size={18} className="mr-3" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="pt-4 pb-4 border-t border-gray-200 px-4 space-y-3">
                            <Link
                                to="/quotations/new"
                                onClick={closeMenu}
                                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                <PlusCircle size={18} className="mr-2" />
                                Create New Quote
                            </Link>
                            <div className="flex items-center justify-between pt-2">
                                <Link
                                    to="/profile"
                                    onClick={closeMenu}
                                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                                >
                                    <User size={18} className="mr-3" />
                                    My Profile
                                </Link>
                                <button
                                    onClick={() => { closeMenu(); logout(); }}
                                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    <LogOut size={18} className="mr-3" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
