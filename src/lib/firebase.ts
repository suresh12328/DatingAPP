import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

// Read config from firebase-applet-config.json or environment
const firebaseConfig = {
  apiKey: "AIzaSyAx1SMq6FbhgHwWugLov8IeTeFJA8LWcaA",
  authDomain: "project-8bb8148c-d0bc-47df-84c.firebaseapp.com",
  projectId: "project-8bb8148c-d0bc-47df-84c",
  storageBucket: "project-8bb8148c-d0bc-47df-84c.firebasestorage.app",
  messagingSenderId: "238773895389",
  appId: "1:238773895389:web:06cdbdc18f72d83f051b34"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable browser local persistence for session
try {
  setPersistence(auth, browserLocalPersistence).catch((e) => {
    console.warn('[Firebase Auth] Persistence error:', e);
  });
} catch {
  // Ignore in environments without window/localStorage
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export type { FirebaseUser };

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<{
  user: FirebaseUser;
  email: string;
  displayName: string;
  photoURL: string;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const emailLower = (user.email || '').toLowerCase().trim();

    // STRICT RBAC: Google account integration is restricted exclusively to administrator Suresh Bohara
    if (emailLower !== 'bohara.suresh8884@gmail.com') {
      await signOut(auth);
      throw new Error('Google Workspace and Google account integration is reserved exclusively for system administrator Suresh Bohara. Normal users must sign in or register with email and password.');
    }

    return {
      user,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Member',
      photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
    };
  } catch (error: any) {
    console.error('[Firebase] Google sign-in failed:', error);
    throw error;
  }
}

/**
 * Send real email verification link to user's email
 */
export async function sendUserEmailVerification(user: FirebaseUser): Promise<void> {
  try {
    await sendEmailVerification(user, {
      url: window.location.origin,
      handleCodeInApp: true
    });
  } catch (err: any) {
    console.warn('[Firebase] Email verification send warning:', err);
    throw err;
  }
}

/**
 * Send password reset email
 */
export async function sendUserPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin
    });
  } catch (err: any) {
    console.warn('[Firebase] Password reset error:', err);
    throw err;
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
};
