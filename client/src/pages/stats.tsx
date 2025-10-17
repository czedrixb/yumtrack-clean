import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FoodAnalysis } from "@shared/schema";
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
  subDays,
  subWeeks,
  subMonths
} from "date-fns";
import { useState } from "react";

type DateRange = {
  start: Date;
  end: Date;
};

export default function Stats() {
  const { data: analyses = [], isLoading } = useQuery<FoodAnalysis[]>({
    queryKey: ['/api/food-analyses'],
  });

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    return {
      start: startOfWeek(today),
      end: endOfWeek(today),
    };
  });
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Handle custom date range selection
  const handleCustomDateRangeSelect = (range: { from?: Date; to?: Date }) => {
    setCustomDateRange(range);
    if (range.from && range.to) {
      setDateRange({
        start: range.from,
        end: range.to,
      });
      setShowCustomPicker(false);
    }
  };

  // Quick date range presets
  const quickDateRanges = [
    { label: "Today", range: { start: startOfDay(new Date()), end: endOfDay(new Date()) } },
    { label: "Yesterday", range: { start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) } },
    { label: "This Week", range: { start: startOfWeek(new Date()), end: endOfWeek(new Date()) } },
    { label: "Last Week", range: { start: startOfWeek(subWeeks(new Date(), 1)), end: endOfWeek(subWeeks(new Date(), 1)) } },
    { label: "This Month", range: { start: startOfMonth(new Date()), end: endOfMonth(new Date()) } },
    { label: "Last Month", range: { start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) } },
    { label: "Last 7 Days", range: { start: subDays(new Date(), 6), end: new Date() } },
    { label: "Last 30 Days", range: { start: subDays(new Date(), 29), end: new Date() } },
  ];

  // Filter analyses based on selected date range
  const filteredAnalyses = analyses.filter(analysis =>
    isWithinInterval(new Date(analysis.createdAt), dateRange)
  );

  // Calculate stats
  const totalCalories = filteredAnalyses.reduce((sum, analysis) => sum + analysis.calories, 0);
  const totalProtein = filteredAnalyses.reduce((sum, analysis) => sum + analysis.protein, 0);
  const avgCaloriesPerMeal = filteredAnalyses.length > 0 ? Math.round(totalCalories / filteredAnalyses.length) : 0;

  // Most analyzed foods within date range
  const foodCounts = filteredAnalyses.reduce((acc, analysis) => {
    acc[analysis.foodName] = (acc[analysis.foodName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topFoods = Object.entries(foodCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Format date range display
  const formatDateRangeDisplay = () => {
    const isSingleDay = format(dateRange.start, 'yyyy-MM-dd') === format(dateRange.end, 'yyyy-MM-dd');
    if (isSingleDay) {
      return format(dateRange.start, 'MMMM d, yyyy');
    }
    return `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
  };

  // Determine range type for display purposes
  const getRangeType = () => {
    const isSingleDay = format(dateRange.start, 'yyyy-MM-dd') === format(dateRange.end, 'yyyy-MM-dd');
    if (isSingleDay) {
      return "Daily";
    }

    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) {
      return "Weekly";
    } else if (daysDiff <= 31) {
      return "Monthly";
    }
    return "Selected Range";
  };

  // Calculate progress bar targets based on date range
  const getCalorieTarget = () => {
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return daysDiff * 2000; // 2000 calories per day
  };

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
        <p className="text-muted-foreground text-sm">Track your nutrition patterns</p>
      </header>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Date Range Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Select</label>
            <div className="grid grid-cols-2 gap-2">
              {quickDateRanges.map((quickRange) => (
                <Button
                  key={quickRange.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange(quickRange.range)}
                >
                  {quickRange.label}
                </Button>
              ))}
              <Button
                variant={showCustomPicker ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className="col-span-2"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Custom Range
              </Button>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {showCustomPicker && (
            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium">Select Custom Range</label>
              <div className="grid grid-cols-1 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.from ? format(customDateRange.from, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange.from}
                      onSelect={(date) => handleCustomDateRangeSelect({ ...customDateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange.to ? format(customDateRange.to, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateRange.to}
                      onSelect={(date) => handleCustomDateRangeSelect({ ...customDateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {customDateRange.from && customDateRange.to && (
                  <Button
                    onClick={() => setShowCustomPicker(false)}
                    className="mt-2"
                  >
                    Apply Custom Range
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Current Range Display */}
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Showing: {formatDateRangeDisplay()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{getRangeType()} Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDateRangeDisplay()}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{filteredAnalyses.length}</div>
              <div className="text-sm text-muted-foreground">Meals Analyzed</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{totalCalories.toLocaleString()}</div>
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
          <CardTitle className="text-lg">{getRangeType()} Nutrition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Protein</span>
              <span>{Math.round(totalProtein)}g</span>
            </div>
            <Progress value={Math.min((totalProtein / 150) * 100, 100)} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Kcal</span>
              <span>{totalCalories.toLocaleString()}</span>
            </div>
            <Progress
              value={Math.min((totalCalories / getCalorieTarget()) * 100, 100)}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Foods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Most Analyzed Foods</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDateRangeDisplay()}
          </p>
        </CardHeader>
        <CardContent>
          {topFoods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No food data available for selected period
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
                  <span className="text-sm text-muted-foreground">{count} time{count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Analysis Count */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-foreground mb-2">{filteredAnalyses.length}</div>
          <div className="text-sm text-muted-foreground">
            Foods Analyzed in Selected Period
          </div>
        </CardContent>
      </Card>
    </main>
  );
}