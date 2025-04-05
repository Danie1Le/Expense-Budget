# Expense Budget App

A web application to help users manage their expenses and track their budgets. Built with Firebase services for authentication, database, and hosting.

## Firebase Integration Setup

This application uses Firebase for authentication and data storage. To set up Firebase for this application:

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)

2. Enable Authentication with Email/Password and Google methods:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
   - Enable Google provider
   - For Google authentication, you may need to configure the OAuth consent screen in the Google Cloud Console

3. For local development with Google authentication:
   - Go to Authentication > Settings
   - Under "Authorized domains", add `localhost` (without port number)
   - The app is configured to use redirect-based authentication on localhost to avoid domain restrictions

4. Create a Firestore database:
   - Go to Firestore Database > Create database
   - Start in production mode
   - Choose a location close to your users

5. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section and click the web app icon (</>) if you haven't already added a web app
   - Register your app with a nickname
   - Copy the firebaseConfig object

6. Update the Firebase configuration in `public/js/firebase-config.js` with your own values:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

7. Deploy the Firestore security rules:
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login to Firebase: `firebase login`
   - Initialize your project: `firebase init`
   - Deploy the rules: `firebase deploy --only firestore:rules`

## Features

- User Authentication (Email/Password and Google Sign-in)
- Expense Management
- Budget Setting and Tracking
- Expense History
- Budget Notifications
- Responsive Web Interface

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)

3. Enable the following Firebase services:
   - Authentication (Email/Password and Google Sign-in)
   - Firestore Database
   - Firebase Hosting
   - Firebase Functions (for notifications)

4. Add your Firebase configuration to `src/config/firebase.js`

5. Start the development server:
```bash
npm start
```

## Project Structure

```
expense-budget/
├── public/              # Static files
│   ├── index.html      # Main HTML file
│   ├── css/            # Stylesheets
│   └── js/             # Client-side JavaScript
├── src/                # Source files
│   └── config/         # Configuration files
└── package.json        # Project dependencies
```

## Technologies Used

- Firebase Authentication
- Firebase Firestore
- Firebase Functions
- Firebase Hosting
- HTML5
- CSS3
- JavaScript (ES6+)

## License

ISC 