"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { loadEntries } from "@/lib/health";
import { ArrowLeft, Activity, Apple, Leaf, TrendingUp, Clock, Flame, Heart } from "lucide-react";

export default function LifestylePage() {
  const [entries] = React.useState(() => loadEntries());

  // Extract workout data
  const workoutData = React.useMemo(() => {
    return entries
      .filter(e => e.exercise && e.exercise.workouts && e.exercise.workouts.length > 0)
      .flatMap(e => e.exercise!.workouts.map(w => ({
        date: e.date,
        ...w
      })))
      .filter(w => w.duration > 0)
      .map(w => ({
        date: w.date,
        type: w.type,
        duration: w.duration,
        intensity: w.intensity,
        calories: w.caloriesBurned || 0,
        feeling: w.feeling,
        location: w.location,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (workoutData.length === 0) return null;
    
    const totalWorkouts = workoutData.length;
    const totalMinutes = workoutData.reduce((sum, w) => sum + w.duration, 0);
    const avgDuration = Math.round(totalMinutes / totalWorkouts);
    const avgIntensity = (workoutData.reduce((sum, w) => sum + w.intensity, 0) / totalWorkouts).toFixed(1);
    const totalCalories = workoutData.reduce((sum, w) => sum + w.calories, 0);
    const last7Days = workoutData.filter(w => {
      const wDate = new Date(w.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return wDate >= weekAgo;
    }).length;
    
    // Group by type
    const typeCount: Record<string, number> = {};
    workoutData.forEach(w => {
      typeCount[w.type] = (typeCount[w.type] || 0) + 1;
    });
    const mostCommon = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalWorkouts,
      totalMinutes,
      avgDuration,
      avgIntensity,
      totalCalories,
      last7Days,
      mostCommonType: mostCommon ? mostCommon[0] : "N/A",
    };
  }, [workoutData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100/30 to-pink-50 relative">
      {/* Intense green glass morphism overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-200/60 via-green-300/50 to-green-100/70 backdrop-blur-md pointer-events-none z-0"></div>
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
            <h1 className="text-2xl font-semibold">Lifestyle & Wellness</h1>
            <p className="text-muted-foreground">Track workouts, nutrition, and natural remedies</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/nutrition">
              <Apple className="w-4 h-4 mr-2" />
              Nutrition
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/remedies">
              <Leaf className="w-4 h-4 mr-2" />
              Remedies
            </Link>
          </Button>
        </div>
      </header>

      <Tabs defaultValue="workouts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workouts" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Workouts
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Apple className="w-4 h-4" />
            Nutrition
          </TabsTrigger>
          <TabsTrigger value="remedies" className="flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Remedies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="mt-6 space-y-6">
          {/* Workout Stats */}
          {stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-orange-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Total Workouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.totalWorkouts}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.last7Days} in last 7 days
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-orange-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Total Time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.totalMinutes}</div>
                    <p className="text-xs text-muted-foreground mt-1">minutes exercised</p>
                  </CardContent>
                </Card>
                
                <Card className="border-orange-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Avg Duration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.avgDuration}</div>
                    <p className="text-xs text-muted-foreground mt-1">min per session</p>
                  </CardContent>
                </Card>
                
                <Card className="border-orange-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Avg Intensity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.avgIntensity}/10</div>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{stats.mostCommonType}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Workout Chart */}
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Workout Trends
                  </CardTitle>
                  <CardDescription>Duration and intensity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="w-full h-[300px]" config={{
                    duration: { label: "Duration (min)", color: "hsl(var(--chart-1))" },
                    intensity: { label: "Intensity", color: "hsl(var(--chart-4))" },
                  }}>
                    <LineChart data={workoutData.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={(props) => <ChartLegendContent payload={props.payload} verticalAlign={props.verticalAlign} />} />
                      <Line yAxisId="left" type="monotone" dataKey="duration" stroke="var(--color-duration)" strokeWidth={2} dot={true} />
                      <Line yAxisId="right" type="monotone" dataKey="intensity" stroke="var(--color-intensity)" strokeWidth={2} dot={true} />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Workout Type Distribution */}
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle>Workout Types</CardTitle>
                  <CardDescription>Distribution of your exercise activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer className="w-full h-[250px]" config={{
                    count: { label: "Workouts", color: "hsl(var(--chart-2))" },
                  }}>
                    <BarChart data={Object.entries(
                      workoutData.reduce((acc, w) => {
                        acc[w.type] = (acc[w.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => ({ type, count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Recent Workouts List */}
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle>Recent Workouts</CardTitle>
                  <CardDescription>Your latest exercise sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workoutData.slice(0, 10).map((workout, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">{workout.type}</Badge>
                            <span className="text-sm font-medium">{workout.date}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {workout.duration} min
                            <span className="mx-2">•</span>
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            Intensity: {workout.intensity}/10
                            {workout.calories > 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <Flame className="w-3 h-3 inline mr-1" />
                                {workout.calories} cal
                              </>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={workout.feeling === "energized" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {workout.feeling}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href="/">
                        <Activity className="w-4 h-4 mr-2" />
                        Log New Workout
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href="/analytics">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Analytics
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-orange-200">
              <CardContent className="py-12 text-center space-y-4">
                <Activity className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Workouts Logged Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start tracking your exercise sessions to see trends and health correlations
                  </p>
                  <Button asChild>
                    <Link href="/">
                      <Activity className="w-4 h-4 mr-2" />
                      Log Your First Workout
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="nutrition" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="w-5 h-5" />
                Nutrition Tracking
              </CardTitle>
              <CardDescription>
                Log meals and discover food-symptom patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Track your meals, macros, and discover how food affects your health
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/nutrition">
                  <Apple className="w-4 h-4 mr-2" />
                  Go to Nutrition Tracker
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remedies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                Natural Remedies
              </CardTitle>
              <CardDescription>
                Evidence-based recommendations for symptom relief
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Get personalized remedy recommendations based on your symptoms
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/remedies">
                  <Leaf className="w-4 h-4 mr-2" />
                  View Remedy Recommendations
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

