import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { loginWithEmail, signUpWithEmail, sendPasswordReset, resendVerificationEmail } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const { toast } = useToast();
  const { user, isEmailVerified, loading: authLoading } = useAuth();

  // Auto-redirect to home if user is logged in and verified
  useEffect(() => {
    if (!authLoading && user && isEmailVerified) {
      console.log('User is logged in and verified, redirecting to home');
      setLocation('/');
    }
  }, [user, isEmailVerified, authLoading, setLocation]);

  useEffect(() => {
    // Check if user just came from email verification
    const urlParams = new URLSearchParams(window.location.search);
    const fromVerification = urlParams.get('fromVerification');

    if (fromVerification === 'success') {
      toast({
        title: "Email verified!",
        description: "Your email has been verified. You can now log in.",
      });
      // Clean up the URL
      window.history.replaceState({}, '', '/login');
    }
  }, [toast]);

  // Function to get user-friendly error message
  const getUserFriendlyError = (error: string) => {
    if (error.includes('auth/invalid-credential')) {
      return 'The email or password you entered is incorrect. Please try again.';
    }
    if (error.includes('auth/user-not-found')) {
      return 'No account found with this email address. Please check your email or sign up for a new account.';
    }
    if (error.includes('auth/wrong-password')) {
      return 'The password you entered is incorrect. Please try again.';
    }
    if (error.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Please sign in or use a different email.';
    }
    if (error.includes('auth/weak-password')) {
      return 'Please choose a stronger password. It should be at least 6 characters long.';
    }
    if (error.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (error.includes('auth/network-request-failed')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (error.includes('auth/too-many-requests')) {
      return 'Too many failed attempts. Please try again in a few minutes.';
    }
    if (error.includes('email is already verified')) {
      return 'Your email is already verified.';
    }

    return 'Something went wrong. Please try again.';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation (keep your existing validation code)
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!isLogin && !formData.username) {
      toast({
        title: "Missing username",
        description: "Please enter a username to create your account.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let result;

      if (isLogin) {
        result = await loginWithEmail(formData.email, formData.password);

        if (result.success) {
          console.log('Login successful, user data:', result.user);

          // For login: Wait a moment for auth state to update, then check verification
          setTimeout(async () => {
            try {
              // Force refresh the auth state
              const currentUser = auth.currentUser;
              if (currentUser) {
                await currentUser.reload();
                const refreshedUser = auth.currentUser;

                console.log('Refreshed user verification status:', refreshedUser?.emailVerified);

                if (refreshedUser?.emailVerified) {
                  console.log('User is verified, redirecting to home');
                  toast({
                    title: "Welcome back!",
                    description: "Successfully logged in.",
                  });
                  setLocation('/');
                } else {
                  // User is not verified, but don't show verification modal for login
                  console.log('User is not verified, but this is login - allowing access');
                  toast({
                    title: "Welcome back!",
                    description: "Successfully logged in.",
                  });
                  setLocation('/');
                }
              }
            } catch (error) {
              console.error('Error refreshing user:', error);
              // If there's an error refreshing, proceed to home page
              toast({
                title: "Welcome back!",
                description: "Successfully logged in.",
              });
              setLocation('/');
            }
          }, 500);

        } else {
          const friendlyError = getUserFriendlyError(result.error || '');
          toast({
            title: "Sign in failed",
            description: friendlyError,
            variant: "destructive"
          });
        }
      } else {
        // SIGN UP FLOW - Keep existing logic for signup
        result = await signUpWithEmail(formData.email, formData.password, formData.username);

        if (result.success) {
          toast({
            title: "Account created!",
            description: "Your account has been created successfully. Please check your email to verify your account.",
          });

          // For signup: always show verification notice
          setShowVerificationNotice(true);
        } else {
          const friendlyError = getUserFriendlyError(result.error || '');
          toast({
            title: "Sign up failed",
            description: friendlyError,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const friendlyError = getUserFriendlyError(errorMessage);
      toast({
        title: "Something went wrong",
        description: friendlyError,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address to reset your password.",
        variant: "destructive"
      });
      return;
    }

    setResetLoading(true);

    try {
      const result = await sendPasswordReset(resetEmail);

      if (result.success) {
        toast({
          title: "Reset email sent",
          description: "Check your email for instructions to reset your password.",
        });
        setShowForgotPassword(false);
        setResetEmail('');
      } else {
        const friendlyError = getUserFriendlyError(result.error || '');
        toast({
          title: "Failed to send reset email",
          description: friendlyError,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const friendlyError = getUserFriendlyError(errorMessage);
      toast({
        title: "Something went wrong",
        description: friendlyError,
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setVerificationLoading(true);

    try {
      const result = await resendVerificationEmail();

      if (result.success) {
        toast({
          title: "Verification email sent",
          description: "Check your email for the verification link.",
        });
      } else {
        const friendlyError = getUserFriendlyError(result.error || '');
        toast({
          title: "Failed to send verification email",
          description: friendlyError,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const friendlyError = getUserFriendlyError(errorMessage);
      toast({
        title: "Something went wrong",
        description: friendlyError,
        variant: "destructive"
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="45" cy="45" r="30" stroke="#fd7e14" strokeWidth="8" fill="none" />
              <line x1="68" y1="68" x2="85" y2="85" stroke="#fd7e14" strokeWidth="10" strokeLinecap="round" />
              <path d="M45,55 C35,55 30,45 35,35 C40,25 50,30 55,40 C60,50 55,55 45,55 Z" fill="#28a745" />
              <path d="M45,55 C47,45 55,43 55,35" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            <span className="text-2xl text-[#343a40] font-semibold">YumTrack</span>
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? 'Welcome back' : 'Create account'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Enter your email and password to sign in'
              : 'Enter your details to create your account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create account')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => {
                setIsLogin(!isLogin);
                setShowVerificationNotice(false);
                setFormData({
                  username: '',
                  email: '',
                  password: ''
                });
              }}
            >
              {isLogin ? (
                <>
                  Don't have an account? <span className="text-primary font-semibold">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="text-primary font-semibold">Sign in</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Note:</strong> Use real email and password to create account
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reset your password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you instructions to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    disabled={resetLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={resetLoading}
                  >
                    {resetLoading ? 'Sending...' : 'Send reset email'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Verification Notice Modal */}
      {showVerificationNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Verify your email</CardTitle>
              <CardDescription>
                We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> You need to verify your email before you can access all features.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowVerificationNotice(false);
                  }}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleResendVerification}
                  disabled={verificationLoading}
                >
                  {verificationLoading ? 'Sending...' : 'Resend email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}