import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBuYQNPuHWgMJQDcaEbE5xI7miq0IWD0_o",
    authDomain: "mjking-ea9cb.firebaseapp.com",
    databaseURL: "https://mjking-ea9cb-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mjking-ea9cb",
    storageBucket: "mjking-ea9cb.firebasestorage.app",
    messagingSenderId: "615826331020",
    appId: "1:615826331020:web:151517ff2a915b18f7f2a9",
    measurementId: "G-YJ5KT90EEZ"
  
};
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };  // ✅ Now exporting both auth and db
