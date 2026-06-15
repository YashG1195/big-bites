import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

// Prevent re-initialization on hot reloads
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Firebase] Admin initialized successfully.');
  } catch (error) {
    // Dummy credentials in dev will trigger this — the server still runs fine
    console.warn('[Firebase] Admin init skipped (dummy credentials):', error.message);
  }
}

// Export the auth service for use in middleware
export const firebaseAuth = () => {
  try { return getAuth(); } catch { return null; }
};

export default { auth: firebaseAuth };
