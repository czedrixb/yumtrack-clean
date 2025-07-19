import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { FoodAnalysis } from "@shared/schema";
import { startOfWeek, endOfWeek, isWithinInterval, format } from "date-fns";

export default function Stats() {
  const { data: analyses = [], isLoading } = useQuery<FoodAnalysis[]>({
    queryKey: ['/api/food-analyses'],
  });

  // Calculate weekly stats
  const thisWeek = {
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  };

  const weeklyAnalyses = analyses.filter(analysis => 
    isWithinInterval(new Date(analysis.createdAt), thisWeek)
  );

  const weeklyCalories = weeklyAnalyses.reduce((sum, analysis) => sum + analysis.calories, 0);
  const weeklyProtein = weeklyAnalyses.reduce((sum, analysis) => sum + analysis.protein, 0);
  const avgCaloriesPerMeal = weeklyAnalyses.length > 0 ? Math.round(weeklyCalories / weeklyAnalyses.length) : 0;

  // Most analyzed foods
  const foodCounts = analyses.reduce((acc, analysis) => {
    acc[analysis.foodName] = (acc[analysis.foodName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topFoods = Object.entries(foodCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (isLoading) {
    return (
      <main className="max-w-sm mx-auto px-4 py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48 mx-auto"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-24 mb-4"></div>
                <div className="h-12 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-6 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Nutrition Stats</h1>
        <p className="text-muted-foreground text-sm">Track your weekly nutrition patterns</p>
      </header>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This Week</CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(thisWeek.start, 'MMM d')} - {format(thisWeek.end, 'MMM d')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{weeklyAnalyses.length}</div>
              <div className="text-sm text-muted-foreground">Meals Analyzed</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{weeklyCalories.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Kcal</div>
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{avgCaloriesPerMeal}</div>
            <div className="text-sm text-muted-foreground">Avg Kcal/Meal</div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Nutrition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Protein</span>
              <span>{Math.round(weeklyProtein)}g</span>
            </div>
            <Progress value={Math.min((weeklyProtein / 150) * 100, 100)} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Kcal</span>
              <span>{weeklyCalories.toLocaleString()}</span>
            </div>
            <Progress value={Math.min((weeklyCalories / 14000) * 100, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Top Foods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Most Analyzed Foods</CardTitle>
        </CardHeader>
        <CardContent>
          {topFoods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No food data available yet
            </p>
          ) : (
            <div className="space-y-3">
              {topFoods.map(([food, count], index) => (
                <div key={food} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">{index + 1}</span>
                    </div>
                    <span className="font-medium text-foreground text-sm">{food}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{count} times</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Analysis Count */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-2">{analyses.length}</div>
          <div className="text-sm text-muted-foreground">Total Foods Analyzed</div>
        </CardContent>
      </Card>
    </main>
  );
}
