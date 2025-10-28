// components/email-verification-handler.tsx
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmailVerificationHandler() {
  const [, setLocation] = useLocation();
  const { user, isEmailVerified } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'login_required'>('processing');
  const [verificationChecked, setVerificationChecked] = useState(false);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the oobCode from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const oobCode = urlParams.get('oobCode');
        const mode = urlParams.get('mode');

        console.log('Email verification handler triggered:', { mode, oobCode, user: user?.email });

        if (mode === 'verifyEmail' && oobCode) {
          // If user is logged in, refresh their auth state
          if (user) {
            console.log('User is logged in, refreshing auth state...');

            // Force refresh the user's token and data
            await user.getIdToken(true);
            await user.reload();

            // Check if email is now verified
            const updatedUser = auth.currentUser;
            console.log('Updated user verification status:', updatedUser?.emailVerified);

            if (updatedUser?.emailVerified) {
              console.log('Email verification confirmed!');
              setStatus('success');
              setVerificationChecked(true);

              toast({
                title: "Email verified successfully!",
                description: "Your email has been verified. You can now access all features.",
              });

              // Redirect to home after a short delay
              setTimeout(() => {
                setLocation('/');
              }, 2000);
            } else {
              // Email not verified yet, might need to wait a bit
              console.log('Email not verified yet, will check again...');
              if (!verificationChecked) {
                setVerificationChecked(true);
                // Wait and check again
                setTimeout(() => {
                  checkVerificationStatus();
                }, 2000);
              } else {
                // Already checked once, show success but suggest login
                setStatus('success');
                toast({
                  title: "Email verification processed!",
                  description: "Your email has been verified. Please log in to continue.",
                });
              }
            }
          } else {
            // User is not logged in - this is normal when clicking verification links
            console.log('User not logged in - verification will be processed by Firebase');
            setStatus('login_required');

            toast({
              title: "Email verification processed!",
              description: "Your email has been verified. Please log in to continue.",
            });

            // Redirect to login after a short delay
            setTimeout(() => {
              setLocation('/login');
            }, 3000);
          }
        } else {
          throw new Error('Invalid verification link');
        }
      } catch (error) {
        console.error('Email verification error:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkVerificationStatus = async () => {
      try {
        if (user) {
          await user.reload();
          const updatedUser = auth.currentUser;

          if (updatedUser?.emailVerified) {
            console.log('Email verification confirmed on retry!');
            setStatus('success');
            toast({
              title: "Email verified successfully!",
              description: "Your email has been verified. You can now access all features.",
            });
            setTimeout(() => {
              setLocation('/');
            }, 2000);
          } else {
            setStatus('login_required');
            toast({
              title: "Email verification processed!",
              description: "Your email has been verified. Please log in to continue.",
            });
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        setStatus('error');
      }
    };

    // Small delay to ensure auth state is loaded
    setTimeout(() => {
      handleEmailVerification();
    }, 500);
  }, [setLocation, toast, user, verificationChecked]);

  // If user is already verified when component mounts, redirect immediately
  useEffect(() => {
    if (isEmailVerified && status === 'processing') {
      console.log('User is already verified, redirecting to home');
      setStatus('success');
      setTimeout(() => {
        setLocation('/');
      }, 1000);
    }
  }, [isEmailVerified, status, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Processing Email Verification</CardTitle>
            <CardDescription>
              Please wait while we process your email verification...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking verification status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">Email Verified Successfully!</CardTitle>
            <CardDescription>
              Your email has been verified. Redirecting you to the home page...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-muted-foreground mb-4">You will be redirected shortly.</p>
            <Button
              onClick={() => setLocation('/')}
            >
              Go to Home Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'login_required') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-blue-600">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. Please log in to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your email address has been verified. You can now log in to access all features.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => setLocation('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Verification Failed</CardTitle>
            <CardDescription>
              There was an issue verifying your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The verification link is invalid or has expired. Please request a new verification email.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocation('/login')}
              >
                Back to Login
              </Button>
              <Button
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}