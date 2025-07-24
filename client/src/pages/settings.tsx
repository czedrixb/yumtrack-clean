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
import { useToast } from "@/hooks/use-toast";
import { usePWA } from "@/hooks/use-pwa";
import { Download, Mail, Star, MessageCircle } from "lucide-react";
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
  const [darkMode, setDarkMode] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);

  const { toast } = useToast();
  const { canInstall, install, isInstalled, isInWebView } = usePWA();
  const isMobile = useIsMobile();

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
    // Load settings from localStorage
    const savedDarkMode = localStorage.getItem("nutrisnap-dark-mode");

    if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
  }, []);

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
      const response = await fetch("/api/food-analyses", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear history");
      }

      toast({
        title: "History cleared",
        description: "All analysis history has been removed.",
      });

      // Refresh the cache to update any displayed data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear history. Please try again.",
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

    // For regular browsers, attempt PWA installation
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
      }
    } else {
      // Check if app is already installed
      if (isInstalled) {
        toast({
          title: "App already installed",
          description: "YumTrack is already installed on your home screen.",
        });
        trackEvent("pwa_already_installed", "engagement", "settings_install");
      } else {
        // If PWA install isn't available, show unavailable message
        toast({
          title: "App already installed",
          description: "YumTrack is already installed on your home screen.",
        });
        trackEvent("pwa_install_unavailable", "engagement", "settings_install");
      }
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
            <Button variant="link" className="text-sm">
              Privacy Policy
            </Button>
            <Button variant="link" className="text-sm">
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
      <AlertDialog open={showContactModal} onOpenChange={setShowContactModal}>
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
                    <FormLabel>Name</FormLabel>
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
                    <FormLabel>Email</FormLabel>
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
                    <FormLabel>Message</FormLabel>
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
                <AlertDialogCancel onClick={() => setShowContactModal(false)}>
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Mail className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Feedback Modal */}
      <AlertDialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
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
                    <FormLabel>Name</FormLabel>
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
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => field.onChange(star)}
                            className={`p-1 transition-colors ${
                              star <= field.value
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
                    <FormLabel>Feedback</FormLabel>
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
                <AlertDialogCancel onClick={() => setShowFeedbackModal(false)}>
                  Cancel
                </AlertDialogCancel>
                <Button type="submit" disabled={isFeedbackSubmitting}>
                  {isFeedbackSubmitting ? (
                    <>
                      <Mail className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
