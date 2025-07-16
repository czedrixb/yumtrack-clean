import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone, Monitor, Zap, Wifi, Camera } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";
import { useToast } from "@/hooks/use-toast";

export default function DownloadPage() {
  const { canInstall, install, isInstalled } = usePWA();
  const { toast } = useToast();

  const handleDirectDownload = async () => {
    if (isInstalled) {
      toast({
        title: "App already installed",
        description: "YumTrack is already installed on your home screen.",
      });
      return;
    }

    if (canInstall) {
      try {
        const installed = await install();
        if (installed) {
          toast({
            title: "App installed successfully",
            description: "YumTrack has been added to your home screen.",
          });
          return;
        }
      } catch (error) {
        console.error('Installation failed:', error);
        toast({
          title: "Installation failed",
          description: "Please try again or install manually from your browser menu.",
          variant: "destructive",
        });
      }
    } else {
      // Show platform-specific instructions as toast
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      if (isIOS) {
        toast({
          title: "Install on iOS",
          description: "Tap the Share button (□↗) in Safari, then 'Add to Home Screen', and tap 'Add' to confirm.",
        });
      } else if (isAndroid) {
        toast({
          title: "Install on Android",
          description: "Tap the menu (⋮) in Chrome, then 'Add to Home screen', and tap 'Add' to confirm.",
        });
      } else {
        toast({
          title: "Install on Desktop",
          description: "Look for the install button (⊕) in your browser's address bar or check the browser menu for 'Install app' option.",
        });
      }
    }
  };



  const features = [
    { icon: Camera, title: "AI Food Analysis", description: "Take photos and get instant nutrition facts" },
    { icon: Wifi, title: "Works Offline", description: "Access your history even without internet" },
    { icon: Zap, title: "Lightning Fast", description: "Optimized for mobile performance" },
  ];

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">App Already Installed!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              YumTrack is already installed on your device. Look for the app icon on your home screen.
            </p>
            <Button onClick={() => window.location.href = "/"} className="w-full">
              Open App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Download className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Download YumTrack</h1>
          <p className="text-xl text-gray-600 mb-6">
            AI-powered food nutrition analysis app
          </p>
          <div className="flex justify-center space-x-2 mb-8">
            <Badge variant="secondary" className="text-sm">
              <Smartphone className="w-4 h-4 mr-1" />
              Mobile Optimized
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Monitor className="w-4 h-4 mr-1" />
              Works on Desktop
            </Badge>
          </div>
        </div>

        {/* Download Button */}
        <div className="text-center mb-16">
          <Button
            onClick={handleDirectDownload}
            size="lg"
            className="text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-shadow"
          >
            <Download className="w-6 h-6 mr-3" />
            {isInstalled ? "App Already Installed" : canInstall ? "Install App Now" : "Get Installation Instructions"}
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Free • Works offline • No app store required
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">
                  1
                </div>
                <h3 className="font-semibold mb-2">Take a Photo</h3>
                <p className="text-muted-foreground text-sm">Snap a picture of your food using your camera</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">
                  2
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-muted-foreground text-sm">Our AI identifies the food and calculates nutrition</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 font-bold text-lg">
                  3
                </div>
                <h3 className="font-semibold mb-2">Get Results</h3>
                <p className="text-muted-foreground text-sm">View detailed nutrition facts and health insights</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progressive Web App Info */}
        <Card>
          <CardContent className="text-center pt-6">
            <h3 className="text-lg font-semibold mb-4">What is a Progressive Web App?</h3>
            <p className="text-muted-foreground mb-4">
              YumTrack is a Progressive Web App (PWA) that combines the best of web and mobile apps. 
              It installs directly from your browser without needing an app store.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Works offline</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Auto-updates</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Small file size</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Cross-platform</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}