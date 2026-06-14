import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'dummy_api_key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy_auth_domain',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'dummy_project_id',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy_storage_bucket',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'dummy_messaging_sender_id',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'dummy_app_id',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'dummy_measurement_id',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
