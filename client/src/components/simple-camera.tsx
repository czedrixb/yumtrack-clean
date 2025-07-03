import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

interface SimpleCameraProps {
  onImageCaptured: (imageData: string) => void;
  onCancel?: () => void;
}

export default function SimpleCamera({ onImageCaptured, onCancel }: SimpleCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('Starting simple camera...');
      
      // Use very basic getUserMedia - most reliable approach
      let mediaStream;
      try {
        // Try back camera first
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (backCameraError) {
        // Fallback to any camera
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      
      console.log('MediaStream obtained');
      setStream(mediaStream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        
        // Simple approach - just set the stream and let the browser handle it
        video.onloadedmetadata = () => {
          video.play().catch(err => {
            console.error('Play error:', err);
            setError('Unable to start camera preview');
          });
        };
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) {
      console.error('Video not available');
      return;
    }

    const video = videoRef.current;
    
    // Create a canvas to capture the frame
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Canvas context not available');
      return;
    }

    // Use video's actual dimensions or fallback
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw the current video frame
    context.drawImage(video, 0, 0, width, height);
    
    // Convert to image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Image captured:', imageData.length);
    
    const compressedImage = await compressImage(imageData, 1024, 0.8);
    setCapturedImage(compressedImage);
    stopCamera();
  }, [stopCamera]);

  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      onImageCaptured(capturedImage);
      setCapturedImage(null);
    }
  }, [capturedImage, onImageCaptured]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const handleCancel = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    onCancel?.();
  }, [stopCamera, onCancel]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="text-white hover:bg-white/10"
        >
          <X className="w-5 h-5 mr-2" />
          Cancel
        </Button>
        <h2 className="text-white font-semibold">Camera</h2>
        <div className="w-20" />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative">
        {error ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center text-white">
              <X className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
              <p className="text-sm opacity-75 mb-4">{error}</p>
              <Button onClick={handleCancel} variant="outline">
                Go Back
              </Button>
            </div>
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
            {/* Simple video element - let the browser handle everything */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ 
                backgroundColor: 'black'
              }}
            />
            
            {/* Camera overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white rounded-2xl opacity-50"></div>
            </div>
            
            {/* Simple status indicator */}
            <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-xs">
              {stream ? 'Camera Active' : 'Starting...'}
            </div>
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
              disabled={!stream}
              className="w-16 h-16 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-50"
            >
              <Camera className="w-8 h-8" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}