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

export const initiateEmailChange = async (currentPassword: string, newEmail: string): Promise<AuthResult> => {
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

    // Store the pending email in localStorage
    const pendingEmailData = {
      newEmail,
      timestamp: Date.now(),
      uid: user.uid,
      currentEmail: user.email // Store current email for fallback
    };
    localStorage.setItem('pendingEmailChange', JSON.stringify(pendingEmailData));

    // IMPORTANT: We CANNOT update the email immediately due to Firebase restrictions
    // Instead, we'll send a verification email to the NEW email with special instructions
    
    // First, let's try to update the email (this will likely fail with operation-not-allowed)
    try {
      await updateEmail(user, newEmail);
      console.log('Email updated successfully to:', newEmail);
      
      // If we get here, the email was updated - send verification to new email
      await sendEmailVerification(user, {
        url: `${window.location.origin}/settings?emailChangeVerified=true`,
        handleCodeInApp: false
      });
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: newEmail,
          displayName: user.displayName,
        }
      };
    } catch (updateError: any) {
      // If update fails due to verification requirement, handle it gracefully
      if (updateError.code === 'auth/operation-not-allowed') {
        console.log('Email update requires verification first, using fallback approach');
        
        // Fallback approach: Send verification to current email with instructions
        // This is a workaround since we can't send verification to unverified new email
        await sendEmailVerification(user, {
          url: `${window.location.origin}/settings?emailChangePending=true&newEmail=${encodeURIComponent(newEmail)}`,
          handleCodeInApp: false
        });
        
        return {
          success: false,
          error: 'VERIFICATION_REQUIRED' // Special error code for the frontend
        };
      } else {
        // Re-throw other errors
        throw updateError;
      }
    }
    
  } catch (error: any) {
    console.error('Email change initiation error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Current password is incorrect.';
    } else if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Current password is incorrect.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already in use by another account.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'For security reasons, please sign in again to change your email.';
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

export const completeEmailChangeWithPendingEmail = async (): Promise<AuthResult> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('No user found when completing email change');
      return {
        success: false,
        error: 'No user is currently signed in.'
      };
    }

    console.log('Starting email change completion for user:', user.email);
    console.log('Current email verified status:', user.emailVerified);

    // Check if email is verified
    await user.reload();
    const reloadedUser = auth.currentUser;
    
    console.log('After reload - Email verified:', reloadedUser?.emailVerified);
    console.log('Current email:', reloadedUser?.email);
    
    if (!reloadedUser?.emailVerified) {
      console.log('Email not verified yet');
      return {
        success: false,
        error: 'Please verify your current email before proceeding with the email change. Make sure you clicked the verification link in your email.'
      };
    }

    // Get pending email from storage
    const pendingEmailDataStr = localStorage.getItem('pendingEmailChange');
    console.log('Pending email data from storage:', pendingEmailDataStr);
    
    if (!pendingEmailDataStr) {
      return {
        success: false,
        error: 'No pending email change found. Please start the email change process again.'
      };
    }

    const pendingEmailData = JSON.parse(pendingEmailDataStr);
    console.log('Parsed pending email data:', pendingEmailData);
    
    // Verify the pending email change belongs to current user
    if (pendingEmailData.uid !== user.uid) {
      localStorage.removeItem('pendingEmailChange');
      console.log('User ID mismatch:', { storedUid: pendingEmailData.uid, currentUid: user.uid });
      return {
        success: false,
        error: 'Pending email change does not match current user.'
      };
    }

    // Check if pending email change is not too old (24 hours)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (Date.now() - pendingEmailData.timestamp > TWENTY_FOUR_HOURS) {
      localStorage.removeItem('pendingEmailChange');
      console.log('Pending email change expired');
      return {
        success: false,
        error: 'Pending email change has expired. Please start the process again.'
      };
    }

    console.log('Attempting to update email from', user.email, 'to', pendingEmailData.newEmail);

    // Now update the email (user is verified, so this should work)
    await updateEmail(user, pendingEmailData.newEmail);
    localStorage.removeItem('pendingEmailChange');
    
    console.log('Email change completed successfully:', pendingEmailData.newEmail);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: pendingEmailData.newEmail,
        displayName: user.displayName,
      }
    };
  } catch (error: any) {
    console.error('Email change completion error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'For security reasons, please sign in again to complete the email change.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already in use by another account.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Please verify your new email address before changing email.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'The new email address is invalid.';
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