// Firebase Configuration
// Follow these steps to set up Firebase:
//
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing one
// 3. Enable Authentication:
//    - Go to Authentication > Sign-in method
//    - Enable Email/Password provider
// 4. Create Firestore Database:
//    - Go to Firestore Database
//    - Create database (start in production mode)
//    - Set up security rules (see below)
// 5. Get your config:
//    - Go to Project Settings > General
//    - Scroll to "Your apps" > Web app
//    - Copy the firebaseConfig object
// 6. Replace the placeholder values below

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

/*
=== FIRESTORE SECURITY RULES ===
Copy these rules to your Firestore Rules tab:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && getUserRole() == 'admin';
    }
    
    // Helper function to check if user is admin or marker
    function isAdminOrMarker() {
      return isAuthenticated() && (getUserRole() == 'admin' || getUserRole() == 'marker');
    }
    
    // Users collection - stores user roles
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Members collection
    match /members/{memberId} {
      allow read: if isAuthenticated();
      allow create, update: if isAdminOrMarker();
      allow delete: if isAdmin();
    }
    
    // Families collection
    match /families/{familyId} {
      allow read: if isAuthenticated();
      allow create, update: if isAdminOrMarker();
      allow delete: if isAdmin();
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create, update: if isAdminOrMarker();
      allow delete: if isAdmin();
    }
    
    // Attendance collection
    match /attendance/{attendanceId} {
      allow read: if isAuthenticated();
      allow create, update: if isAdminOrMarker();
      allow delete: if isAdmin();
    }
    
    // FollowUp collection
    match /followups/{followupId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated();
      allow delete: if isAdmin();
    }
    
    // Teams collection
    match /teams/{teamId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
*/
