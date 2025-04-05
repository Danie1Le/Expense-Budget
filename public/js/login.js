// Import Firebase auth functions
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const forgotPasswordLink = document.getElementById('forgot-password');
const showSignupLink = document.getElementById('show-signup');
const googleSignInBtn = document.getElementById('google-signin');

// Handle login form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Simple validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        // Sign in with Firebase Authentication
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful');
        
        // Redirect to main app - auth state listener will handle the rest
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
});

// Handle Google Sign In
googleSignInBtn.addEventListener('click', async function() {
    try {
        const provider = new GoogleAuthProvider();
        
        // Add custom parameters to force a new selection screen each time
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        // Check if we're in a local development environment
        const isLocalhost = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
        
        if (isLocalhost) {
            // For localhost, use signInWithRedirect instead of popup
            // This avoids the unauthorized domain error
            await signInWithRedirect(auth, provider);
            // The redirect will happen automatically, no need for additional code here
        } else {
            // For deployed environments, use popup
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Check if this is a new user
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (!userDoc.exists()) {
                // Create user document if it's a new user
                await setDoc(userDocRef, {
                    email: user.email,
                    createdAt: new Date(),
                    budget: 2500 // Default budget
                });
            }
            
            console.log('Google login successful');
            
            // Redirect to main app - auth state listener will handle the rest
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Google login error:', error);
        alert('Google login failed: ' + error.message);
    }
});

// Handle forgot password
forgotPasswordLink.addEventListener('click', async function(e) {
    e.preventDefault();
    const email = prompt('Enter your email to reset your password:');
    
    if (email) {
        try {
            await sendPasswordResetEmail(auth, email);
            alert(`Password reset instructions sent to ${email}`);
        } catch (error) {
            console.error('Password reset error:', error);
            alert('Password reset failed: ' + error.message);
        }
    }
});

// Handle show signup
showSignupLink.addEventListener('click', function(e) {
    e.preventDefault();
    alert('Account creation is coming soon. For now, please use Google Sign-in.');
});

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        // If already logged in, redirect to main app
        window.location.href = 'index.html';
    }
}); 