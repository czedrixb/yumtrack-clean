import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, Home, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AndroidInstallInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AndroidInstallInstructions({ isOpen, onClose }: AndroidInstallInstructionsProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Tap the Menu Button",
      description: "Tap the three dots in the top right corner of Chrome",
      icon: MoreVertical,
      image: "⬇️"
    },
    {
      title: "Find Install Option",
      description: "Look for 'Install app' or 'Add to Home screen' in the menu",
      icon: Home,
      image: "📱"
    },
    {
      title: "Confirm Installation",
      description: "Tap 'Install' in the popup to add YumTrack to your home screen",
      icon: Check,
      image: "✅"
    }
  ];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">⬇️</div>
              <p className="text-sm text-gray-600">
                Look for the three dots menu in the top right corner
              </p>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">📱</div>
              <p className="text-sm text-gray-600">
                Scroll through the menu to find the install option
              </p>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              It might be called "Install app" or "Add to Home screen"
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-sm text-gray-600">
                Confirm the installation when prompted
              </p>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              The app will be added to your home screen for quick access
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Install YumTrack on Android</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentStep ? "bg-primary" : "bg-gray-300"
                  }`}
              />
            ))}
          </div>

          {/* Current Step */}
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
            {getStepContent(currentStep)}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={onClose}>
                Got It
              </Button>
            )}
          </div>

          {/* Quick Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-800 mb-1">💡 Quick Tip</h4>
            <p className="text-xs text-blue-700">
              Make sure you're using Chrome browser and have visited the site a few times for the install option to appear.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}