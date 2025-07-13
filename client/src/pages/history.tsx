import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NutritionResults from "@/components/nutrition-results";
import type { FoodAnalysis } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function History() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<FoodAnalysis | null>(null);
  const { toast } = useToast();

  const { data: analyses = [], isLoading } = useQuery<FoodAnalysis[]>({
    queryKey: ['/api/food-analyses'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/food-analyses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/food-analyses'] });
      toast({
        title: "Analysis deleted",
        description: "The food analysis has been removed from your history.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (selectedAnalysis) {
    return (
      <NutritionResults
        analysis={selectedAnalysis}
        onNewAnalysis={() => setSelectedAnalysis(null)}
        showBackButton
        onBack={() => setSelectedAnalysis(null)}
      />
    );
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Analysis History</h1>
        <p className="text-muted-foreground text-sm">View and manage your food analyses</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">No Analysis History</h3>
              <p className="text-sm text-muted-foreground mt-1">Start analyzing food to see your history here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardContent className="p-4">
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
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteMutation.mutate(analysis.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
