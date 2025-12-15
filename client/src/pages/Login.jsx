import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../context/AuthContext';

import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || '/';

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const token = await result.user.getIdToken();

            const res = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: token })
            });

            const text = await res.text();
            console.log("[GoogleLogin] Response:", text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (jsonError) {
                console.error("JSON Parse Error:", jsonError);
                setError(`Server Error: Response was not valid JSON. Raw: ${text.substring(0, 50)}...`);
                setLoading(false);
                return;
            }

            if (res.ok) {
                login(data.user, data.token);
                navigate(from, { replace: true });
            } else {
                setError(data.error || 'Google Login failed');
            }
        } catch (err) {
            console.error(err);
            setError(`Google Sign-In failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await res.json();

            if (res.ok) {
                login(data.user, data.token); // Use Context login
                navigate(from, { replace: true });
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden">

                {/* Left Side - Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 bg-white">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
                        <p className="text-gray-500 mt-2">Enter your details to access your account</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    value={credentials.username}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transform transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Logging in...' : 'Sign In'}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-400 font-medium">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className={`w-full py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-2" />
                            Sign in with Google
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Create Account
                        </Link>
                    </div>
                </div>

                {/* Right Side - Branding */}
                <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-indigo-600 p-12 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-800 opacity-90"></div>
                    <div className="relative z-10 max-w-sm">
                        <h2 className="text-4xl font-extrabold mb-6">QuoteMaker</h2>
                        <p className="text-indigo-100 text-lg leading-relaxed mb-8">
                            Empower your business with professional quotations and invoices. Simple, fast, and secure.
                        </p>
                        <div className="flex justify-center">
                            <Link to="/signup" className="flex items-center text-white bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full backdrop-blur-sm transition-all">
                                Get Started <ArrowRight size={16} className="ml-2" />
                            </Link>
                        </div>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute top-10 right-10 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
                </div>

            </div>
        </div>
    );
};

export default Login;
