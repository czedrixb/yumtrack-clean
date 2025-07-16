import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Share2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { FoodAnalysis } from "@shared/schema";

interface NutritionResultsProps {
  analysis: FoodAnalysis;
  onNewAnalysis: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function NutritionResults({ 
  analysis, 
  onNewAnalysis, 
  showBackButton = false, 
  onBack 
}: NutritionResultsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Parse JSON fields
  const vitamins = analysis.vitamins ? JSON.parse(analysis.vitamins) : [];
  const minerals = analysis.minerals ? JSON.parse(analysis.minerals) : [];
  const healthInsights = analysis.healthInsights ? JSON.parse(analysis.healthInsights) : [];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to local storage as backup
      const savedAnalyses = JSON.parse(localStorage.getItem('nutrisnap-saved') || '[]');
      savedAnalyses.push(analysis);
      localStorage.setItem('nutrisnap-saved', JSON.stringify(savedAnalyses));
      
      toast({
        title: "Analysis saved",
        description: "Your nutrition analysis has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Unable to save analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${analysis.foodName} - Nutrition Analysis`,
      text: `${analysis.foodName}: ${analysis.calories} calories, ${analysis.protein}g protein, ${analysis.carbohydrates}g carbs, ${analysis.fat}g fat`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.text);
        toast({
          title: "Copied to clipboard",
          description: "Nutrition data has been copied to your clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="max-w-sm mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      {showBackButton && (
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Analysis Result</h1>
        </div>
      )}

      {/* Food Identification */}
      <Card className="overflow-hidden">
        <div className="aspect-square bg-muted">
          <img 
            src={analysis.imageUrl} 
            alt={analysis.foodName}
            className="w-full h-full object-cover"
          />
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{analysis.foodName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {Math.round(analysis.confidence * 100)}% confidence match
            </p>
          </div>
          
          {/* Calorie Summary */}
          <div className="bg-gradient-primary rounded-xl p-6 text-white text-center">
            <div className="text-4xl font-bold">{analysis.calories}</div>
            <div className="text-lg font-medium">Total kcal</div>
            <div className="text-sm opacity-90 mt-1">{analysis.servingSize}</div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nutrition Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Macronutrients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="font-medium text-foreground">Protein</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">{analysis.protein}g</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((analysis.protein / 50) * 100)}% DV
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                <span className="font-medium text-foreground">Carbohydrates</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">{analysis.carbohydrates}g</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((analysis.carbohydrates / 300) * 100)}% DV
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <span className="font-medium text-foreground">Fat</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">{analysis.fat}g</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((analysis.fat / 65) * 100)}% DV
                </div>
              </div>
            </div>

            {analysis.fiber && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-foreground">Fiber</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground">{analysis.fiber}g</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((analysis.fiber / 25) * 100)}% DV
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vitamins & Minerals */}
          {(vitamins.length > 0 || minerals.length > 0) && (
            <div className="border-t border-border pt-4">
              <h4 className="font-medium text-foreground mb-3">Key Vitamins & Minerals</h4>
              <div className="grid grid-cols-2 gap-3">
                {[...vitamins.slice(0, 2), ...minerals.slice(0, 2)].map((nutrient, index) => (
                  <div key={index} className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="font-semibold text-foreground">{nutrient.name}</div>
                    <div className="text-sm text-muted-foreground">{nutrient.amount}</div>
                    <div className="text-xs text-muted-foreground">{nutrient.dailyValue}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Insights */}
      {healthInsights.length > 0 && (
        <Card className="bg-gradient-secondary text-white">
          <CardHeader>
            <CardTitle className="text-lg">Health Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {healthInsights.map((insight, index) => (
              <p key={index}>• {insight}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button 
          onClick={handleShare}
          variant="outline"
          className="flex-1 border-2 hover:border-primary hover:text-primary"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share
        </Button>
      </div>

      {/* New Analysis Button */}
      <Button 
        onClick={onNewAnalysis}
        className="w-full bg-primary text-primary-foreground py-4 h-auto text-lg font-semibold shadow-lg hover:bg-primary/90"
      >
        <Camera className="w-6 h-6 mr-3" />
        Analyze Another Food
      </Button>
    </main>
  );
}
