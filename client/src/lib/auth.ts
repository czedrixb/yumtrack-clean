import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  updateEmail,
  signOut,
  UserCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export const sendVerificationEmail = async (user: User): Promise<AuthResult> => {
  try {
    console.log('Sending verification email to:', user.email);
    await sendEmailVerification(user);
    console.log('Verification email sent successfully');
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Verification email error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many verification attempts. Please try again later.';
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
      return { success: false, error: 'No user logged in' };
    }

    if (user.email === newEmail) {
      return { success: false, error: 'New email is the same as current email' };
    }

    // Reauthenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update email directly
    await updateEmail(user, newEmail);

    // Send verification to new email
    await sendEmailVerification(user);

    return { 
      success: true, 
      message: 'Email updated successfully. Please check your new email for verification.',
      user: {
        uid: user.uid,
        email: newEmail,
        displayName: user.displayName,
        emailVerified: false // Reset verification status
      }
    };

  } catch (error: any) {
    console.error('Email update error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'For security reasons, please sign in again to change your email.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already in use by another account.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Please verify your current email before changing it.';
    }
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
};


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


export const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  try {
    console.log('Attempting login with:', { email });
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful:', userCredential.user);
    
    // Force reload to get the latest email verification status
    await userCredential.user.reload();
    const updatedUser = auth.currentUser;
    
    console.log('After reload - Email verified:', updatedUser?.emailVerified);
    
    return {
      success: true,
      user: {
        uid: updatedUser?.uid || userCredential.user.uid,
        email: updatedUser?.email || userCredential.user.email,
        displayName: updatedUser?.displayName || userCredential.user.displayName,
        emailVerified: updatedUser?.emailVerified || userCredential.user.emailVerified, 
      }
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
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

      // Send verification email
      await sendVerificationEmail(userCredential.user);
    }

    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: username,
        emailVerified: userCredential.user.emailVerified, // Include verification status
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

export async function sendVerificationEmailToCurrentUser() {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    await sendEmailVerification(user);
    return { 
      success: true, 
      message: 'Verification email sent successfully.' 
    };

  } catch (error: any) {
    console.error('Send verification email error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send verification email.' 
    };
  }
}

export const resendVerificationEmail = async (): Promise<AuthResult> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: 'No user is currently signed in.'
      };
    }

    if (user.emailVerified) {
      return {
        success: false,
        error: 'Email is already verified.'
      };
    }

    return await sendVerificationEmail(user);
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      error: error.message
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

export const sendPasswordReset = async (email: string): Promise<AuthResult> => {
  try {
    console.log('Attempting to send password reset email to:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('Password reset email sent successfully');
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts. Please try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};