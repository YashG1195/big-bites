import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Usually, you initialize with a service account JSON. 
// Since we have dummy keys, we wrap it in a try-catch to avoid crashing the server on boot.
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines if passed in ENV string
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('Firebase Admin Initialized Successfully');
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error.message);
}

export default admin;
