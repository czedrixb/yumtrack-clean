// server/lib/firebase.ts
import admin from 'firebase-admin';

let isInitialized = false;
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;
let storage: admin.storage.Storage;

export function initializeFirebase() {
  if (isInitialized) return;

  console.log('🔧 Initializing Firebase Admin...');
  console.log('🔧 Firebase environment check:');
  console.log('FIREBASE_SERVICE_ACCOUNT present:', !!process.env.FIREBASE_SERVICE_ACCOUNT);

  if (!admin.apps.length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.log('🔑 Using FIREBASE_SERVICE_ACCOUNT environment variable...');
        
        let serviceAccount;
        try {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          console.log('✅ Successfully parsed FIREBASE_SERVICE_ACCOUNT');
        } catch (parseError) {
          console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable');
          throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON format');
        }

        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error('Service account missing required fields in environment variable');
        }

        if (serviceAccount.private_key.includes('\\n')) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
          storageBucket: `${serviceAccount.project_id}.appspot.com`
        });
        
        console.log('✅ Firebase Admin initialized with environment variable');
        console.log('📋 Project ID:', serviceAccount.project_id);
        
      } else {
        console.log('🔄 No service account found, trying initialization with project ID only...');
        admin.initializeApp({
          projectId: 'yumtrack-8f916',
          storageBucket: 'yumtrack-8f916.appspot.com'
        });
        console.log('⚠️ Firebase Admin initialized in limited mode (project ID only)');
      }
    } catch (error) {
      console.error('❌ Error initializing Firebase Admin:', error);
      throw error;
    }
  } else {
    console.log('✅ Firebase Admin already initialized');
  }
  
  // Initialize instances
  db = admin.firestore();
  auth = admin.auth();
  storage = admin.storage();
  
  isInitialized = true;
}

export function getFirestore() {
  if (!isInitialized) {
    initializeFirebase();
  }
  return db;
}

export function getAuth() {
  if (!isInitialized) {
    initializeFirebase();
  }
  return auth;
}

export function getStorage() {
  if (!isInitialized) {
    initializeFirebase();
  }
  return storage;
}

export default admin;