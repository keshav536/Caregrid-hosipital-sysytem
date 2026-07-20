/**
 * firebase-config.js
 * CareGrid HMS — Firebase Initialization
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Select your project (proj-2-1ace7)
 * 3. Click the gear icon > Project Settings > Your Apps > Web App
 * 4. Copy the firebaseConfig object values and paste them below
 * 5. Enable Email/Password authentication in Firebase Console:
 *    Authentication > Sign-in method > Email/Password > Enable
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============================================================
// REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CREDENTIALS
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyCyYnQ1NFBxb0RHbZZOovEI1t1h00AvB5Y",
  authDomain: "proj-2-1ace7.firebaseapp.com",
  projectId: "proj-2-1ace7",
  storageBucket: "proj-2-1ace7.firebasestorage.app",
  messagingSenderId: "914954010356",
  appId: "1:914954010356:web:92539925e1f3e182a128a1"
};
// ============================================================

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Set local persistence so users stay logged in after page refresh
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Persistence setup warning:", err.message);
});

export { auth };
