import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Share, PlusSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface IOSInstallInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IOSInstallInstructions({ isOpen, onClose }: IOSInstallInstructionsProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Tap the Share Button",
      description: "Tap the share icon at the bottom of Safari",
      icon: Share,
      image: "📤"
    },
    {
      title: "Add to Home Screen",
      description: "Scroll down and tap 'Add to Home Screen'",
      icon: PlusSquare,
      image: "➕"
    },
    {
      title: "Confirm Installation",
      description: "Tap 'Add' in the top right corner",
      icon: null,
      image: "✅"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Install YumTrack App</DialogTitle>
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
            <div className="text-4xl">{steps[currentStep].image}</div>
            <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">
              {steps[currentStep].description}
            </p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}