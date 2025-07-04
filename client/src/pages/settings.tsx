import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePWA } from "@/hooks/use-pwa";
import { Download, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { toast } = useToast();
  const { canInstall, install, isInstalled } = usePWA();

  useEffect(() => {
    // Load settings from localStorage
    const savedNotifications = localStorage.getItem('nutrisnap-notifications');
    const savedDarkMode = localStorage.getItem('nutrisnap-dark-mode');

    if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
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
      const response = await fetch('/api/food-analyses', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
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
    if (canInstall) {
      const installed = await install();
      if (installed) {
        toast({
          title: "App installed",
          description: "NutriSnap has been added to your home screen.",
        });
        return;
      }
    }
    
    // Show manual install instructions modal
    setShowInstallModal(true);
  };

  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      return {
        title: "Install on iOS",
        steps: [
          "Tap the Share button (□↗) in Safari",
          "Scroll down and tap 'Add to Home Screen'",
          "Tap 'Add' to confirm"
        ]
      };
    } else if (isAndroid) {
      return {
        title: "Install on Android",
        steps: [
          "Tap the menu (⋮) in Chrome",
          "Tap 'Add to Home screen'",
          "Tap 'Add' to confirm"
        ]
      };
    } else {
      return {
        title: "Install on Desktop",
        steps: [
          "Look for the install button (⊕) in your browser's address bar",
          "Or check the browser menu for 'Install app' option",
          "Click to install the app"
        ]
      };
    }
  };



  return (
    <main className="max-w-sm mx-auto px-4 py-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Customize your NutriSnap experience</p>
      </header>

      {/* App Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">App Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified about new features</p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={(checked) => {
                setNotifications(checked);
                updateSetting('nutrisnap-notifications', checked);
              }}
            />
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Switch to dark theme</p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={(checked) => {
                setDarkMode(checked);
                updateSetting('nutrisnap-dark-mode', checked);
                document.documentElement.classList.toggle('dark', checked);
              }}
            />
          </div>


        </CardContent>
      </Card>

      {/* App Installation */}
      {!isInstalled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Install App</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="default"
              className="w-full justify-start"
              onClick={handleInstallApp}
            >
              <Download className="w-4 h-4 mr-2" />
              {canInstall ? "Install NutriSnap" : "Get Install Instructions"}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Install NutriSnap on your device for faster access and an app-like experience
            </p>
            
            <Link href="/download">
              <Button variant="outline" size="sm" className="mt-3">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Download Page
              </Button>
            </Link>
            
            {/* Install Instructions Modal */}
            <AlertDialog open={showInstallModal} onOpenChange={setShowInstallModal}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{getInstallInstructions().title}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Follow these steps to install NutriSnap as an app on your device:
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3 my-4">
                  {getInstallInstructions().steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-sm text-foreground flex-1">{step}</p>
                    </div>
                  ))}
                </div>
                <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setShowInstallModal(false)}>
                    Got it
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Clear All History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All History</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear all analysis history? This will permanently delete all your food analyses and cannot be undone.
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
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">NutriSnap</h3>
            <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            <p className="text-xs text-muted-foreground">AI-powered nutrition analysis</p>
          </div>

          <div className="text-center space-y-2">
            <Button variant="link" className="text-sm">
              Privacy Policy
            </Button>
            <Button variant="link" className="text-sm">
              Terms of Service
            </Button>
            <Button variant="link" className="text-sm">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
