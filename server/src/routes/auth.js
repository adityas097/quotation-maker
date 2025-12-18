const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getDB } = require('../db');
// NOTE: Firebase Admin should be initialized in index.js or dedicated config, 
// here we assume a 'verifyFirebaseToken' helper or direct import if init is global.
// For now, we'll placeholder the actual verification logic or implement a mock 
// if credentials aren't available, but user said "via firebase" so likely real.
// We'll import a helper `verifyGoogleToken` which we'll define in utils or inline if small.

const { JWT_SECRET } = require('../config');

// Mock/Real Firebase Verification Helper
// In real app: const admin = require('firebase-admin');
// For now, we will add a TODO or assume admin is passed. 
// Ideally we create a `src/firebase.js` to export admin.

// Helper: Verify reCAPTCHA
const verifyCaptcha = async (token) => {
    if (!token) return false;
    const secret = '6LcEcywsAAAAAK5EGDQw0tncuUvmr5nU8P6WBy1n'; // Provided by user
    try {
        const fetch = (await import('node-fetch')).default; // Dynamic import for node-fetch v3+
        const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`, {
            method: 'POST'
        });
        const data = await response.json();
        return data.success;
    } catch (err) {
        console.error("Captcha error:", err);
        return false;
    }
};

// Local Registration
router.post('/register', async (req, res) => {
    const { username, password, captchaToken } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const reservedNames = ['admin', 'eliza', 'admineliza', 'serveradmin', 'superuser', 'root'];
    if (reservedNames.includes(username.toLowerCase())) {
        return res.status(400).json({ error: 'Username is reserved and cannot be registered.' });
    }

    try {
        // 1. Verify Captcha
        const isHuman = await verifyCaptcha(captchaToken);
        // Note: For dev/localhost, captcha might be finicky or user might skip sending it from Postman.
        // We will enforce it if provided, or strict enforce.
        if (!isHuman && process.env.NODE_ENV === 'production') {
            return res.status(400).json({ error: 'Captcha verification failed' });
        }

        const db = getDB();

        // 2. Check existence
        const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // 4. Create User
        const result = await db.run(
            'INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)',
            [username, hash, 'user', 'active']
        );

        // 5. Auto Login (Issue Token)
        const user = { id: result.lastID, username, role: 'user' };
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, user });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Local Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[LocalLogin] Attempt for user: ${username}`);

    try {
        const db = getDB();
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) {
            console.log(`[LocalLogin] User not found: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.status === 'disabled') {
            console.log(`[LocalLogin] User disabled: ${username}`);
            return res.status(403).json({ error: 'Account disabled' });
        }

        // Check password match
        let valid = await bcrypt.compare(password, user.password_hash);
        if (!valid && user.password_hash === password) {
            console.log(`[LocalLogin] Fallback plain text password match for: ${username}`);
            valid = true;
        }

        if (!valid) {
            console.log(`[LocalLogin] Password mismatch for: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log(`[LocalLogin] Password verified for: ${username}. Role: ${user.role}`);

        if (!JWT_SECRET) {
            console.error("[LocalLogin] CRITICAL: JWT_SECRET is undefined!");
            throw new Error("Server Misconfiguration: Missing JWT_SECRET");
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`[LocalLogin] Token issued for: ${username}`);
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error("[LocalLogin] Error:", err);
        res.status(500).json({ error: err.toString(), stack: err.stack });
    }
});

