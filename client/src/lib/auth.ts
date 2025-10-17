import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  updateEmail,
  signOut,
  UserCredential,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export const updateUserProfile = async (displayName: string): Promise<AuthResult> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: 'No user is currently signed in.'
      };
    }

    await updateProfile(user, { displayName });
    console.log('Profile updated successfully:', displayName);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
      }
    };
  } catch (error: any) {
    console.error('Profile update error:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};

export const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return {
        success: false,
        error: 'No user is currently signed in.'
      };
    }

    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
    console.log('Password updated successfully');

    return {
      success: true
    };
  } catch (error: any) {
    console.error('Password update error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'New password is too weak. Use at least 6 characters.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

export const updateUserEmail = async (currentPassword: string, newEmail: string): Promise<AuthResult> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return {
        success: false,
        error: 'No user is currently signed in.'
      };
    }

    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update email
    await updateEmail(user, newEmail);
    console.log('Email updated successfully:', newEmail);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: newEmail,
        displayName: user.displayName,
      }
    };
  } catch (error: any) {
    console.error('Email update error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already in use by another account.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

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