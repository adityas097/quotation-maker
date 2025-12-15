export const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Unauthorized'));
    }

    return response;
};
