/**
 * auth.js
 * CareGrid HMS — Firebase Authentication Module
 *
 * All authentication functions are organized here.
 * Import this module using type="module" in your HTML files.
 */

import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ============================================================
// FRIENDLY ERROR MESSAGE MAPPER
// ============================================================

/**
 * Maps Firebase error codes to user-friendly messages.
 * @param {string} code - Firebase error code
 * @returns {string} Human-readable error message
 */
function getFirebaseErrorMessage(code) {
  const errorMessages = {
    "auth/invalid-email":              "The email address format is invalid. Please check and try again.",
    "auth/user-disabled":              "This account has been disabled. Please contact support.",
    "auth/user-not-found":             "No account found with this email address. Please sign up first.",
    "auth/wrong-password":             "Incorrect password. Please try again or reset your password.",
    "auth/invalid-credential":         "Invalid email or password. Please check your credentials.",
    "auth/email-already-in-use":       "An account with this email already exists. Try logging in instead.",
    "auth/weak-password":              "Password is too weak. Please use at least 8 characters.",
    "auth/operation-not-allowed":      "Email/Password sign-in is not enabled. Please contact the administrator.",
    "auth/network-request-failed":     "Network error. Please check your internet connection and try again.",
    "auth/too-many-requests":          "Too many failed attempts. Your account is temporarily locked. Please try again later.",
    "auth/popup-closed-by-user":       "Sign-in popup was closed. Please try again.",
    "auth/requires-recent-login":      "This action requires recent authentication. Please log in again.",
    "auth/missing-email":              "Please enter an email address.",
    "auth/missing-password":           "Please enter a password.",
  };
  return errorMessages[code] || "An unexpected error occurred. Please try again.";
}

// ============================================================
// AUTH STATE OBSERVER
// ============================================================

/**
 * Subscribe to auth state changes.
 * @param {Function} callback - Receives (user) or null when signed out
 * @returns {Function} Unsubscribe function
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the currently signed-in user (synchronous snapshot).
 * @returns {User|null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}

// ============================================================
// SIGN UP
// ============================================================

/**
 * Create a new user account with email and password.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName - User's full name
 * @returns {Promise<{success: boolean, user?: User, error?: string}>}
 */
export async function signUp(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Set the display name after account creation
    if (displayName && displayName.trim()) {
      await updateProfile(user, { displayName: displayName.trim() });
    }

    return { success: true, user };
  } catch (err) {
    return { success: false, error: getFirebaseErrorMessage(err.code) };
  }
}

// ============================================================
// SIGN IN
// ============================================================

/**
 * Sign in an existing user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{success: boolean, user?: User, error?: string}>}
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (err) {
    return { success: false, error: getFirebaseErrorMessage(err.code) };
  }
}

// ============================================================
// SIGN OUT
// ============================================================

/**
 * Sign out the current user.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function logOut() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (err) {
    return { success: false, error: getFirebaseErrorMessage(err.code) };
  }
}

// ============================================================
// PASSWORD RESET
// ============================================================

/**
 * Send a password reset email to the given address.
 * @param {string} email
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) {
    return { success: false, error: getFirebaseErrorMessage(err.code) };
  }
}

// ============================================================
// DASHBOARD GUARD — Redirect if not authenticated
// ============================================================

/**
 * Protect a page — redirects to login.html if user is not signed in.
 * Call this at the top of any protected page's module script.
 * @param {Function} [onAuthenticated] - Optional callback with (user) when verified
 */
export function requireAuth(onAuthenticated) {
  // Show a full-page blocking overlay immediately so no content flashes
  const blocker = document.createElement("div");
  blocker.id = "auth-blocker";
  blocker.style.cssText =
    "position:fixed;inset:0;background:var(--bg-primary,#F8FAFC);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;";
  blocker.innerHTML = `
    <div style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#2563EB;border-radius:50%;animation:spin 1s linear infinite;"></div>
    <p style="font-family:'Poppins',sans-serif;font-size:1rem;color:#64748B;">Verifying session...</p>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(blocker);

  const unsub = onAuthStateChanged(auth, (user) => {
    unsub(); // unsubscribe after first check
    if (!user) {
      window.location.href = "login.html";
    } else {
      blocker.remove();
      if (typeof onAuthenticated === "function") {
        onAuthenticated(user);
      }
    }
  });
}
