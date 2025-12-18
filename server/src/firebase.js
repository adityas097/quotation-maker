const admin = require('firebase-admin');
const path = require('path');

let isInitialized = false;

try {
    // 1. Try environment variable GOOGLE_APPLICATION_CREDENTIALS (automatic)
    // 2. Try looking for 'serviceAccountKey.json' in server root
    // For now, we attempt default init. If it fails (no env var), we catch it.

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
        isInitialized = true;
        console.log('Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS');
    } else {
        // Check for local file
        const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
        // We won't strictly file-check, just try to require it if we were to support it,
        // but explicit path init is safer.
        // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

        // Fallback: Lazy init or Warning
        console.warn('Firebase Admin: No credentials provided (GOOGLE_APPLICATION_CREDENTIALS not set). Google Login will fail verification unless in Mock mode.');
    }
} catch (error) {
    console.error('Firebase Admin Initialization Error:', error.message);
}

module.exports = { admin, isInitialized };
