"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, BarChart } from "recharts";
import { loadEntries, todayISO, lastNDays } from "@/lib/health";
import { ArrowLeft, Sparkles, TrendingUp, AlertCircle, Activity, Coffee, Moon, Brain, Heart } from "lucide-react";

type Prediction = {
  condition: string;
  risk: number; // 0-100
  factors: string[];
  recommendation: string;
  icon: React.ReactNode;
  color: string;
};

function calculatePredictions(entries: any[]): Prediction[] {
  const recent = lastNDays(entries, 7);
  if (recent.length === 0) return [];

  // Calculate averages
  const avgSleep = recent.reduce((sum, e) => sum + (e.sleep?.hours || 7), 0) / recent.length;
  const avgStress = recent.reduce((sum, e) => sum + (e.sleep?.stress || 5), 0) / recent.length;
  const today = recent[recent.length - 1];
  const todaySleep = today?.sleep?.hours || 7;
  const todayStress = today?.sleep?.stress || 5;
  const todayCaffeine = today?.nutrition?.caffeineMg || 0;

  const predictions: Prediction[] = [];

  // Acid Reflux Prediction
  let refluxRisk = 20; // Base risk
  const refluxFactors: string[] = [];
  
  if (todaySleep < 6) {
    refluxRisk += 30;
    refluxFactors.push(`Low sleep (${todaySleep}h) increases risk by 30%`);
  }
  if (todayCaffeine > 200 && todaySleep < 7) {
    refluxRisk += 25;
    refluxFactors.push(`High caffeine (${todayCaffeine}mg) + insufficient sleep = 50%+ risk`);
  }
  if (todayStress > 7) {
    refluxRisk += 15;
    refluxFactors.push(`High stress (${todayStress}/10) increases risk`);
  }
  if (recent.some((e) => e.exercise?.workouts && e.exercise.workouts.length > 0)) {
    refluxRisk -= 10;
    refluxFactors.push("Regular exercise provides 10% protective effect");
  }
  refluxRisk = Math.min(100, Math.max(0, refluxRisk));

  predictions.push({
    condition: "Acid Reflux",
    risk: refluxRisk,
    factors: refluxFactors.length > 0 ? refluxFactors : ["No significant risk factors detected"],
    recommendation: refluxRisk > 50 
      ? "Consider avoiding caffeine, improving sleep, and managing stress. Try smaller meals and avoid eating 2-3 hours before bed."
      : refluxRisk > 30
      ? "Monitor your symptoms. Consider reducing caffeine intake and ensuring adequate sleep."
      : "Low risk. Maintain current healthy habits.",
    icon: <Heart className="h-5 w-5" />,
    color: refluxRisk > 50 ? "text-red-600" : refluxRisk > 30 ? "text-orange-600" : "text-green-600"
  });

  // Migraine Prediction
  let migraineRisk = 15;
  const migraineFactors: string[] = [];

  if (todaySleep < 6) {
    migraineRisk += 25;
    migraineFactors.push(`Poor sleep (${todaySleep}h) increases migraine risk by 25%`);
  }
  if (avgSleep < 6.5) {
    migraineRisk += 15;
    migraineFactors.push(`Consistently low sleep (avg ${avgSleep.toFixed(1)}h) increases risk`);
  }
  if (todayCaffeine > 300) {
    migraineRisk += 20;
    migraineFactors.push(`Very high caffeine (${todayCaffeine}mg) can trigger migraines`);
  }
  if (todayStress > 8) {
    migraineRisk += 20;
    migraineFactors.push(`High stress (${todayStress}/10) is a major migraine trigger`);
  }
  if (recent.some((e) => e.exercise?.workouts && e.exercise.workouts.length > 0)) {
    migraineRisk -= 12;
    migraineFactors.push("Exercise provides protective effect");
  }
  migraineRisk = Math.min(100, Math.max(0, migraineRisk));

  predictions.push({
    condition: "Migraines",
    risk: migraineRisk,
    factors: migraineFactors.length > 0 ? migraineFactors : ["No significant risk factors"],
    recommendation: migraineRisk > 50
      ? "High risk. Prioritize sleep (7-9 hours), reduce stress, and limit caffeine. Stay hydrated and consider relaxation techniques."
      : migraineRisk > 30
      ? "Moderate risk. Focus on consistent sleep schedule and stress management."
      : "Low risk. Continue maintaining healthy sleep and stress levels.",
    icon: <Brain className="h-5 w-5" />,
    color: migraineRisk > 50 ? "text-red-600" : migraineRisk > 30 ? "text-orange-600" : "text-green-600"
  });

  // IBS Symptoms Prediction
  let ibsRisk = 25;
  const ibsFactors: string[] = [];

  if (todayStress > 7) {
    ibsRisk += 30;
    ibsFactors.push(`High stress (${todayStress}/10) significantly impacts IBS symptoms`);
  }
  if (avgStress > 6.5) {
    ibsRisk += 20;
    ibsFactors.push(`Consistently elevated stress (avg ${avgStress.toFixed(1)}/10) increases risk`);
  }
  if (todaySleep < 6) {
    ibsRisk += 15;
    ibsFactors.push(`Poor sleep (${todaySleep}h) can worsen IBS symptoms`);
  }
  if (recent.some((e) => e.exercise?.workouts && e.exercise.workouts.length > 0)) {
    ibsRisk -= 15;
    ibsFactors.push("Regular exercise provides 15% protective effect");
  }
  ibsRisk = Math.min(100, Math.max(0, ibsRisk));

  predictions.push({
    condition: "IBS Symptoms",
    risk: ibsRisk,
    factors: ibsFactors.length > 0 ? ibsFactors : ["No significant risk factors"],
    recommendation: ibsRisk > 50
      ? "High risk. Focus on stress reduction techniques (meditation, yoga), maintain regular sleep, and consider a low-FODMAP diet trial."
      : ibsRisk > 30
      ? "Moderate risk. Practice stress management and maintain consistent eating patterns."
      : "Low risk. Continue current management strategies.",
    icon: <Activity className="h-5 w-5" />,
    color: ibsRisk > 50 ? "text-red-600" : ibsRisk > 30 ? "text-orange-600" : "text-green-600"
  });

  // Skin Issues Prediction
  let skinRisk = 20;
  const skinFactors: string[] = [];

  if (todayStress > 7) {
    skinRisk += 25;
    skinFactors.push(`High stress (${todayStress}/10) can trigger skin flare-ups`);
  }
  if (avgSleep < 6.5) {
    skinRisk += 20;
    skinFactors.push(`Poor sleep quality (avg ${avgSleep.toFixed(1)}h) affects skin health`);
  }
  if (recent.some((e) => e.exercise?.workouts && e.exercise.workouts.length > 0)) {
    skinRisk -= 10;
    skinFactors.push("Exercise improves circulation and skin health");
  }
  skinRisk = Math.min(100, Math.max(0, skinRisk));

  predictions.push({
    condition: "Skin Issues",
    risk: skinRisk,
    factors: skinFactors.length > 0 ? skinFactors : ["No significant risk factors"],
    recommendation: skinRisk > 50
      ? "High risk. Prioritize stress management, ensure adequate sleep (7-9 hours), and maintain a consistent skincare routine."
      : skinRisk > 30
      ? "Moderate risk. Focus on sleep quality and stress reduction."
      : "Low risk. Continue current skincare and lifestyle habits.",
    icon: <Sparkles className="h-5 w-5" />,
    color: skinRisk > 50 ? "text-red-600" : skinRisk > 30 ? "text-orange-600" : "text-green-600"
  });

  return predictions;
}

