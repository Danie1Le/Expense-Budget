import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from "https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js";

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login');
const signupForm = document.getElementById('signup');
const googleSignInBtn = document.getElementById('google-signin');
const logoutBtn = document.getElementById('logout-btn');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const loginFormDiv = document.getElementById('login-form');
const signupFormDiv = document.getElementById('signup-form');

// Show/Hide Forms
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormDiv.classList.add('hidden');
    signupFormDiv.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupFormDiv.classList.add('hidden');
    loginFormDiv.classList.remove('hidden');
});

// Sign Up
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        signupForm.reset();
    } catch (error) {
        alert(error.message);
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginForm.reset();
    } catch (error) {
        alert(error.message);
    }
});

// Google Sign In
googleSignInBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        alert(error.message);
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        alert(error.message);
    }
});

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
    } else {
        // User is signed out
        appSection.classList.add('hidden');
        authSection.classList.remove('hidden');
        loginFormDiv.classList.remove('hidden');
        signupFormDiv.classList.add('hidden');
    }
}); 