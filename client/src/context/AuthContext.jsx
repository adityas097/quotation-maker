import React, { createContext, useContext, useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';
import { API_BASE_URL } from '../apiConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Validate token on load
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUserProfile = async () => {
        try {
            // We can use a new endpoint /api/auth/me or just rely on decoded token if backend supported it.
            // For now, let's assume we might need a /me endpoint or just trust the token until an API call fails.
            // But to be robust, let's verify.
            // Since we don't have /me yet, I'll rely on a simple check or just decoding if I had a library.
            // Better: Try to fetch something checking if token is valid.
            // Or better yet, implemented /me in auth routes? I didn't. 
            // Let's implement login storing user details.
            // For persistence, we try to recover user from localStorage if we saved it, 
            // OR we add /me endpoint to backend.
            // I'll add /me endpoint to backend in next step for robust security.
            // For now, I will simulate it by checking if we have a user object in localStorage too?
            // No, keeping it in sync is hard.
            // Plan: Add /me endpoint to backend auth.js quickly.

            // Temporary: valid if token exists. Real validation happens on API calls.
            // If API 401s, authFetch handles logout.
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error(error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (userData, authToken) => {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(authToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
