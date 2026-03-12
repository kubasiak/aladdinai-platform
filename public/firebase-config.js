// Firebase Configuration
// Replace with your actual Firebase project credentials

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
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
