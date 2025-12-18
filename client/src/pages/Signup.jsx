import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, UserPlus, Mail, ShieldCheck } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        try {
            // Execute Enterprise Recaptcha
            let token;
            if (window.grecaptcha && window.grecaptcha.enterprise) {
                token = await window.grecaptcha.enterprise.execute('6LdfUywsAAAAAAOtQdmErAnAoIcUcDvUQmUrE6Jt', { action: 'SIGNUP' });
            } else {
                console.warn("Recaptcha not loaded");
                // Fallback or error? For now, proceed or handle gracefully.
                // Depending on strictness, we might require it. 
                // Let's assume it loads.
            }

            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    captchaToken: token
                })
            });

            const data = await res.json();

            if (res.ok) {
                login(data.user, data.token);
                navigate('/');
            } else {
                setError(data.error || 'Registration failed');
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
                {/* Left Side - Welcome / Branding */}
                <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-indigo-600 p-12 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-700 opacity-90"></div>
                    <div className="relative z-10">
                        <UserPlus size={64} className="mb-6 mx-auto opacity-80" />
                        <h2 className="text-4xl font-extrabold mb-4">Join Us!</h2>
                        <p className="text-indigo-100 text-lg leading-relaxed">
                            Create your account today and start managing your quotes and invoices with ease.
                        </p>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 bg-white">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Sign Up</h1>
                        <p className="text-gray-500 mt-2">Create your free account</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="you@example.com"
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
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="Create a strong password"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="Repeat password"
                                    required
                                />
                            </div>
                        </div>

                        {/* ReCAPTCHA Badge is legally required for invisible, but Google script handles it normally floating. 
                            We can add text if we hide the badge. For now, let it float. */}
                        <div className="text-xs text-gray-400 text-center">
                            This site is protected by reCAPTCHA and the Google
                            <a href="https://policies.google.com/privacy" className="text-blue-500 mx-1">Privacy Policy</a> and
                            <a href="https://policies.google.com/terms" className="text-blue-500 mx-1">Terms of Service</a> apply.
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transform transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
