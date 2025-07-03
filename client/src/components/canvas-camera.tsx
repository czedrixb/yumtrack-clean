import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

interface CanvasCameraProps {
  onImageCaptured: (imageData: string) => void;
  onCancel?: () => void;
}

export default function CanvasCamera({ onImageCaptured, onCancel }: CanvasCameraProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsInitializing(true);
      
      console.log('Starting canvas camera...');
      
      // Get media stream with simple constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      console.log('MediaStream obtained for canvas camera');
      setStream(mediaStream);
      
      // Set up hidden video element to receive the stream
      if (hiddenVideoRef.current) {
        const video = hiddenVideoRef.current;
        video.srcObject = mediaStream;
        video.muted = true;
        video.playsInline = true;
        
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            console.log('Hidden video playing for canvas');
            
            // Start canvas rendering loop
            const renderLoop = () => {
              if (!canvasRef.current || !video) return;
              
              const canvas = canvasRef.current;
              const context = canvas.getContext('2d');
              if (!context) return;
              
              // Set canvas size if not set
              if (canvas.width !== 640 || canvas.height !== 480) {
                canvas.width = 640;
                canvas.height = 480;
              }
              
              // Draw video frame to canvas
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                context.drawImage(video, 0, 0, 640, 480);
                
                if (isInitializing) {
                  setIsInitializing(false);
                  console.log('Canvas camera ready');
                }
              }
              
              // Continue loop
              if (stream && stream.active) {
                animationFrameRef.current = requestAnimationFrame(renderLoop);
              }
            };
            
            renderLoop();
          } catch (playError) {
            console.error('Failed to play hidden video:', playError);
            setError('Camera initialization failed');
          }
        };
      }
    } catch (err) {
      console.error('Error starting canvas camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsInitializing(false);
    }
  }, [stream, isInitializing]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!canvasRef.current) {
      console.error('Canvas not available for capture');
      return;
    }

    console.log('Capturing photo from canvas...');
    
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    console.log('Canvas capture complete, data length:', imageData.length);
    
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
        <div className="w-20" /> {/* Spacer */}
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
            {/* Canvas for live preview */}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
              style={{ backgroundColor: 'black' }}
            />
            
            {/* Hidden video element for stream */}
            <video
              ref={hiddenVideoRef}
              autoPlay
              playsInline
              muted
              style={{ display: 'none' }}
            />
            
            {/* Loading overlay */}
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
            
            {/* Camera overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white rounded-2xl opacity-50"></div>
            </div>
            
            {/* Debug info */}
            <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-xs">
              Stream: {stream ? 'Active' : 'Inactive'}
              <br />
              Canvas: {canvasRef.current ? `${canvasRef.current.width}x${canvasRef.current.height}` : 'N/A'}
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
              disabled={isInitializing}
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