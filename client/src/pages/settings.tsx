import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedNotifications = localStorage.getItem('nutrisnap-notifications');
    const savedDarkMode = localStorage.getItem('nutrisnap-dark-mode');
    const savedAnalytics = localStorage.getItem('nutrisnap-analytics');

    if (savedNotifications !== null) setNotifications(JSON.parse(savedNotifications));
    if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
    if (savedAnalytics !== null) setAnalytics(JSON.parse(savedAnalytics));
  }, []);

  const updateSetting = (key: string, value: boolean) => {
    localStorage.setItem(key, JSON.stringify(value));
    toast({
      title: "Settings updated",
      description: "Your preferences have been saved.",
    });
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all analysis history? This action cannot be undone.")) {
      // In a real app, this would call an API endpoint
      localStorage.removeItem('nutrisnap-history');
      toast({
        title: "History cleared",
        description: "All analysis history has been removed.",
      });
    }
  };

  const exportData = () => {
    // In a real app, this would export user data
    toast({
      title: "Export started",
      description: "Your data export will be ready shortly.",
    });
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
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

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Usage Analytics</Label>
              <p className="text-sm text-muted-foreground">Help improve the app</p>
            </div>
            <Switch
              id="analytics"
              checked={analytics}
              onCheckedChange={(checked) => {
                setAnalytics(checked);
                updateSetting('nutrisnap-analytics', checked);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={exportData}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Export My Data
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={clearHistory}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Clear All History
          </Button>
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
