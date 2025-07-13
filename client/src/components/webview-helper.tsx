import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, ExternalLink, Bookmark, QrCode, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

interface WebViewHelperProps {
  isInWebView: boolean;
}

export default function WebViewHelper({ isInWebView }: WebViewHelperProps) {
  const [showHelper, setShowHelper] = useState(false);
  const { toast } = useToast();

  if (!isInWebView) return null;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      trackEvent('webview_url_copied', 'engagement', 'helper_action');
      toast({
        title: "URL Copied",
        description: "You can now paste this link in your browser to install the app",
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "URL Ready",
        description: "Link copied! Open your browser and paste it to install the app",
      });
    }
  };

  const generateQRCode = () => {
    const url = window.location.href;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    
    trackEvent('webview_qr_generated', 'engagement', 'helper_action');
    
    // Open QR code in new window/tab
    window.open(qrUrl, '_blank');
  };

  const openInBrowser = () => {
    trackEvent('webview_open_browser_attempt', 'engagement', 'helper_action');
    
    const userAgent = navigator.userAgent.toLowerCase();
    const browserUrl = window.location.href;
    
    // Enhanced browser opening logic
    if (userAgent.includes('kakaotalk')) {
      // KakaoTalk: Multiple fallback options
      try {
        window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(browserUrl)}`;
      } catch {
        // Fallback to generic browser intent
        window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;end`;
      }
    } else if (userAgent.includes('fban') || userAgent.includes('fbav')) {
      // Facebook Messenger
      window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
    } else if (userAgent.includes('android')) {
      // Generic Android webview
      window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(browserUrl)};end`;
    } else {
      // iOS or other - try to open in new window
      const newWindow = window.open(browserUrl, '_blank');
      if (!newWindow) {
        // If popup blocked, show instructions
        setShowHelper(true);
      }
    }
  };

  return (
    <>
      <div className="fixed bottom-20 left-4 right-4 bg-orange-500 text-white p-3 rounded-lg shadow-lg z-40 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4" />
            <span>Add YumTrack to your phone</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowHelper(true)}
            className="text-xs px-3 py-1 h-auto"
          >
            How?
          </Button>
        </div>
      </div>

      <AlertDialog open={showHelper} onOpenChange={setShowHelper}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add YumTrack to Home Screen</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the best option for your device:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 my-4">
            <Button
              variant="default"
              className="w-full justify-start bg-primary hover:bg-primary/90"
              onClick={openInBrowser}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Browser (Best Option)
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={generateQRCode}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Show QR Code (Scan with Camera)
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={copyUrl}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link to Share
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Why use the browser?</strong></p>
            <p>• Get the full YumTrack app experience</p>
            <p>• Save photos offline and install as home screen app</p>
            <p>• Works perfectly on all phones and tablets</p>
            <p>• No downloads needed - it's a modern web app</p>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}