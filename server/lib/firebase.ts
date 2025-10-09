import admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Current working directory:', process.cwd());

const possiblePaths = [
  path.resolve(process.cwd(), 'serviceAccountKey.json'),
  path.resolve(process.cwd(), 'config', 'serviceAccountKey.json'),
  path.resolve(__dirname, '..', 'serviceAccountKey.json'),
];

let serviceAccountPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    serviceAccountPath = p;
    console.log('✅ Found service account at:', p);
    break;
  }
}

if (!admin.apps.length) {
  try {
    if (serviceAccountPath) {
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Service account missing required fields');
      }

      if (serviceAccount.private_key.includes('\\n')) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });
      
      console.log('✅ Firebase Admin initialized successfully with service account');
      console.log('📋 Project ID:', serviceAccount.project_id);
      console.log('📋 Client Email:', serviceAccount.client_email);
      
    } else {
      console.log('🔑 No service account file found, trying environment variables...');
      
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
          storageBucket: `${serviceAccount.project_id}.appspot.com`
        });
        console.log('✅ Firebase Admin initialized with environment variable');
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
        console.log('✅ Firebase Admin initialized with application default credentials');
      } else {
        console.log('🔄 Trying initialization with project ID only...');
        admin.initializeApp({
          projectId: 'yumtrack-8f916',
          storageBucket: 'yumtrack-8f916.appspot.com'
        });
        console.log('⚠️ Firebase Admin initialized in limited mode (project ID only)');
      }
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    
    try {
      console.log('🚨 Trying emergency fallback initialization...');
      admin.initializeApp({
        projectId: 'yumtrack-8f916'
      });
      console.log('⚠️ Firebase Admin initialized in emergency mode');
    } catch (fallbackError) {
      console.error('❌ All initialization methods failed:', fallbackError);
    }
  }
} else {
  console.log('✅ Firebase Admin already initialized');
}

export default admin;
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export async function testFirebaseConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing Firebase connection...');
    const collections = await db.listCollections();
    console.log('✅ Firebase connection successful! Available collections:', collections.map(c => c.id));
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
}