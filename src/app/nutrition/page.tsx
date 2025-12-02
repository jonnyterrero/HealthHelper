"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { loadEntries, todayISO, lastNDays, analyzeNutritionPatterns, type NutritionEntry, type MealEntry } from "@/lib/health";
import { ArrowLeft, Plus, Trash2, Sparkles, AlertCircle, TrendingUp, Apple } from "lucide-react";

export default function NutritionPage() {
  const [entries, setEntries] = React.useState(() => loadEntries());
  const [date, setDate] = React.useState(todayISO());
  
  const [meals, setMeals] = React.useState<Array<{ time: string; type: string; foods: string[]; notes: string }>>([]);
  const [newMeal, setNewMeal] = React.useState({
    time: "",
    type: "breakfast" as "breakfast" | "lunch" | "dinner" | "snack",
    foods: [] as string[],
    currentFood: ""
  });

  // Load existing meals for selected date
  React.useEffect(() => {
    const entry = entries.find((e) => e.date === date);
    if (entry?.nutrition?.meals && Array.isArray(entry.nutrition.meals)) {
      setMeals(entry.nutrition.meals);
    } else {
      setMeals([]);
    }
  }, [date, entries]);

  // AI Nutrition Analysis
  const nutritionAnalysis = React.useMemo(() => {
    const recent = lastNDays(entries, 30);
    return analyzeNutritionPatterns(recent);
  }, [entries]);

  const addFood = () => {
    if (newMeal.currentFood.trim()) {
      setNewMeal({
        ...newMeal,
        foods: [...newMeal.foods, newMeal.currentFood.trim()],
        currentFood: ""
      });
    }
  };

  const removeFood = (index: number) => {
    setNewMeal({
      ...newMeal,
      foods: newMeal.foods.filter((_, i) => i !== index)
    });
  };

  const saveMeal = () => {
    if (newMeal.time && newMeal.foods.length > 0) {
      const meal = {
        time: newMeal.time,
        type: newMeal.type,
        foods: newMeal.foods,
        notes: ""
      };
      setMeals([...meals, meal]);
      
      // Reset form
      setNewMeal({
        time: "",
        type: "breakfast",
        foods: [],
        currentFood: ""
      });
    }
  };

  const deleteMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const saveToStorage = () => {
    const allEntries = loadEntries();
    const existingEntry = allEntries.find((e) => e.date === date);
    
    const mealEntry: MealEntry = {
      date,
      meals: meals.map(m => ({
        name: m.foods.join(", "),
        portion: "1 serving",
        time: m.time,
      })) as any
    };
    
    const nutritionEntry: NutritionEntry = {
      date,
      meals: mealEntry
    };

    const updatedEntry = {
      ...existingEntry,
      date,
      nutrition: nutritionEntry
    };

    const filtered = allEntries.filter((e) => e.date !== date);
    const updated = [...filtered, updatedEntry];
    localStorage.setItem("healthEntries", JSON.stringify(updated));
    setEntries(updated);
  };

  // Prepare chart data
  const mealTimingData = React.useMemo(() => {
    const recent = lastNDays(entries, 7);
    return recent.map(entry => {
      const meals = Array.isArray(entry.nutrition?.meals) ? entry.nutrition.meals : [];
      const breakfast = meals.find(m => m.type === "breakfast");
      const lunch = meals.find(m => m.type === "lunch");
      const dinner = meals.find(m => m.type === "dinner");
      
      return {
        date: entry.date.slice(5),
        breakfast: breakfast ? parseTime(breakfast.time) : 0,
        lunch: lunch ? parseTime(lunch.time) : 0,
        dinner: dinner ? parseTime(dinner.time) : 0
      };
    });
  }, [entries]);

  const symptomCorrelationData = React.useMemo(() => {
    // TODO: Implement food-symptom correlation analysis
    // For now, return empty array as analyzeNutritionPatterns returns Insight[] not correlation data
    return [];
  }, [nutritionAnalysis]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100/30 to-pink-50 relative">
      {/* Intense yellow glass morphism overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-200/60 via-yellow-300/50 to-yellow-100/70 backdrop-blur-md pointer-events-none z-0"></div>
      <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6 relative z-10">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Nutrition Tracker</h1>
            <p className="text-muted-foreground">Log meals and discover food-symptom patterns</p>
          </div>
        </div>
        <Button onClick={saveToStorage} className="bg-green-600 hover:bg-green-700">
          <Apple className="w-4 h-4 mr-2" />
          Save Nutrition Log
        </Button>
      </header>

      {/* AI Insights */}
      {nutritionAnalysis && nutritionAnalysis.length > 0 && (
        <Alert className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-900/50">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <AlertTitle className="text-purple-800 dark:text-purple-300 font-semibold">AI Nutrition Insights</AlertTitle>
          <AlertDescription className="text-purple-700 dark:text-purple-400">
            <div className="space-y-2 mt-2">
              <p className="font-medium">Pattern Insights:</p>
              <div className="space-y-1">
                {nutritionAnalysis.slice(0, 3).map((insight, i) => (
                  <p key={i} className="text-sm">
                    • {insight.description}
                  </p>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Date</CardTitle>
            <CardDescription>Select date for meal logging</CardDescription>
          </CardHeader>
          <CardContent>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border-green-200 dark:border-green-900/50">
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
            <CardDescription>Meals logged for {date}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Meals</p>
                <p className="text-2xl font-bold">{meals.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Foods Logged</p>
                <p className="text-2xl font-bold">{Array.isArray(meals) ? meals.reduce((acc, m) => acc + m.foods.length, 0) : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meal Logger */}
      <Card className="border-orange-200 dark:border-orange-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Log New Meal
          </CardTitle>
          <CardDescription>Add foods and meal timing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={newMeal.time}
                onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Meal Type</Label>
              <Select value={newMeal.type} onValueChange={(v: any) => setNewMeal({ ...newMeal, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Add Foods</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Oatmeal, Banana, Coffee"
                value={newMeal.currentFood}
                onChange={(e) => setNewMeal({ ...newMeal, currentFood: e.target.value })}
                onKeyPress={(e) => e.key === "Enter" && addFood()}
              />
              <Button type="button" onClick={addFood} variant="secondary">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {newMeal.foods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {newMeal.foods.map((food, i) => (
                <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1">
                  {food}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                    onClick={() => removeFood(i)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          <Button onClick={saveMeal} className="w-full" disabled={!newMeal.time || newMeal.foods.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Add Meal to Log
          </Button>
        </CardContent>
      </Card>

      {/* Meals List */}
      <Card>
        <CardHeader>
          <CardTitle>Meals for {date}</CardTitle>
          <CardDescription>{meals.length} meals logged</CardDescription>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No meals logged yet. Add your first meal above!</p>
          ) : (
            <div className="space-y-3">
              {meals.map((meal, i) => (
                <div key={i} className="flex items-start justify-between p-4 bg-muted rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{meal.type}</Badge>
                      <span className="text-sm font-medium">{meal.time}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {meal.foods.map((food, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">
                          {food}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMeal(i)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics */}
      <Tabs defaultValue="timing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timing">Meal Timing</TabsTrigger>
          <TabsTrigger value="correlations">Food Correlations</TabsTrigger>
        </TabsList>

        <TabsContent value="timing">
          <Card>
            <CardHeader>
              <CardTitle>Meal Timing Patterns (7 Days)</CardTitle>
              <CardDescription>When you typically eat meals</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                className="w-full h-[300px]"
                config={{
                  breakfast: { label: "Breakfast", color: "var(--chart-1)" },
                  lunch: { label: "Lunch", color: "var(--chart-2)" },
                  dinner: { label: "Dinner", color: "var(--chart-3)" }
                }}
              >
                <LineChart data={mealTimingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 24]} ticks={[6, 12, 18, 24]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="breakfast" stroke="var(--color-breakfast)" strokeWidth={2} />
                  <Line type="monotone" dataKey="lunch" stroke="var(--color-lunch)" strokeWidth={2} />
                  <Line type="monotone" dataKey="dinner" stroke="var(--color-dinner)" strokeWidth={2} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlations">
          <Card>
            <CardHeader>
              <CardTitle>Food-Symptom Correlations</CardTitle>
              <CardDescription>Foods most associated with symptoms</CardDescription>
            </CardHeader>
            <CardContent>
              {symptomCorrelationData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Not enough data yet. Keep logging meals and symptoms!
                </p>
              ) : (
                <ChartContainer
                  className="w-full h-[300px]"
                  config={{
                    score: { label: "Correlation", color: "var(--chart-2)" }
                  }}
                >
                  <BarChart data={symptomCorrelationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="food" />
                    <YAxis domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="score" fill="var(--color-score)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours + minutes / 60;
}