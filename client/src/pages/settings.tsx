import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { usePWA } from "@/hooks/use-pwa";
import { Download, Mail, Star, MessageCircle, LogOut, User, Mail as MailIcon, Edit, Key, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import emailjs from "@emailjs/browser";
import {
  logoutUser,
  updateUserProfile,
  updateUserPassword,
  updateUserEmail,
  sendVerificationEmail,
} from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { queryClient } from "@/lib/queryClient";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const emailSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
  currentPassword: z.string().min(1, "Current password is required to change email"),
});

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const feedbackSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  rating: z
    .number()
    .min(1, "Please select a rating")
    .max(5, "Rating must be between 1 and 5"),
  message: z.string().min(10, "Feedback must be at least 10 characters"),
});

export default function Settings() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailCurrentPassword, setShowEmailCurrentPassword] = useState(false);

  const { toast } = useToast();
  const { canInstall, install, isInstalled, isInWebView } = usePWA();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();

  // Function to get user-friendly error message (same as login page)
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
    if (error.includes('auth/requires-recent-login')) {
      return 'For security reasons, please sign in again to change your email or password.';
    }
    if (error.includes('auth/provider-already-linked')) {
      return 'This account is already linked to another authentication method.';
    }
    if (error.includes('auth/credential-already-in-use')) {
      return 'This credential is already associated with another user account.';
    }
    if (error.includes('auth/operation-not-allowed')) {
      return 'Please verify your new email address before changing your email. We have sent a verification link to your new email.';
    }
    if (error.includes('EMAIL_CHANGE_PENDING_VERIFICATION')) {
      return 'Please verify your current email first to proceed with the email change.';
    }


    return 'Something went wrong. Please try again.';
  };

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentUser?.displayName || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: "",
      currentPassword: "",
    },
  });

  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const feedbackForm = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: "",
      rating: 0,
      message: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        displayName: currentUser.displayName || "",
      });
      emailForm.reset({
        newEmail: "",
        currentPassword: "",
      });
    }
  }, [currentUser, profileForm, emailForm]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("nutrisnap-dark-mode");
    if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Password visibility toggle functions
  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const toggleEmailCurrentPasswordVisibility = () => {
    setShowEmailCurrentPassword(!showEmailCurrentPassword);
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setIsUpdatingProfile(true);
    try {
      const result = await updateUserProfile(values.displayName);

      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });

        // Update local state
        setCurrentUser({
          ...currentUser!,
          displayName: values.displayName,
        });

        setShowProfileModal(false);
      } else {
        const friendlyError = getUserFriendlyError(result.error || '');
        toast({
          title: "Update failed",
          description: friendlyError,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const friendlyError = getUserFriendlyError(errorMessage);
      toast({
        title: "Error",
        description: friendlyError,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsUpdatingPassword(true);
    try {
      const result = await updateUserPassword(values.currentPassword, values.newPassword);

      if (result.success) {
        toast({
          title: "Password updated",
          description: "Your password has been updated successfully.",
        });

        passwordForm.reset();
        setShowPasswordModal(false);
        // Reset password visibility states
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        const friendlyError = getUserFriendlyError(result.error || '');
        toast({
          title: "Update failed",
          description: friendlyError,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const friendlyError = getUserFriendlyError(errorMessage);
      toast({
        title: "Error",
        description: friendlyError,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const onEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsUpdatingEmail(true);
    try {
      if (values.newEmail === currentUser?.email) {
        toast({
          title: "No changes made",
          description: "New email is the same as your current email.",
          variant: "destructive",
        });
        return;
      }

      const result = await updateUserEmail(values.currentPassword, values.newEmail);

      if (result.success) {
        toast({
          title: "Email updated successfully",
          description: "Your email has been updated. Please check your new email for verification.",
        });

        // Update local state
        setCurrentUser({
          ...currentUser!,
          email: values.newEmail,
          emailVerified: false,
        });

        setShowEmailModal(false);
        emailForm.reset();
        setShowEmailCurrentPassword(false);

      } else {
        const friendlyError = getUserFriendlyError(result.error || '');
        toast({
          title: "Update failed",
          description: friendlyError,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unexpected error in email submit:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const friendlyError = getUserFriendlyError(errorMessage);
      toast({
        title: "Error",
        description: friendlyError,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };





  const refreshUserAuthState = async () => {
    if (currentUser) {
      try {
        await currentUser.reload();
        const updatedUser = auth.currentUser;
        setCurrentUser(updatedUser);
        console.log('Manual refresh - Email verified:', updatedUser?.emailVerified);

        return updatedUser;
      } catch (error) {
        console.error('Error refreshing auth state:', error);
        return currentUser;
      }
    }
    return currentUser;
  };

  const updateSetting = (key: string, value: boolean) => {
    localStorage.setItem(key, JSON.stringify(value));
    toast({
      title: "Settings updated",
      description: "Your preferences have been saved.",
    });
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to clear history");
      }

      const token = await currentUser.getIdToken();

      const response = await fetch("/api/food-analyses", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to clear history");
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/food-analyses'] });

      toast({
        title: "History cleared",
        description: "All analysis history has been removed.",
      });

    } catch (error) {
      console.error("Clear history error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear history. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleInstallApp = async () => {
    trackEvent("pwa_install_attempt", "engagement", "settings_page");

    // Debug logging
    console.log("Settings Install Debug:", {
      isInstalled,
      canInstall,
      isInWebView,
      userAgent: navigator.userAgent,
    });

    // If in webview (messenger/kakaotalk), open in browser directly
    if (isInWebView) {
      const currentUrl = window.location.href;
      const userAgent = navigator.userAgent.toLowerCase();

      trackEvent("webview_browser_redirect", "engagement", "settings_install");

      // Try multiple methods to open in browser
      let opened = false;

      if (userAgent.includes("kakaotalk")) {
        // KakaoTalk specific methods
        try {
          // Method 1: KakaoTalk external browser
          window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(currentUrl)}`;
          opened = true;
        } catch (e) {
          console.log("KakaoTalk method 1 failed, trying fallback");
        }
      } else if (
        userAgent.includes("messenger") ||
        userAgent.includes("fban") ||
        userAgent.includes("fbav")
      ) {
        // Facebook Messenger methods
        try {
          // Method 1: Android intent
          if (userAgent.includes("android")) {
            window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
            opened = true;
          }
        } catch (e) {
          console.log("Messenger method 1 failed, trying fallback");
        }
      }

      // Universal fallback methods
      if (!opened) {
        try {
          // Method 2: Try to open in new window/tab
          const newWindow = window.open(currentUrl, "_blank");
          if (newWindow) {
            opened = true;
          }
        } catch (e) {
          console.log("Window.open failed, trying location change");
        }
      }

      // Last resort: direct location change
      if (!opened) {
        window.location.href = currentUrl;
      }

      return;
    }

    // For regular browsers, check if app is already installed first
    if (isInstalled) {
      toast({
        title: "App already installed",
        description: "YumTrack is already installed on your home screen.",
      });
      trackEvent("pwa_already_installed", "engagement", "settings_install");
      return;
    }

    // If not installed but can install, attempt installation
    if (canInstall && install) {
      try {
        const installed = await install();
        if (installed) {
          trackEvent("pwa_install_success", "engagement", "settings_install");
          toast({
            title: "App installed",
            description: "YumTrack has been added to your home screen.",
          });
          return;
        }
      } catch (error) {
        console.error("Installation failed:", error);
        trackEvent("pwa_install_failed", "engagement", "settings_install");
        toast({
          title: "Installation failed",
          description: "Failed to install the app. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // If PWA install isn't available, provide appropriate guidance
      toast({
        title: "Installation unavailable",
        description: "Your browser doesn't support app installation. Look for the 'Add to Home Screen' option in your browser menu.",
      });
      trackEvent("pwa_install_unavailable", "engagement", "settings_install");
    }
  };

  const onContactSubmit = async (values: z.infer<typeof contactSchema>) => {
    setIsSubmitting(true);
    try {
      // EmailJS configuration - temporary hardcoded values for testing
      const serviceID = "service_98xbwrl";
      const templateID = "template_a9bagiw";
      const publicKey = "CQ8ikKs9ILlgDBEPm";

      console.log("EmailJS Config:", { serviceID, templateID, publicKey });

      if (!serviceID || !templateID || !publicKey) {
        throw new Error("EmailJS configuration missing");
      }

      // Initialize EmailJS with public key
      emailjs.init(publicKey);

      const templateParams = {
        from_name: values.name,
        from_email: values.email,
        to_name: "W Soft Labs Support",
        to_email: "uedu.dev@gmail.com",
        message: `From: ${values.name} (${values.email})\n\nMessage:\n${values.message}`,
        subject: "YumTrack Inquiry",
        app_name: "YumTrack",
        user_name: values.name,
        user_email: values.email,
        reply_to: values.email,
      };

      console.log("Sending email with params:", templateParams);

      const result = await emailjs.send(serviceID, templateID, templateParams);
      console.log("EmailJS Success:", result);

      toast({
        title: "Message sent",
        description:
          "Your support request has been sent to W Soft Labs. We'll get back to you soon!",
      });

      contactForm.reset();
      setShowContactModal(false);
    } catch (error) {
      console.error("EmailJS error:", error);
      console.error("Error details:", JSON.stringify(error));
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFeedbackSubmit = async (values: z.infer<typeof feedbackSchema>) => {
    setIsFeedbackSubmitting(true);
    try {
      // EmailJS configuration - same as contact support
      const serviceID = "service_98xbwrl";
      const templateID = "template_a9bagiw";
      const publicKey = "CQ8ikKs9ILlgDBEPm";

      console.log("EmailJS Config:", { serviceID, templateID, publicKey });

      if (!serviceID || !templateID || !publicKey) {
        throw new Error("EmailJS configuration missing");
      }

      // Initialize EmailJS with public key
      emailjs.init(publicKey);

      const templateParams = {
        from_name: values.name,
        from_email: "noreply@yumtrack.app",
        to_name: "W Soft Labs Support",
        to_email: "uedu.dev@gmail.com",
        message: `From: ${values.name}\nRating: ${values.rating}/5 stars\n\nFeedback:\n${values.message}`,
        subject: "YumTrack User Feedback",
        app_name: "YumTrack",
        user_name: values.name,
        user_rating: values.rating,
        reply_to: "noreply@yumtrack.app",
      };

      console.log("Sending feedback email with params:", templateParams);

      const result = await emailjs.send(serviceID, templateID, templateParams);
      console.log("EmailJS Feedback Success:", result);

      toast({
        title: "Feedback sent",
        description:
          "Thank you for your feedback! Your message has been sent to W Soft Labs.",
      });

      feedbackForm.reset();
      setShowFeedbackModal(false);
    } catch (error) {
      console.error("EmailJS feedback error:", error);
      console.error("Error details:", JSON.stringify(error));
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logoutUser();

      if (result.success) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });

        // Redirect to login page
        setLocation('/login');
      } else {
        const friendlyError = getUserFriendlyError(result.error || '');
        toast({
          title: "Logout failed",
          description: friendlyError,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const friendlyError = getUserFriendlyError(errorMessage);
      toast({
        title: "Error",
        description: friendlyError,
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="max-w-sm mx-auto px-4 py-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Customize your YumTrack experience
        </p>
      </header>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">App Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch to dark theme
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={(checked) => {
                setDarkMode(checked);
                updateSetting("nutrisnap-dark-mode", checked);
                document.documentElement.classList.toggle("dark", checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {authLoading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading user information...</p>
            </div>
          ) : currentUser ? (
            <>
              {/* User Information */}
              <div className="space-y-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {currentUser.displayName || "User"}
                    </p>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MailIcon className="w-3 h-3" />
                      <span className="truncate">{currentUser.email}</span>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowProfileModal(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>

                {/* Change Password Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>

                {/* Change Email Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowEmailModal(true)}
                >
                  <MailIcon className="w-4 h-4 mr-2" />
                  Change Email
                </Button>
              </div>

              {/* Logout Button */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={isLoggingOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Logout</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to logout? You will need to sign in again to use YumTrack.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto flex items-center justify-center bg-muted rounded-full">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Not Signed In</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign in to access all features
                </p>
              </div>
              <Button
                onClick={() => setLocation('/login')}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <AlertDialog open={showProfileModal} onOpenChange={(open) => {
        setShowProfileModal(open);
        if (!open) {
          profileForm.reset({
            displayName: currentUser?.displayName || "",
          });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Update your display name and profile information.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your display name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowProfileModal(false)}>
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? "Updating..." : "Update Profile"}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Modal */}
      <AlertDialog open={showPasswordModal} onOpenChange={(open) => {
        setShowPasswordModal(open);
        if (!open) {
          passwordForm.reset({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          // Reset password visibility states when modal closes
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current password and set a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={toggleCurrentPasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                          aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={toggleNewPasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowPasswordModal(false);
                  passwordForm.reset();
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPassword(false);
                }}>
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? "Updating..." : "Change Password"}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Email Modal */}
      <AlertDialog open={showEmailModal} onOpenChange={(open) => {
        setShowEmailModal(open);
        if (!open) {
          // When closing, reset fields completely
          emailForm.reset({
            newEmail: "",
            currentPassword: "",
          });
          setShowEmailCurrentPassword(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Email</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your new email address and confirm with your current password.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="space-y-4"
            >
              <FormField
                control={emailForm.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">New Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter new email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={emailForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground" >Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showEmailCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password to confirm"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={toggleEmailCurrentPasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                          aria-label={showEmailCurrentPassword ? "Hide password" : "Show password"}
                        >
                          {showEmailCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowEmailModal(false);
                  emailForm.reset({
                    newEmail: currentUser?.email || "",
                    currentPassword: "",
                  });
                  setShowEmailCurrentPassword(false);
                }}>
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" disabled={isUpdatingEmail}>
                  {isUpdatingEmail ? "Updating..." : "Change Email"}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>



      {/* App Installation - Mobile Only */}
      {isMobile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Install App</CardTitle>
          </CardHeader>
          <CardContent>
            {isInstalled ? (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-full">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    App Already Installed
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    YumTrack is installed on your home screen
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Button
                  variant="default"
                  className="w-full justify-start"
                  onClick={handleInstallApp}
                  disabled={false}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  {isInWebView
                    ? "You're in a messenger app. Tap Install to learn how to open in your browser first."
                    : "Install YumTrack on your device for faster access and an app-like experience"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentUser ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                  Clear All History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All History</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to clear all analysis history? This will
                    permanently delete all your food analyses and cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearHistory}
                    disabled={isClearing}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isClearing ? "Clearing..." : "Clear History"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <div className="text-center p-4 border border-dashed border-muted-foreground/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Sign in to manage your analysis history
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto flex items-center justify-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Magnifying glass circle */}
                <circle
                  cx="45"
                  cy="45"
                  r="30"
                  stroke="#fd7e14"
                  strokeWidth="10"
                  fill="none"
                />
                {/* Magnifying glass handle */}
                <line
                  x1="68"
                  y1="68"
                  x2="85"
                  y2="85"
                  stroke="#fd7e14"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Leaf inside the glass */}
                <path
                  d="M45,55 C35,55 30,45 35,35 C40,25 50,30 55,40 C60,50 55,55 45,55 Z"
                  fill="#28a745"
                />
                <path
                  d="M45,55 C47,45 55,43 55,35"
                  stroke="white"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">YumTrack</h3>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            <p className="text-xs text-muted-foreground">
              AI-powered nutrition analysis
            </p>
          </div>

          <div className="text-center space-y-2">
            <Button
              variant="link"
              className="text-sm"
              onClick={() => setLocation('/privacy-policy')}
            >
              Privacy Policy
            </Button>
            <Button
              variant="link"
              className="text-sm"
              onClick={() => setLocation('/terms-of-service')}
            >
              Terms of Service
            </Button>
            <Button
              variant="link"
              className="text-sm"
              onClick={() => setShowContactModal(true)}
            >
              Contact Support
            </Button>

          </div>
        </CardContent>
      </Card>

      {/* Contact Support Modal */}
      <AlertDialog open={showContactModal} onOpenChange={(open) => {
        setShowContactModal(open);
        if (!open) {
          contactForm.reset({
            name: "",
            email: "",
            message: "",
          });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Contact Support</AlertDialogTitle>
            <AlertDialogDescription>
              Send a message to W Soft Labs support team. We'll get back to you
              as soon as possible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...contactForm}>
            <form
              onSubmit={contactForm.handleSubmit(onContactSubmit)}
              className="space-y-4"
            >
              <FormField
                control={contactForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground" >Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground" >Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={contactForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground" >Message</FormLabel> {/* Add className here */}
                    <FormControl>
                      <Textarea
                        placeholder="Describe your issue, feature request, or question..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowContactModal(false);
                  contactForm.reset();
                }}>
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" disabled={isSubmitting}>
                  Submit
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Feedback Modal */}
      <AlertDialog open={showFeedbackModal} onOpenChange={(open) => {
        setShowFeedbackModal(open);
        if (!open) {
          feedbackForm.reset({
            name: "",
            rating: 0,
            message: "",
          });
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>User Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Share your thoughts about YumTrack! Tell us what you love, what
              could be improved, or suggest new features.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Form {...feedbackForm}>
            <form
              onSubmit={feedbackForm.handleSubmit(onFeedbackSubmit)}
              className="space-y-4"
            >
              <FormField
                control={feedbackForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feedbackForm.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Rating</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => field.onChange(star)}
                            className={`p-1 transition-colors ${star <= field.value
                              ? "text-yellow-400"
                              : "text-gray-300 hover:text-yellow-200"
                              }`}
                          >
                            <Star
                              className="w-6 h-6"
                              fill={
                                star <= field.value ? "currentColor" : "none"
                              }
                            />
                          </button>
                        ))}
                        {field.value > 0 && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {field.value}/5 stars
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feedbackForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground" >Feedback</FormLabel> {/* Add className here */}
                    <FormControl>
                      <Textarea
                        placeholder="Share your thoughts, suggestions, or ideas for improvement..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowFeedbackModal(false);
                  feedbackForm.reset();
                }}>
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" disabled={isFeedbackSubmitting}>
                  {isFeedbackSubmitting ? "Sending..." : "Send Feedback"}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}