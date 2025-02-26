# Expense Budget App

A web application to help users manage their expenses and track their budgets. Built with Firebase services for authentication, database, and hosting.

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