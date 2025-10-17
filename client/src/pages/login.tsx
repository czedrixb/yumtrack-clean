import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { loginWithEmail, signUpWithEmail } from '@/lib/auth';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

    return 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
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
      } else {
        result = await signUpWithEmail(formData.email, formData.password, formData.username);
      }

      if (result.success) {
        toast({
          title: isLogin ? "Welcome back!" : "Account created!",
          description: isLogin
            ? "Successfully logged in."
            : "Your account has been created successfully.",
        });

        // Redirect to home page
        setLocation('/');
      } else {
        const friendlyError = getUserFriendlyError(result.error || '');
        toast({
          title: isLogin ? "Sign in failed" : "Sign up failed",
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
      setLoading(false);
    }
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
              <Label htmlFor="password">Password</Label>
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
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hover:underline"
              onClick={() => {
                setIsLogin(!isLogin);
                // Clear form when switching modes
                setFormData({
                  username: '',
                  email: '',
                  password: ''
                });
              }}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          <div className="mt-6 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Note:</strong> Use real email and password to create account
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}