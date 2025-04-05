# Expense Budget Tracker

A simple web application to help users track their expenses and manage their budget. Built with Firebase for authentication and data storage.

## Features

- User Authentication (Email/Password and Google Sign-in)
- Monthly Budget Setting and Tracking
- Expense Management with Edit/Delete functionality
- Budget Analysis with 50/30/20 Rule
- Responsive Design for Desktop and Mobile

## Tech Stack

- HTML, CSS, JavaScript (vanilla)
- Firebase Authentication
- Firebase Firestore Database
- Chart.js for visualizations

## Project Structure

```
expense-budget-firebase/
├── public/                # Static files
│   ├── index.html         # Main application page
│   ├── login.html         # Authentication page
│   ├── css/               # Stylesheets
│   │   ├── main.css       # Main application styles
│   │   └── auth.css       # Authentication styles
│   └── js/                # JavaScript files
│       ├── main.js        # Main application logic
│       ├── login.js       # Authentication logic
│       ├── firebase-config.js # Firebase configuration
│       └── config.js      # App configuration
├── server.js              # Simple Express server for local development
├── firestore.rules        # Security rules for Firestore
└── package.json           # Project dependencies
```

## Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)

2. Enable Authentication with Email/Password and Google methods:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
   - Enable Google provider

3. Create a Firestore database:
   - Go to Firestore Database > Create database
   - Start in production mode
   - Choose a location close to your users

4. Add your Firebase configuration to `public/js/config.js`:
   ```javascript
   export const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser to `http://localhost:3000`

## Deployment

This application can be deployed to Firebase Hosting:

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase Hosting:
```bash
firebase init hosting
```

4. Deploy to Firebase:
```bash
firebase deploy
``` 