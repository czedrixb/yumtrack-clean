import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Camera, Image, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SimpleCamera from "@/components/simple-camera";
import NutritionResults from "@/components/nutrition-results";
import PullToRefresh from "@/components/pull-to-refresh";
import MobileHeader from "@/components/mobile-header";
import type { FoodAnalysis } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { dataURLtoBlob } from "@/lib/image-utils";
import { trackEvent } from "@/lib/analytics";

type ViewState = 'upload' | 'camera' | 'analyzing' | 'results';

interface HomeRef {
  goToHome: () => void;
}

const Home = forwardRef<HomeRef>((props, ref) => {
  const [currentView, setCurrentView] = useState<ViewState>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | null>(null);
  const { toast } = useToast();

  const { data: recentAnalyses = [] } = useQuery<FoodAnalysis[]>({
    queryKey: ['/api/food-analyses/recent?limit=3'],
  });

  const analysisMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const blob = dataURLtoBlob(imageData);
      const formData = new FormData();
      formData.append('image', blob, 'food-image.jpg');
      
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze food');
      }

      return response.json() as Promise<FoodAnalysis>;
    },
    onSuccess: (result) => {
      setAnalysisResult(result);
      setCurrentView('results');
      // Track successful food analysis
      trackEvent('food_analysis_complete', 'engagement', 'success');
      // Invalidate both queries to update home page data
      queryClient.invalidateQueries({ queryKey: ['/api/food-analyses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/food-analyses/recent?limit=3'] });
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Unable to analyze food. Please try again.",
        variant: "destructive",
      });
      setCurrentView('upload');
    },
  });

  const handleImageSelected = (imageData: string) => {
    setSelectedImage(imageData);
    setCurrentView('upload');
  };

  const handleAnalysisComplete = (result: FoodAnalysis) => {
    setAnalysisResult(result);
    setCurrentView('results');
  };

  const handleNewAnalysis = () => {
    setCurrentView('upload');
    setSelectedImage(null);
    setAnalysisResult(null);
    // Refresh recent analyses when returning to home
    queryClient.invalidateQueries({ queryKey: ['/api/food-analyses/recent?limit=3'] });
  };

  // Expose goToHome method through ref
  useImperativeHandle(ref, () => ({
    goToHome: () => {
      setCurrentView('upload');
      setSelectedImage(null);
      setAnalysisResult(null);
      queryClient.invalidateQueries({ queryKey: ['/api/food-analyses/recent?limit=3'] });
    }
  }));

  // Refetch recent analyses when returning to home view
  useEffect(() => {
    if (currentView === 'upload') {
      queryClient.invalidateQueries({ queryKey: ['/api/food-analyses/recent?limit=3'] });
    }
  }, [currentView]);

  if (currentView === 'camera') {
    return (
      <SimpleCamera
        onImageCaptured={handleImageSelected}
        onCancel={() => setCurrentView('upload')}
      />
    );
  }

  if (currentView === 'analyzing') {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm mx-auto">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-primary rounded-3xl mx-auto flex items-center justify-center animate-pulse shadow-2xl">
              <Sparkles className="w-12 h-12 text-white animate-spin" />
            </div>
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 rounded-full animate-ping"></div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">AI is analyzing...</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Identifying ingredients and calculating detailed nutrition information
            </p>
          </div>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'results' && analysisResult) {
    return (
      <NutritionResults
        analysis={analysisResult}
        onNewAnalysis={handleNewAnalysis}
      />
    );
  }

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/food-analyses/recent?limit=3'] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="h-full">
        {/* Mobile Header */}
        <MobileHeader 
          title="YumTrack" 
          subtitle="AI-powered nutrition analysis"
          className="bg-gradient-primary text-white"
        />
        
        <main className="px-4 py-6 space-y-6">
          {/* Hero Section with Logo */}
          <div className="text-center space-y-6 py-4">
            <div className="relative">
              <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="mx-auto drop-shadow-lg">
                {/* Magnifying glass circle */}
                <circle cx="45" cy="45" r="30" stroke="#fd7e14" strokeWidth="10" fill="none"/>
                {/* Magnifying glass handle */}
                <line x1="68" y1="68" x2="85" y2="85" stroke="#fd7e14" strokeWidth="12" strokeLinecap="round"/>
                {/* Leaf inside the glass */}
                <path d="M45,55 C35,55 30,45 35,35 C40,25 50,30 55,40 C60,50 55,55 45,55 Z" fill="#28a745"/>
                <path d="M45,55 C47,45 55,43 55,35" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
              <div className="absolute -inset-6 bg-gradient-primary opacity-10 rounded-full blur-xl"></div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Snap & Analyze</h1>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                Take a photo of your meal and get instant nutrition insights powered by AI
              </p>
            </div>
          </div>

          {/* Image Preview */}
          {selectedImage && (
            <Card className="overflow-hidden shadow-lg rounded-3xl">
              <div className="aspect-square bg-muted">
                <img 
                  src={selectedImage} 
                  alt="Food preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4 flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                  className="mobile-button rounded-2xl"
                >
                  Retake
                </Button>
                <Button 
                  onClick={() => {
                    if (selectedImage) {
                      setCurrentView('analyzing');
                      trackEvent('food_analysis_start', 'engagement', 'manual_analysis');
                      analysisMutation.mutate(selectedImage);
                    }
                  }}
                  disabled={analysisMutation.isPending}
                  className="mobile-button bg-gradient-primary text-white shadow-lg hover:shadow-xl rounded-2xl px-6 py-3"
                >
                  {analysisMutation.isPending ? 'Analyzing...' : 'Analyze Food'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Upload Buttons */}
          {!selectedImage && (
            <div className="space-y-4">
              <Button 
                onClick={() => {
                  trackEvent('camera_open', 'engagement', 'photo_capture');
                  setCurrentView('camera');
                }}
                className="mobile-button w-full bg-gradient-primary text-white py-6 h-auto text-lg font-semibold shadow-2xl hover:shadow-3xl rounded-3xl transform transition-all duration-200 active:scale-95"
              >
                <Camera className="w-7 h-7 mr-3" />
                Take Photo
              </Button>
              
              <Button 
                variant="outline"
                className="mobile-button w-full py-6 h-auto text-lg font-semibold border-2 border-primary/30 hover:border-primary hover:bg-primary/5 rounded-3xl transform transition-all duration-200 active:scale-95"
                onClick={() => {
                  trackEvent('gallery_open', 'engagement', 'image_upload');
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const imageData = event.target?.result as string;
                        handleImageSelected(imageData);
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                <Image className="w-7 h-7 mr-3" />
                Choose from Gallery
              </Button>
            </div>
          )}

          {/* Recent Analysis */}
          {recentAnalyses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Recent Analysis
              </h3>
              <div className="space-y-3">
                {recentAnalyses.map((analysis) => (
                  <Card key={analysis.id} className="mobile-card p-4 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={analysis.imageUrl} 
                        alt={analysis.foodName}
                        className="w-16 h-16 rounded-2xl object-cover shadow-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{analysis.foodName}</h4>
                        <p className="text-sm text-primary font-medium">{analysis.calories} calories</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setAnalysisResult(analysis);
                          setCurrentView('results');
                        }}
                        className="mobile-button rounded-2xl p-3 hover:bg-primary/10"
                      >
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </PullToRefresh>
  );
});

Home.displayName = 'Home';

export default Home;
