// In development (localhost), Vite proxy handles /api -> localhost:3000
// In production (Hostinger), if .htaccess proxy doesn't work, we force port 3000
// We detect this by checking if we are in production mode

const isProduction = import.meta.env.PROD;

// If you are on a domain like example.com, the backend is likely at example.com:3000
// unless you have a reverse proxy set up.
const getBaseUrl = () => {
    if (!isProduction) return ''; // Let Vite proxy handle it

    // Construct the URL for port 3000
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3000`;
};

export const API_BASE_URL = getBaseUrl();