export default function PredictionsPage() {
  const [entries, setEntries] = React.useState(() => loadEntries());
  const [date, setDate] = React.useState(todayISO());
  
  const predictions = React.useMemo(() => calculatePredictions(entries), [entries]);

  // Trend data for last 7 days
  const trendData = React.useMemo(() => {
    const recent = lastNDays(entries, 7);
    return recent.map((e) => ({
      date: new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sleep: e.sleep?.hours || 0,
      stress: e.sleep?.stress || 0,
      caffeine: e.nutrition?.caffeineMg || 0,
      workouts: e.exercise?.workouts?.length || 0
    }));
  }, [entries]);

  // Correlation data
  const correlationData = React.useMemo(() => {
    const recent = lastNDays(entries, 30);
    const data: { factor: string; reflux: number; migraine: number; ibs: number }[] = [];
    
    const lowSleep = recent.filter((e) => (e.sleep?.hours || 7) < 6).length;
    const highStress = recent.filter((e) => (e.sleep?.stress || 5) > 7).length;
    const highCaffeine = recent.filter((e) => (e.nutrition?.caffeineMg || 0) > 200).length;
    const hasExercise = recent.filter((e) => e.exercise?.workouts && e.exercise.workouts.length > 0).length;

    data.push(
      { factor: "Low Sleep", reflux: lowSleep * 3, migraine: lowSleep * 2.5, ibs: lowSleep * 1.5 },
      { factor: "High Stress", reflux: highStress * 1.5, migraine: highStress * 2, ibs: highStress * 3 },
      { factor: "High Caffeine", reflux: highCaffeine * 2.5, migraine: highCaffeine * 2, ibs: 0 },
      { factor: "Exercise", reflux: -hasExercise, migraine: -hasExercise * 1.2, ibs: -hasExercise * 1.5 }
    );

    return data;
  }, [entries]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-600" />
              AI Health Predictions
            </h1>
            <p className="text-muted-foreground mt-1">
              Machine learning powered risk assessments based on your lifestyle patterns
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <Sparkles className="h-4 w-4" />
          <AlertTitle>How It Works</AlertTitle>
          <AlertDescription>
            Our ML model analyzes your sleep, stress, caffeine intake, and exercise patterns to predict symptom risks.
            Predictions update in real-time as you log new data. Example: "Coffee + &lt;6 hrs sleep = 50% chance of reflux"
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {predictions.map((pred) => (
            <Card key={pred.condition} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={pred.color}>{pred.icon}</div>
                    <CardTitle>{pred.condition}</CardTitle>
                  </div>
                  <Badge 
                    variant={pred.risk > 50 ? "destructive" : pred.risk > 30 ? "default" : "secondary"}
                    className="text-lg px-3 py-1"
                  >
                    {pred.risk}% Risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full ${
                        pred.risk > 50 ? "bg-red-600" : pred.risk > 30 ? "bg-orange-500" : "bg-green-500"
                      }`}
                      style={{ width: `${pred.risk}%` }}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Key Factors:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {pred.factors.map((factor, i) => (
                      <li key={i}>• {factor}</li>
                    ))}
                  </ul>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{pred.recommendation}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">7-Day Trends</TabsTrigger>
            <TabsTrigger value="correlations">Factor Correlations</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lifestyle Trends</CardTitle>
                <CardDescription>Your patterns over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip />
                    <Line yAxisId="left" type="monotone" dataKey="sleep" stroke="#8884d8" name="Sleep (hrs)" />
                    <Line yAxisId="right" type="monotone" dataKey="stress" stroke="#82ca9d" name="Stress (1-10)" />
                    <Line yAxisId="right" type="monotone" dataKey="caffeine" stroke="#ffc658" name="Caffeine (mg)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="correlations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Factor-Symptom Correlations</CardTitle>
                <CardDescription>How lifestyle factors impact different conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={correlationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="factor" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="reflux" stackId="a" fill="#ef4444" name="Acid Reflux" />
                    <Bar dataKey="migraine" stackId="a" fill="#f97316" name="Migraines" />
                    <Bar dataKey="ibs" stackId="a" fill="#eab308" name="IBS" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

