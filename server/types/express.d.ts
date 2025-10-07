// server/types/express.d.ts
import { User as FirebaseUser } from 'firebase/auth';

declare global {
  namespace Express {
    interface User {
      uid: string;
      email: string | null;
      displayName: string | null;
    }
    
    interface Request {
      user?: User;
    }
  }
}

// This export is needed for TypeScript to treat this as a module
export {};