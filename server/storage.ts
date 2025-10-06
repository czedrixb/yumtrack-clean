import { firebaseStorage } from './lib/firebase-storage';

// Export the Firebase storage instance instead of MemStorage
export const storage = firebaseStorage;