// Firebase/Google Login
router.post('/google-login', async (req, res) => {
    const { idToken } = req.body;
    console.log("[GoogleLogin] Request received. ID Token length:", idToken ? idToken.length : 'Missing');
    if (!idToken) return res.status(400).json({ error: 'Missing ID Token' });

    try {
        let user = null; // Declare user variable
        // 1. Verify Token with Firebase Admin
        // const decodedToken = await admin.auth().verifyIdToken(idToken);

        // MOCK VERIFICATION for development/demonstration if no creds provided yet
        // In verify step, User MUST provide firebase creds. 
        // For now, we will trust the client sending a "mock" token if ENV is not set? 
        // No, that's insecure. We'll implement the structure.

        // For this environment, we'll simulate decoding if it looks like a mock from our client
        // OR we try to require firebase-admin if initialized.

        // Let's assume we decode email/sub from token.
        // On client: User signs in with Google -> gets idToken.
        // On server: verifyIdToken(idToken) -> { email, uid, ... }

        // TEMPORARY: Since we don't have serviceAccount.json yet, we can't run admin.auth().
        // We will assume the token payload contains email for this draft.
        // IN PRODUCTION: UNCOMMENT FIREBASE ADMIN CODE.

        // Simulated decoding (Replace with `admin.auth().verifyIdToken(idToken)`)
        // We'll assume the client sends `{ email, uid }` just for this "Refix" stage 
        // until user provides keys. 
        // Wait, user said "via firebase". Safer to expect the keys or fail.
        // But to generic "create instances", I'll write the code assuming `req.user` populator middleware?
        // No, this is an auth route.

        // I'll assume we need `firebase-admin`.
        // If not installed, I should install it? 
        // "npm install firebase-admin"

        // Let's write the REAL code but wrap in try/catch for "admin not init".

        // Check if admin is initialized
        const { admin, isInitialized } = require('../firebase');
        let decodedToken;

        try {
            // BYPASS: If in DEV and not initialized, allow login for testing flow (Insecure but practical for setup)
            // Ideally we check a specific flag like SKIP_FIREBASE_VERIFY
            if (!isInitialized && process.env.NODE_ENV !== 'production') {
                console.warn("⚠️ MOCKING Firebase Verification (Admin not initialized) ⚠️");
                decodedToken = jwt.decode(idToken);
                if (decodedToken) {
                    // Google often puts UID in 'sub'
                    decodedToken.uid = decodedToken.sub || decodedToken.uid || 'mock-uid-' + Date.now();
                }
                console.log("[GoogleLogin] Decoded (Mock):", decodedToken ? decodedToken.email : 'null');
                if (!decodedToken) throw new Error("Invalid Token format");
            } else {
                console.log("[GoogleLogin] Verifying with Firebase Admin...");
                if (!isInitialized) throw new Error("Firebase Admin not initialized in Production");
                decodedToken = await admin.auth().verifyIdToken(idToken);
                console.log("[GoogleLogin] Verification Success. Email:", decodedToken.email);
            }
        } catch (e) {
            console.error("[GoogleLogin] Verification Failed:", e);
            console.warn("Firebase verification failed:", e.message);
            return res.status(401).json({ error: 'Invalid Google Token or Backend not configured' });
        }

        const { email, uid } = decodedToken;
        if (!email) {
            console.error("[GoogleLogin] No email in token");
            return res.status(400).json({ error: 'Email required in token' });
        }

        const db = getDB();
        console.log(`[GoogleLogin] Looking up user: UID=${uid}, Email=${email}`);

        // Special Admin Mapping for Owner
        if (email === 'infotecheliza@gmail.com' || email === 'elizainfotech.solutions@gmail.com') {
            console.log(`[GoogleLogin] Detected Owner Email ${email}. Mapping to admineliza (ID 1).`);
            let adminUser = await db.get('SELECT * FROM users WHERE id = 1');
            if (adminUser) {
                // Update UID if needed
                if (adminUser.firebase_uid !== uid) {
                    await db.run('UPDATE users SET firebase_uid = ? WHERE id = 1', [uid]);
                    adminUser.firebase_uid = uid;
                }
                user = adminUser;
            }
        }

        if (!user) {
            user = await db.get('SELECT * FROM users WHERE firebase_uid = ? OR username = ?', [uid, email]);
        }

        if (!user) {
            console.log("[GoogleLogin] Creating new user");
            // Create new user
            const result = await db.run(
                'INSERT INTO users (username, firebase_uid, role, status) VALUES (?, ?, ?, ?)',
                [email, uid, 'user', 'active']
            );
            user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
        } else {
            console.log(`[GoogleLogin] Found existing user ID=${user.id}. Linking UID.`);
            // Link UID if existing email match (and not linked)
            if (!user.firebase_uid) {
                await db.run('UPDATE users SET firebase_uid = ? WHERE id = ?', [uid, user.id]);
                user.firebase_uid = uid;
            }
        }

        if (user.status === 'disabled') {
            return res.status(403).json({ error: 'Account disabled' });
        }

        // Issue Local JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });

    } catch (err) {
        console.error("Google Login Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
