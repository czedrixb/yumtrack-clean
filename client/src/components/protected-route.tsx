// components/protected-route.tsx
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { resendVerificationEmail } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export default function ProtectedRoute({
  children,
  requireEmailVerification = true
}: ProtectedRouteProps) {
  const { user, loading, isEmailVerified } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  const handleResendVerification = async () => {
    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        toast({
          title: "Verification email sent",
          description: "Check your email for the verification link.",
        });
      } else {
        toast({
          title: "Failed to send verification email",
          description: result.error || 'Please try again later.',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show verification banner instead of blocking access
  if (requireEmailVerification && !isEmailVerified) {
    return (
      <div className="min-h-screen">
        {/* Verification Banner */}
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Verify your email address
                </p>
                <p className="text-sm text-yellow-700">
                  Please check your inbox and click the verification link we sent to {user.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
              >
                Resend Email
              </Button>
              <Button
                size="sm"
                onClick={() => window.location.reload()}
              >
                I've Verified
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </div>
    );
  }

  return <>{children}</>;
}