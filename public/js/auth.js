import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { auth } from './firebase-config.js';

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const forgotPasswordLink = document.getElementById('forgot-password');
const showSignupLink = document.getElementById('show-signup');
const logoutBtn = document.getElementById('logout-btn');

// Initialize auth state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        document.body.classList.add('app-active');
    } else {
        // User is signed out
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        document.body.classList.remove('app-active');
    }
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Clear form
        loginForm.reset();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

// Forgot password
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    
    if (!email) {
        alert('Please enter your email address');
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent! Check your inbox.');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

// Show signup form
showSignupLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // Clear form
        loginForm.reset();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}); 