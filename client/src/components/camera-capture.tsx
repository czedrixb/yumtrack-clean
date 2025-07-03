import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Camera, RotateCcw, Check } from "lucide-react";
import { compressImage } from "@/lib/image-utils";

interface CameraCaptureProps {
  onImageCaptured: (imageData: string) => void;
  onCancel?: () => void;
  trigger?: React.ReactNode;
}

export default function CameraCapture({ onImageCaptured, onCancel, trigger }: CameraCaptureProps) {
  const [isOpen, setIsOpen] = useState(!trigger);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      let mediaStream;
      
      // Try with back camera first
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
      } catch (err) {
        // Fallback to any available camera
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Force video to play
        await videoRef.current.play().catch(console.error);
        console.log('Camera stream started successfully');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions or use gallery instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera automatically when component mounts in camera mode (no trigger)
  useEffect(() => {
    if (!trigger && isOpen && !capturedImage && !stream) {
      startCamera();
    }
  }, [isOpen, capturedImage, stream, trigger, startCamera]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to blob and compress
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    const compressedImage = await compressImage(imageData, 1024, 0.8);
    
    setCapturedImage(compressedImage);
    stopCamera();
  }, [stopCamera]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      const compressedImage = await compressImage(imageData, 1024, 0.8);
      setCapturedImage(compressedImage);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onImageCaptured(capturedImage);
      setIsOpen(false);
      setCapturedImage(null);
    }
  }, [capturedImage, onImageCaptured]);

  const handleCancel = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setIsOpen(false);
    onCancel?.();
  }, [stopCamera, onCancel]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const CameraCaptureContent = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 text-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-white hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>
        
        {!capturedImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-white hover:bg-white/10"
          >
            Gallery
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {error ? (
          <div className="flex items-center justify-center h-full p-4">
            <Card className="max-w-sm mx-auto">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full mx-auto flex items-center justify-center">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Camera Access Error</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Choose from Gallery Instead
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : capturedImage ? (
          <div className="h-full flex items-center justify-center bg-black">
            <img
              src={capturedImage}
              alt="Captured food"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Camera overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white rounded-2xl opacity-50"></div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50">
        {capturedImage ? (
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleRetake}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Retake
            </Button>
            <Button
              size="lg"
              onClick={handleConfirm}
              className="bg-primary text-primary-foreground"
            >
              <Check className="w-5 h-5 mr-2" />
              Use Photo
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={capturePhoto}
              disabled={!stream}
              className="w-16 h-16 rounded-full bg-white text-black hover:bg-white/90"
            >
              <Camera className="w-8 h-8" />
            </Button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );

  if (trigger) {
    return (
      <>
        <div onClick={() => fileInputRef.current?.click()}>
          {trigger}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </>
    );
  }

  return <CameraCaptureContent />;
}
