import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0153886661",
  appId: "1:237034597196:web:7993c7e50b163ff73ebde9",
  apiKey: "AIzaSyDfDagzb2VYPS35lGjd7DjKFHKV9p0TXjU",
  authDomain: "gen-lang-client-0153886661.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-basharai-0f3f1452-93b0-49f8-92d4-f4e1b53d16a9",
  storageBucket: "gen-lang-client-0153886661.firebasestorage.app",
  messagingSenderId: "237034597196",
  measurementId: "",
  oAuthClientId: "237034597196-51gbapgmvcbc9pg5q2q0afqtbj9o2mfu.apps.googleusercontent.com",
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);
    return { user: null, error: error.message || 'গুগল সাইন-ইন সম্পন্ন করা যায়নি।' };
  }
}

export async function signOutUser() {
  try {
    await fbSignOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error('Firebase Sign-Out error:', error);
    return { success: false, error: error.message };
  }
}
