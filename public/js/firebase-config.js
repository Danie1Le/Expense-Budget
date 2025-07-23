// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase configuration - Will be replaced during GitHub Actions deploy
const firebaseConfig = {
    apiKey: "REPLACE_API_KEY",
    authDomain: "REPLACE_AUTH_DOMAIN",
    projectId: "REPLACE_PROJECT_ID",
    storageBucket: "REPLACE_STORAGE_BUCKET",
    messagingSenderId: "REPLACE_MESSAGING_SENDER_ID",
    appId: "REPLACE_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the Firebase services
export { app, auth, db };
