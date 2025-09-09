import { getFirestore } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";
import { app } from "./app.js";

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
