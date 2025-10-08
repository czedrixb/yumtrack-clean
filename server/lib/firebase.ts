import admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Current working directory:', process.cwd());
console.log('📁 __dirname:', __dirname);

const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
console.log('📁 Looking for service account at:', serviceAccountPath);

try {
  const files = fs.readdirSync(process.cwd());
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  console.log('📁 Files in root directory:', jsonFiles);
  console.log('📁 serviceAccountKey.json exists:', fs.existsSync(serviceAccountPath));
} catch (error) {
  console.log('❌ Cannot read directory:', error);
}

if (!admin.apps.length) {
  try {
    if (fs.existsSync(serviceAccountPath)) {
      console.log('✅ Service account file FOUND');
      
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      
      console.log('📋 Service account project_id:', serviceAccount.project_id);
      console.log('📋 Service account client_email:', serviceAccount.client_email);
      
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Service account missing required fields');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });
      console.log('✅ Firebase Admin initialized with service account file');
    } else {
      console.log('❌ Service account file NOT found at:', serviceAccountPath);
      throw new Error('Service account file not found. Please make sure serviceAccountKey.json is in the project root.');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    
    try {
      console.log('🔄 Trying simple initialization with project ID...');
      admin.initializeApp({
        projectId: 'yumtrack-8f916',
        storageBucket: 'yumtrack-8f916.appspot.com'
      });
      console.log('✅ Firebase Admin initialized with project ID only');
    } catch (fallbackError) {
      console.error('❌ All initialization methods failed:', fallbackError);
      throw new Error('Cannot initialize Firebase Admin SDK. Please check your service account file.');
    }
  }
}

export default admin;
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();