// Import the functions you need from the SDKs you need

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
const { app, auth, db } = window.initFirebase(firebaseConfig);

// Export the Firebase services
export { app, auth, db };
