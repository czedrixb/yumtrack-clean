import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, ExternalLink, Bookmark } from "lucide-react";
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

  const openInBrowser = () => {
    trackEvent('webview_open_browser_attempt', 'engagement', 'helper_action');
    
    // Try to open in default browser
    const userAgent = navigator.userAgent.toLowerCase();
    let browserUrl = window.location.href;
    
    if (userAgent.includes('kakaotalk')) {
      // KakaoTalk specific URL scheme
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(browserUrl)}`;
    } else if (userAgent.includes('android')) {
      // Android intent to open in browser
      window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      // Fallback - try to open in new window
      window.open(browserUrl, '_blank');
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
              variant="outline"
              className="w-full justify-start"
              onClick={openInBrowser}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Browser (Recommended)
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={copyUrl}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link to Paste in Browser
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Why this helps:</strong></p>
            <p>• Messenger apps can't install web apps directly</p>
            <p>• Opening in your browser allows full app installation</p>
            <p>• You'll get the best YumTrack experience</p>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}