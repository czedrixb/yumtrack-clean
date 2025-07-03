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

export default function CameraCapture({
  onImageCaptured,
  onCancel,
  trigger,
}: CameraCaptureProps) {
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
      console.log('Starting camera...');
      
      // Use very simple constraints first
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('MediaStream obtained:', mediaStream.active, mediaStream.getVideoTracks().length);
      setStream(mediaStream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        console.log('Setting video source...');
        
        // Create a completely new video element approach
        video.srcObject = mediaStream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        // Use a promise to handle video loading properly
        const playVideo = () => {
          return new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = async () => {
              console.log('Metadata loaded:', video.videoWidth, 'x', video.videoHeight);
              try {
                await video.play();
                console.log('Video playing');
                resolve();
              } catch (playErr) {
                console.error('Play failed:', playErr);
                reject(playErr);
              }
            };
            
            video.onerror = (err) => {
              console.error('Video error:', err);
              reject(err);
            };
          });
        };
        
        await playVideo();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions or use gallery instead.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera automatically when component mounts in camera mode (no trigger)
  useEffect(() => {
    if (!trigger && isOpen && !capturedImage && !stream) {
      console.log("Starting camera from useEffect");
      startCamera();
    }
  }, [isOpen, capturedImage, stream, trigger, startCamera]);

  // Also try to start camera when dialog first opens
  useEffect(() => {
    if (isOpen && !stream && !capturedImage) {
      console.log("Dialog opened, attempting to start camera");
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [isOpen, stream, capturedImage, startCamera]);

  const capturePhoto = useCallback(async () => {
    console.log("Attempting to capture photo...");

    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      console.error("Canvas context not available");
      return;
    }

    // Wait for video to be ready
    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0 ||
      video.readyState < 2
    ) {
      console.log("Video not ready, waiting...");
      // Wait up to 3 seconds for video to be ready
      for (let i = 0; i < 30; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          video.readyState >= 2
        ) {
          break;
        }
      }
    }

    console.log("Video state before capture:", {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState,
      paused: video.paused,
      currentTime: video.currentTime,
    });

    // Use video dimensions or fallback
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Clear canvas and draw video frame
    context.clearRect(0, 0, width, height);
    context.drawImage(video, 0, 0, width, height);

    // Convert to blob and compress
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    console.log("Image captured, data length:", imageData.length);

    const compressedImage = await compressImage(imageData, 1024, 0.8);
    console.log("Image compressed, final length:", compressedImage.length);

    setCapturedImage(compressedImage);
    stopCamera();
  }, [stopCamera]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        const compressedImage = await compressImage(imageData, 1024, 0.8);
        setCapturedImage(compressedImage);
      };
      reader.readAsDataURL(file);
    },
    [],
  );

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
                  <h3 className="font-semibold text-foreground">
                    Camera Access Error
                  </h3>
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
          <div className="relative w-full h-full bg-black">
            {stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  width="100%"
                  height="100%"
                  style={{
                    objectFit: "cover",
                    backgroundColor: "black"
                  }}
                />

                {/* Camera overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white rounded-2xl opacity-50"></div>
                </div>

                {/* Debug overlay */}
                <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-xs">
                  Stream:{" "}
                  {stream
                    ? `${stream.getVideoTracks().length} video track(s)`
                    : "Inactive"}
                  <br />
                  Video:{" "}
                  {videoRef.current
                    ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
                    : "N/A"}
                  <br />
                  Ready:{" "}
                  {videoRef.current ? videoRef.current.readyState : "N/A"}
                  <br />
                  Playing: {videoRef.current ? !videoRef.current.paused : "N/A"}
                  <br />
                  Error: {error || "None"}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-white text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
          </div>
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
        <div onClick={() => fileInputRef.current?.click()}>{trigger}</div>
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
