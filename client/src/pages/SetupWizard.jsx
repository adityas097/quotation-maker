import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SetupWizard = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Check if setup is already complete
        fetch('/api/setup/status')
            .then(async res => {
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Server Status: ${res.status} - ${text.substring(0, 100)}`);
                }
                return res.json();
            })
            .then(data => {
                if (data.isSetup) {
                    navigate('/login');
                }
            })
            .catch(err => console.error('Setup check failed', err));
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/setup/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            // Check content type to catch HTML responses (server misconfig)
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                const text = await response.text();
                if (text.trim().startsWith('<')) {
                    throw new Error('Server returned HTML instead of JSON. This usually means the API request was misrouted to the frontend. Check your .htaccess or server proxy configuration.');
                }
                throw new Error(`Invalid server response: ${text.substring(0, 50)}...`);
            }

            const data = await response.json();

            if (response.ok) {
                alert('Setup Complete! Please login.');
                window.location.href = '/login';
            } else {
                setError(data.error || 'Setup failed');
            }
        } catch (err) {
            console.error(err);
            setError(`Setup Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">System Setup</h1>
                <p className="mb-6 text-gray-600 text-sm text-center">
                    Welcome to QuoteMaker. This wizard will secure your installation and migrate existing data to the admin user.
                </p>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Admin Password (admineliza)</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="Create a strong password"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="Repeat password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Initializing system...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupWizard;
