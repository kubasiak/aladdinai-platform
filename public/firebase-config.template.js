// Firebase Configuration Template
// Copy this file to firebase-config.js and replace with your actual Firebase project credentials

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services (conditionally initialize auth if available)
const auth = firebase.auth ? firebase.auth() : null;
const db = firebase.firestore();
const storage = firebase.storage();

// Get current customer ID from auth
function getCurrentCustomerId() {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user logged in');
        return null;
    }
    // Customer ID is stored in user's custom claims or UID
    return user.uid;
}

// Check if user is authenticated
function requireAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                resolve(user);
            } else {
                // Redirect to login
                window.location.href = '/login.html';
                reject('Not authenticated');
            }
        });
    });
}

console.log('Firebase initialized');
