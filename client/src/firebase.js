// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyBznMrIjP8WPNu64Q2Nm4cMVFQHRWocPHU",
    authDomain: "eliza-infotech-billbook.firebaseapp.com",
    projectId: "eliza-infotech-billbook",
    storageBucket: "eliza-infotech-billbook.firebasestorage.app",
    messagingSenderId: "547539923912",
    appId: "1:547539923912:web:962b2ce678cd7996b446fd",
    measurementId: "G-9G15ZNKXBS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
