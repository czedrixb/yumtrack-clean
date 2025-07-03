import { useState } from "react";
import { Camera, Image, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CanvasCamera from "@/components/canvas-camera";
import NutritionResults from "@/components/nutrition-results";
import type { FoodAnalysis } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { dataURLtoBlob } from "@/lib/image-utils";

type ViewState = 'upload' | 'camera' | 'analyzing' | 'results';

export default function Home() {
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
      queryClient.invalidateQueries({ queryKey: ['/api/food-analyses'] });
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
  };

  if (currentView === 'camera') {
    return (
      <CanvasCamera
        onImageCaptured={handleImageSelected}
        onCancel={() => setCurrentView('upload')}
      />
    );
  }

  if (currentView === 'analyzing') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <div className="w-20 h-20 bg-gradient-accent rounded-2xl mx-auto flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Analyzing Your Food</h2>
          <p className="text-muted-foreground text-sm">Our AI is identifying ingredients and calculating nutrition...</p>
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

  return (
    <main className="max-w-sm mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <header className="text-center space-y-3">
        <div className="w-20 h-20 bg-gradient-primary rounded-2xl mx-auto flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Snap Your Food</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">Take a photo of your meal and get instant nutrition analysis powered by AI</p>
      </header>

      {/* Image Preview */}
      {selectedImage && (
        <Card className="overflow-hidden">
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
            >
              Retake
            </Button>
            <Button 
              onClick={() => {
                if (selectedImage) {
                  setCurrentView('analyzing');
                  analysisMutation.mutate(selectedImage);
                }
              }}
              disabled={analysisMutation.isPending}
              className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              {analysisMutation.isPending ? 'Analyzing...' : 'Analyze Food'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Buttons */}
      {!selectedImage && (
        <div className="space-y-3">
          <Button 
            onClick={() => setCurrentView('camera')}
            className="w-full bg-primary text-primary-foreground py-4 h-auto text-lg font-semibold shadow-lg hover:bg-primary/90"
          >
            <Camera className="w-6 h-6 mr-3" />
            Take Photo
          </Button>
          
          <Button 
            variant="outline"
            className="w-full py-4 h-auto text-lg font-semibold border-2 hover:border-primary hover:text-primary"
            onClick={() => {
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
            <Image className="w-6 h-6 mr-3" />
            Choose from Gallery
          </Button>
        </div>
      )}

      {/* Recent Analysis */}
      {recentAnalyses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Analysis</h3>
          {recentAnalyses.map((analysis) => (
            <Card key={analysis.id} className="p-4">
              <div className="flex items-center space-x-4">
                <img 
                  src={analysis.imageUrl} 
                  alt={analysis.foodName}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{analysis.foodName}</h4>
                  <p className="text-sm text-muted-foreground">{analysis.calories} calories</p>
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
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
