// Load environment variables from .env file
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Generate the config.js file with environment variables
const configContent = `// Firebase configuration - generated from .env file
export const firebaseConfig = {
    apiKey: "${process.env.FIREBASE_API_KEY}",
    authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
    projectId: "${process.env.FIREBASE_PROJECT_ID}",
    storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${process.env.FIREBASE_APP_ID}"
};`;

// Ensure the directory exists
const configDir = path.join(__dirname, 'public', 'js');
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

// Write the config file
fs.writeFileSync(path.join(configDir, 'config.js'), configContent);
console.log('Config file generated with environment variables');

// Serve static files from the public directory
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
