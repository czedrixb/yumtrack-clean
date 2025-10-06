import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  UserCredential 
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  try {
    console.log('Attempting login with:', { email });
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful:', userCredential.user);
    
    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      }
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
    // More specific error messages
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const signUpWithEmail = async (email: string, password: string, username: string): Promise<AuthResult> => {
  try {
    console.log('Attempting signup with:', { email, username });
    
    // Validate password length
    if (password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long.'
      };
    }

    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Signup successful:', userCredential.user);
    
    // Update profile with username
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: username
      });
      console.log('Profile updated with username:', username);
    }

    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: username,
      }
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // More specific error messages
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Use at least 6 characters.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password accounts are not enabled. Please check Firebase configuration.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const logoutUser = async (): Promise<AuthResult> => {
  try {
    await signOut(auth);
    console.log('Logout successful');
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Logout error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};