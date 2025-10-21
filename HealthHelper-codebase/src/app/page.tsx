"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { loadEntries, upsertEntry, todayISO, lastNDays, toTimeSeries, generateInsights, predictSleepQuality, predictSymptoms, type HealthEntry } from "@/lib/health";
import { loadSampleData } from "@/lib/sampleData";
import { exportCSV, exportPDF } from "@/lib/export";
import { ProfileMenu } from "@/components/profile-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Activity, Sparkles, HeartPulse, Brain, Plug, Moon, ArrowRight, AlertCircle, TrendingUp, Zap, Apple, Leaf, Dumbbell } from "lucide-react";

export default function HomePage() {
  const [date, setDate] = React.useState(todayISO());
  const [entries, setEntries] = React.useState(() => loadEntries());

  // Enhanced daily log state
  const [dailyLog, setDailyLog] = React.useState({
    mood: 5,
    stress: 5,
    energy: 5,
    focus: 5,
    notes: "",
    journalEntry: "",
    copingStrategies: [] as string[],
    menstrualPhase: "",
    cycleDay: 0,
    dailyFlareStatus: false,
    flareType: "",
    flareSeverity: 0,
    flareDurationHours: 0,
    recoveryActivities: [] as string[],
    meditationMinutes: 0,
    relaxationQuality: 5
  });

  // Enhanced stomach state with GI specifics
  const [stomach, setStomach] = React.useState({
    severity: 0,
    painLocation: "",
    bowelChanges: "",
    triggers: { dairy: false, gluten: false, spicy: false, alcohol: false, caffeine: false },
    notes: "",
    refluxSeverity: 0,
    bloatingSeverity: 0,
    abdominalPainSeverity: 0,
    stoolConsistency: 4 // Bristol stool scale 1-7
  });

  // Enhanced skin state
  const [skin, setSkin] = React.useState({
    severity: 0,
    area: "",
    rash: false,
    itch: false,
    triggers: { cosmetics: false, detergent: false, weather: false, sweat: false, dietSugar: false },
    notes: "",
    skinLocation: "",
    skinType: ""
  });

  const [mental, setMental] = React.useState({ mood: 5, anxiety: 5, sleepHours: 7, stressLevel: 5, notes: "" });

  // Enhanced symptom tracking state
  const [symptoms, setSymptoms] = React.useState({
    giFlare: 0,
    skinFlare: 0,
    migraine: 0,
    fatigue: 0,
    notes: "",
    fatigueSeverity: 0,
    headacheSeverity: 0
  });

  // Quick sleep check-in state
  const [quickSleep, setQuickSleep] = React.useState({ hours: 7, stress: 5 });

  // Workout tracking state
  const [workout, setWorkout] = React.useState({
    type: "walking" as "cardio" | "strength" | "yoga" | "stretching" | "sports" | "walking" | "running" | "cycling" | "swimming" | "hiit" | "other",
    duration: 30,
    intensity: 5,
    caloriesBurned: 0,
    heartRateAvg: 0,
    notes: "",
    feeling: "normal" as "energized" | "tired" | "normal" | "sore",
    location: "outdoors" as "gym" | "home" | "outdoors" | "other"
  });

  // Enhanced nutrition tracking with all macros/micros from Python backend
  const [nutrition, setNutrition] = React.useState({
    mealTime: "",
    foodItems: "",
    foodType: "",
    portionSize: "",
    portionGrams: 0,
    tags: [] as string[],
    calories: 0,
    caffeineMg: 0,
    // Macronutrients
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    // Additional macros
    saturatedFatG: 0,
    monounsaturatedFatG: 0,
    polyunsaturatedFatG: 0,
    transFatG: 0,
    cholesterolMg: 0,
    sodiumMg: 0,
    potassiumMg: 0,
    // Micronutrients
    vitaminCMg: 0,
    vitaminDIu: 0,
    calciumMg: 0,
    ironMg: 0,
    magnesiumMg: 0,
    zincMg: 0,
    artificialSweeteners: false,
  });

  // Vital signs tracking from Python backend
  const [vitals, setVitals] = React.useState({
    hrMean: 0,
    hrMax: 0,
    hrvMs: 0,
    spo2: 0,
    steps: 0,
    activeMin: 0,
    caloriesBurned: 0,
  });

  React.useEffect(() => {
    // preload existing for selected date
    const e = loadEntries().find((x) => x.date === date);
    if (e?.stomach) setStomach({
      severity: e.stomach.severity,
      painLocation: e.stomach.painLocation ?? "",
      bowelChanges: e.stomach.bowelChanges ?? "",
      triggers: { ...e.stomach.triggers },
      notes: e.stomach.notes ?? "",
      refluxSeverity: 0,
      bloatingSeverity: 0,
      abdominalPainSeverity: 0,
      stoolConsistency: 4
    });
    if (e?.skin) setSkin({
      severity: e.skin.severity,
      area: e.skin.area ?? "",
      rash: !!e.skin.rash,
      itch: !!e.skin.itch,
      triggers: { ...e.skin.triggers },
      notes: e.skin.notes ?? "",
      skinLocation: "",
      skinType: ""
    });
    if (e?.mental) setMental({
      mood: e.mental.mood,
      anxiety: e.mental.anxiety,
      sleepHours: e.mental.sleepHours ?? 0,
      stressLevel: e.mental.stressLevel ?? 0,
      notes: e.mental.notes ?? ""
    });
    if (e?.symptoms) setSymptoms({
      giFlare: e.symptoms.giFlare,
      skinFlare: e.symptoms.skinFlare,
      migraine: e.symptoms.migraine,
      fatigue: e.symptoms.fatigue,
      notes: e.symptoms.notes ?? "",
      fatigueSeverity: 0,
      headacheSeverity: 0
    });
  }, [date]);

  const series14 = toTimeSeries(lastNDays(entries, 14));
  const insights = React.useMemo(() => generateInsights(entries), [entries]);

  // Calculate sleep stats for quick view
  const sleepStats = React.useMemo(() => {
    const recent = lastNDays(entries, 7);
    const avgSleep = recent.reduce((acc, e) => acc + (e.mental?.sleepHours ?? 0), 0) / Math.max(recent.length, 1);
    const avgStress = recent.reduce((acc, e) => acc + (e.mental?.stressLevel ?? 5), 0) / Math.max(recent.length, 1);
    return { avgSleep: avgSleep.toFixed(1), avgStress: avgStress.toFixed(1) };
  }, [entries]);

  // ML Predictions for current entry
  const currentEntry: HealthEntry = React.useMemo(() => ({
    date,
    stomach: stomach.severity > 0 ? { date, severity: clamp010(stomach.severity as any), painLocation: stomach.painLocation || undefined, bowelChanges: stomach.bowelChanges || undefined, triggers: stomach.triggers, notes: stomach.notes || undefined } : undefined,
    skin: skin.severity > 0 ? { date, severity: clamp010(skin.severity as any), area: skin.area || undefined, rash: skin.rash, itch: skin.itch, triggers: skin.triggers, notes: skin.notes || undefined } : undefined,
    mental: { date, mood: clamp010(mental.mood as any), anxiety: clamp010(mental.anxiety as any), sleepHours: clamp024(mental.sleepHours as any), stressLevel: clamp010(mental.stressLevel as any), notes: mental.notes || undefined },
    symptoms: { date, giFlare: clamp010(symptoms.giFlare as any), skinFlare: clamp010(symptoms.skinFlare as any), migraine: clamp010(symptoms.migraine as any), fatigue: clamp010(symptoms.fatigue as any), notes: symptoms.notes || undefined },
    workout: workout.duration > 0 ? { date, type: workout.type, duration: workout.duration, intensity: clamp010(workout.intensity as any), caloriesBurned: workout.caloriesBurned || undefined, heartRateAvg: workout.heartRateAvg || undefined, notes: workout.notes || undefined, feeling: workout.feeling, location: workout.location } : undefined
  }), [date, stomach, skin, mental, symptoms, workout]);
  
  const sleepPrediction = React.useMemo(() => predictSleepQuality(currentEntry), [currentEntry]);
  const symptomPrediction = React.useMemo(() => predictSymptoms(currentEntry), [currentEntry]);

  function saveAll() {
    const updated = upsertEntry({
      date,
      stomach: { date, severity: clamp010(stomach.severity as any), painLocation: stomach.painLocation || undefined, bowelChanges: stomach.bowelChanges || undefined, triggers: stomach.triggers, notes: stomach.notes || undefined },
      skin: { date, severity: clamp010(skin.severity as any), area: skin.area || undefined, rash: skin.rash, itch: skin.itch, triggers: skin.triggers, notes: skin.notes || undefined },
      mental: { date, mood: clamp010(mental.mood as any), anxiety: clamp010(mental.anxiety as any), sleepHours: clamp024(mental.sleepHours as any), stressLevel: clamp010(mental.stressLevel as any), notes: mental.notes || undefined },
      symptoms: { date, giFlare: clamp010(symptoms.giFlare as any), skinFlare: clamp010(symptoms.skinFlare as any), migraine: clamp010(symptoms.migraine as any), fatigue: clamp010(symptoms.fatigue as any), notes: symptoms.notes || undefined },
      workout: workout.duration > 0 ? { date, type: workout.type, duration: workout.duration, intensity: clamp010(workout.intensity as any), caloriesBurned: workout.caloriesBurned || undefined, heartRateAvg: workout.heartRateAvg || undefined, notes: workout.notes || undefined, feeling: workout.feeling, location: workout.location } : undefined
    });
    setEntries(updated);
  }

  function saveQuickSleep() {
    const updated = upsertEntry({
      date: todayISO(),
      stomach: entries.find(e => e.date === todayISO())?.stomach,
      skin: entries.find(e => e.date === todayISO())?.skin,
      mental: { 
        date: todayISO(), 
        mood: entries.find(e => e.date === todayISO())?.mental?.mood ?? 5, 
        anxiety: entries.find(e => e.date === todayISO())?.mental?.anxiety ?? 5, 
        sleepHours: clamp024(quickSleep.hours), 
        stressLevel: clamp010(quickSleep.stress),
        notes: entries.find(e => e.date === todayISO())?.mental?.notes
      },
      symptoms: entries.find(e => e.date === todayISO())?.symptoms
    });
    setEntries(updated);
  }

  function handleLoadSampleData() {
    const sampleData = loadSampleData();
    setEntries(sampleData);
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto max-w-7xl p-4 md:p-6">
        {/* Compact Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-white" />
        </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Health Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">AI-powered health tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLoadSampleData}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Sample Data
            </Button>
            <ProfileMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/api/export-zip">Download ZIP</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportCSV(entries)}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportPDF(entries, insights)}>Export PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      {/* AI Risk Alerts */}
      {symptomPrediction.overallRisk === 'high' && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300 font-semibold">High Risk Alert</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            <p>Your current patterns suggest elevated risk for symptoms:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {symptomPrediction.giFlareRisk > 70 && <li>GI Flare Risk: {symptomPrediction.giFlareRisk}%</li>}
              {symptomPrediction.skinFlareRisk > 70 && <li>Skin Flare Risk: {symptomPrediction.skinFlareRisk}%</li>}
              {symptomPrediction.migraineRisk > 70 && <li>Migraine Risk: {symptomPrediction.migraineRisk}%</li>}
              {symptomPrediction.fatigueRisk > 70 && <li>Fatigue Risk: {symptomPrediction.fatigueRisk}%</li>}
            </ul>
            <p className="mt-2 font-medium">Recommended Actions: {symptomPrediction.preventiveActions.slice(0, 2).join(', ')}</p>
          </AlertDescription>
        </Alert>
      )}

      {sleepPrediction.riskFactors.length > 0 && sleepPrediction.confidence > 60 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/50">
          <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-semibold">Sleep Quality Alert</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            <p className="font-medium">Risk Factors: {sleepPrediction.riskFactors.join(', ')}</p>
            <p className="mt-1">💡 {sleepPrediction.recommendations.slice(0, 2).join(' • ')}</p>
            <p className="text-xs mt-2">Predicted Quality: {sleepPrediction.predictedQuality}/10 (Confidence: {sleepPrediction.confidence}%)</p>
          </AlertDescription>
        </Alert>
      )}

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Entries</p>
                  <p className="text-2xl font-bold text-blue-600">{entries.filter(e => e.date === date).length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className="text-2xl font-bold text-green-600">8.2</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold text-purple-600">12 days</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Insights</p>
                  <p className="text-2xl font-bold text-orange-600">{insights.length}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Services Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Health Services</h2>
              <p className="text-sm text-muted-foreground">Select the services from below</p>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600">
              VIEW ALL →
          </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card asChild className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
              <Link href="/analytics" className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-sm">Analytics</h3>
                <p className="text-xs text-muted-foreground mt-1">Health insights</p>
            </Link>
            </Card>
            
            <Card asChild className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
              <Link href="/lifestyle" className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium text-sm">Lifestyle</h3>
                <p className="text-xs text-muted-foreground mt-1">Workouts & nutrition</p>
            </Link>
            </Card>
            
            <Card asChild className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
              <Link href="/skintrack" className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-sm">SkinTrack+</h3>
                <p className="text-xs text-muted-foreground mt-1">Skin monitoring</p>
            </Link>
            </Card>
            
            <Card asChild className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
              <Link href="/gastro" className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <HeartPulse className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-medium text-sm">GastroGuard</h3>
                <p className="text-xs text-muted-foreground mt-1">Digestive health</p>
            </Link>
            </Card>
        </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">Your latest health entries</p>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600">
              VIEW ALL →
          </Button>
        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.slice(0, 4).map((entry, idx) => (
              <Card key={idx} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{entry.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.stomach && 'Stomach • '}
                          {entry.skin && 'Skin • '}
                          {entry.mental && 'Mental • '}
                          {entry.sleep && 'Sleep • '}
                          {entry.workout && 'Workout'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(entry.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      {/* AI Insights Dashboard */}
      {insights.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-900/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </div>
            <CardDescription>Personalized recommendations based on your health patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 5).map((ins, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-purple-100 dark:border-purple-900/30">
                  <Badge variant={ins.priority === 'high' ? 'destructive' : ins.priority === 'medium' ? 'default' : 'secondary'} className="mt-0.5">
                    {ins.priority || 'low'}
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">[{ins.area}] {ins.metric}</p>
                    <p className="text-sm text-muted-foreground">{ins.description}</p>
                    <p className="text-xs text-muted-foreground">Correlation score: {ins.score.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

        {/* Quick Entry Forms */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Quick Entry</h2>
              <p className="text-sm text-muted-foreground">Log your daily health data</p>
            </div>
          </div>
          
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="workout">Workout</TabsTrigger>
              <TabsTrigger value="sleep">Sleep</TabsTrigger>
              <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="mt-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Energy (1-10)</Label>
              <Input 
                type="number" 
                min={1} 
                max={10} 
                value={dailyLog.energy} 
                onChange={(e) => setDailyLog({ ...dailyLog, energy: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Focus (1-10)</Label>
              <Input 
                type="number" 
                min={1} 
                max={10} 
                value={dailyLog.focus} 
                onChange={(e) => setDailyLog({ ...dailyLog, focus: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Meditation (min)</Label>
              <Input 
                type="number" 
                min={0} 
                value={dailyLog.meditationMinutes} 
                onChange={(e) => setDailyLog({ ...dailyLog, meditationMinutes: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Relaxation Quality (1-10)</Label>
              <Input 
                type="number" 
                min={1} 
                max={10} 
                value={dailyLog.relaxationQuality} 
                onChange={(e) => setDailyLog({ ...dailyLog, relaxationQuality: Number(e.target.value) })} 
              />
            </div>
          </div>

          {/* Flare Tracking */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Switch 
                checked={dailyLog.dailyFlareStatus} 
                onCheckedChange={(c) => setDailyLog({ ...dailyLog, dailyFlareStatus: c })} 
              />
              <Label className="font-semibold">Did you experience a flare today?</Label>
            </div>
            {dailyLog.dailyFlareStatus && (
              <div className="grid md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Flare Type</Label>
                  <Select value={dailyLog.flareType} onValueChange={(v) => setDailyLog({ ...dailyLog, flareType: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gut">Gut</SelectItem>
                      <SelectItem value="skin">Skin</SelectItem>
                      <SelectItem value="mental">Mental</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Flare Severity (0-10)</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    max={10} 
                    value={dailyLog.flareSeverity} 
                    onChange={(e) => setDailyLog({ ...dailyLog, flareSeverity: Number(e.target.value) })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (hours)</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    value={dailyLog.flareDurationHours} 
                    onChange={(e) => setDailyLog({ ...dailyLog, flareDurationHours: Number(e.target.value) })} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Menstrual Cycle Tracking */}
          <div className="grid md:grid-cols-2 gap-3 p-3 border rounded-lg bg-pink-50/50 dark:bg-pink-900/10">
            <div className="space-y-2">
              <Label>Menstrual Phase</Label>
              <Select value={dailyLog.menstrualPhase} onValueChange={(v) => setDailyLog({ ...dailyLog, menstrualPhase: v })}>
                <SelectTrigger><SelectValue placeholder="Select phase" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="period">Period</SelectItem>
                  <SelectItem value="follicular">Follicular</SelectItem>
                  <SelectItem value="luteal">Luteal</SelectItem>
                  <SelectItem value="ovulation">Ovulation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cycle Day (1-35)</Label>
              <Input 
                type="number" 
                min={1} 
                max={35} 
                value={dailyLog.cycleDay || ""} 
                onChange={(e) => setDailyLog({ ...dailyLog, cycleDay: Number(e.target.value) })} 
                placeholder="Enter cycle day"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Journal Entry</Label>
            <Textarea 
              value={dailyLog.journalEntry} 
              onChange={(e) => setDailyLog({ ...dailyLog, journalEntry: e.target.value })} 
              placeholder="Write about your day, feelings, or observations..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* NEW: Nutrition Tracking Card */}
      <Card className="border-green-200 dark:border-green-900/50">
        <CardHeader>
          <CardTitle>🍎 Nutrition & Meal Tracking</CardTitle>
          <CardDescription>Comprehensive macronutrient and micronutrient tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Meal Time</Label>
              <Input 
                type="datetime-local" 
                value={nutrition.mealTime} 
                onChange={(e) => setNutrition({ ...nutrition, mealTime: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Food Type</Label>
              <Select value={nutrition.foodType} onValueChange={(v) => setNutrition({ ...nutrition, foodType: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Portion Size</Label>
              <Select value={nutrition.portionSize} onValueChange={(v) => setNutrition({ ...nutrition, portionSize: v })}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="exact_grams">Exact (grams)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Food Items</Label>
            <Input 
              value={nutrition.foodItems} 
              onChange={(e) => setNutrition({ ...nutrition, foodItems: e.target.value })} 
              placeholder="e.g., Grilled chicken, brown rice, steamed broccoli"
            />
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Calories</Label>
              <Input 
                type="number" 
                min={0} 
                value={nutrition.calories || ""} 
                onChange={(e) => setNutrition({ ...nutrition, calories: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Protein (g)</Label>
              <Input 
                type="number" 
                min={0} 
                step={0.1} 
                value={nutrition.proteinG || ""} 
                onChange={(e) => setNutrition({ ...nutrition, proteinG: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Carbs (g)</Label>
              <Input 
                type="number" 
                min={0} 
                step={0.1} 
                value={nutrition.carbsG || ""} 
                onChange={(e) => setNutrition({ ...nutrition, carbsG: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fat (g)</Label>
              <Input 
                type="number" 
                min={0} 
                step={0.1} 
                value={nutrition.fatG || ""} 
                onChange={(e) => setNutrition({ ...nutrition, fatG: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fiber (g)</Label>
              <Input 
                type="number" 
                min={0} 
                step={0.1} 
                value={nutrition.fiberG || ""} 
                onChange={(e) => setNutrition({ ...nutrition, fiberG: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sugar (g)</Label>
              <Input 
                type="number" 
                min={0} 
                step={0.1} 
                value={nutrition.sugarG || ""} 
                onChange={(e) => setNutrition({ ...nutrition, sugarG: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sodium (mg)</Label>
              <Input 
                type="number" 
                min={0} 
                value={nutrition.sodiumMg || ""} 
                onChange={(e) => setNutrition({ ...nutrition, sodiumMg: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Caffeine (mg)</Label>
              <Input 
                type="number" 
                min={0} 
                value={nutrition.caffeineMg || ""} 
                onChange={(e) => setNutrition({ ...nutrition, caffeineMg: Number(e.target.value) })} 
              />
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced-nutrition">
              <AccordionTrigger>Advanced Nutrition Details</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-4 gap-3 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Saturated Fat (g)</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      step={0.1} 
                      value={nutrition.saturatedFatG || ""} 
                      onChange={(e) => setNutrition({ ...nutrition, saturatedFatG: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Cholesterol (mg)</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      value={nutrition.cholesterolMg || ""} 
                      onChange={(e) => setNutrition({ ...nutrition, cholesterolMg: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Vitamin C (mg)</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      step={0.1} 
                      value={nutrition.vitaminCMg || ""} 
                      onChange={(e) => setNutrition({ ...nutrition, vitaminCMg: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Vitamin D (IU)</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      value={nutrition.vitaminDIu || ""} 
                      onChange={(e) => setNutrition({ ...nutrition, vitaminDIu: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Calcium (mg)</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      value={nutrition.calciumMg || ""} 
                      onChange={(e) => setNutrition({ ...nutrition, calciumMg: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Iron (mg)</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      step={0.1} 
                      value={nutrition.ironMg || ""} 
                      onChange={(e) => setNutrition({ ...nutrition, ironMg: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Magnesium (mg)</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      value={nutrition.magnesiumMg || ""} 
                      onChange={(e) => setNutrition({ ...nutrition, magnesiumMg: Number(e.target.value) })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Zinc (mg)</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      step={0.1} 
                      value={nutrition.zincMg || ""} 
                      onChange={(e) => setNutrition({ ...nutrition, zincMg: Number(e.target.value) })} 
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Switch 
                    checked={nutrition.artificialSweeteners} 
                    onCheckedChange={(c) => setNutrition({ ...nutrition, artificialSweeteners: c })} 
                  />
                  <Label>Contains Artificial Sweeteners</Label>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* NEW: Workout Tracking Card */}
      <Card className="border-orange-200 dark:border-orange-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Workout & Activity Tracking
          </CardTitle>
          <CardDescription>Log your exercise sessions and track how they affect your health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Workout Type</Label>
              <Select value={workout.type} onValueChange={(v: any) => setWorkout({ ...workout, type: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="strength">Strength Training</SelectItem>
                  <SelectItem value="yoga">Yoga</SelectItem>
                  <SelectItem value="stretching">Stretching</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="walking">Walking</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="cycling">Cycling</SelectItem>
                  <SelectItem value="swimming">Swimming</SelectItem>
                  <SelectItem value="hiit">HIIT</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input 
                type="number" 
                min={0} 
                value={workout.duration || ""} 
                onChange={(e) => setWorkout({ ...workout, duration: Number(e.target.value) })} 
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label>Intensity (1-10)</Label>
              <Input 
                type="number" 
                min={1} 
                max={10} 
                value={workout.intensity} 
                onChange={(e) => setWorkout({ ...workout, intensity: Number(e.target.value) })} 
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Calories Burned (optional)</Label>
              <Input 
                type="number" 
                min={0} 
                value={workout.caloriesBurned || ""} 
                onChange={(e) => setWorkout({ ...workout, caloriesBurned: Number(e.target.value) })} 
                placeholder="200"
              />
            </div>
            <div className="space-y-2">
              <Label>Avg Heart Rate (optional)</Label>
              <Input 
                type="number" 
                min={0} 
                value={workout.heartRateAvg || ""} 
                onChange={(e) => setWorkout({ ...workout, heartRateAvg: Number(e.target.value) })} 
                placeholder="140 bpm"
              />
            </div>
            <div className="space-y-2">
              <Label>How You Feel</Label>
              <Select value={workout.feeling} onValueChange={(v: any) => setWorkout({ ...workout, feeling: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="energized">Energized</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="tired">Tired</SelectItem>
                  <SelectItem value="sore">Sore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={workout.location} onValueChange={(v: any) => setWorkout({ ...workout, location: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gym">Gym</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="outdoors">Outdoors</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input 
              value={workout.notes} 
              onChange={(e) => setWorkout({ ...workout, notes: e.target.value })} 
              placeholder="How did you feel? Any observations?"
            />
          </div>
        </CardContent>
      </Card>

      {/* NEW: Daily Vitals Card */}
      <Card className="border-blue-200 dark:border-blue-900/50">
        <CardHeader>
          <CardTitle>❤️ Daily Vitals & Activity</CardTitle>
          <CardDescription>Heart rate, steps, and other vital signs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Avg Heart Rate</Label>
              <Input 
                type="number" 
                min={0} 
                value={vitals.hrMean || ""} 
                onChange={(e) => setVitals({ ...vitals, hrMean: Number(e.target.value) })} 
                placeholder="bpm"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Heart Rate</Label>
              <Input 
                type="number" 
                min={0} 
                value={vitals.hrMax || ""} 
                onChange={(e) => setVitals({ ...vitals, hrMax: Number(e.target.value) })} 
                placeholder="bpm"
              />
            </div>
            <div className="space-y-2">
              <Label>HRV (ms)</Label>
              <Input 
                type="number" 
                min={0} 
                value={vitals.hrvMs || ""} 
                onChange={(e) => setVitals({ ...vitals, hrvMs: Number(e.target.value) })} 
                placeholder="Heart rate variability"
              />
            </div>
            <div className="space-y-2">
              <Label>SpO2 (%)</Label>
              <Input 
                type="number" 
                min={0} 
                max={100} 
                value={vitals.spo2 || ""} 
                onChange={(e) => setVitals({ ...vitals, spo2: Number(e.target.value) })} 
                placeholder="Blood oxygen"
              />
            </div>
            <div className="space-y-2">
              <Label>Steps</Label>
              <Input 
                type="number" 
                min={0} 
                value={vitals.steps || ""} 
                onChange={(e) => setVitals({ ...vitals, steps: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Active Minutes</Label>
              <Input 
                type="number" 
                min={0} 
                value={vitals.activeMin || ""} 
                onChange={(e) => setVitals({ ...vitals, activeMin: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Calories Burned</Label>
              <Input 
                type="number" 
                min={0} 
                value={vitals.caloriesBurned || ""} 
                onChange={(e) => setVitals({ ...vitals, caloriesBurned: Number(e.target.value) })} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Select date and save entries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button onClick={saveAll} className="w-full">Save Today</Button>
          </CardContent>
        </Card>

        {/* Quick Sleep Check-in Card */}
        <Card className="md:col-span-2 border-purple-200 dark:border-purple-900/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-purple-500" />
                <CardTitle>Quick Sleep Check-in</CardTitle>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sleeptrack" className="flex items-center gap-1 text-xs">
                  Full Tracker <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>
            <CardDescription>Log your sleep & stress quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Sleep Hours (0-24)</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    max={24} 
                    step={0.5} 
                    value={quickSleep.hours} 
                    onChange={(e) => setQuickSleep({ ...quickSleep, hours: Number(e.target.value) })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stress Level (0-10)</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    max={10} 
                    step={1} 
                    value={quickSleep.stress} 
                    onChange={(e) => setQuickSleep({ ...quickSleep, stress: Number(e.target.value) })} 
                  />
                </div>
                <Button onClick={saveQuickSleep} className="w-full bg-purple-600 hover:bg-purple-700">
                  <Moon className="w-4 h-4 mr-2" />
                  Save Sleep Log
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm font-medium">7-Day Average</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Avg Sleep</span>
                    <span className="text-lg font-semibold">{sleepStats.avgSleep}h</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Avg Stress</span>
                    <span className="text-lg font-semibold">{sleepStats.avgStress}/10</span>
                  </div>
                  <div className={`p-3 rounded-lg text-sm ${
                    Number(sleepStats.avgSleep) >= 7 && Number(sleepStats.avgStress) < 6 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {Number(sleepStats.avgSleep) >= 7 && Number(sleepStats.avgStress) < 6 
                      ? '✓ Sleep on track' 
                      : '⚠ Consider improving sleep'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Symptom Tracking Card */}
        <Card className="md:col-span-3 border-orange-200 dark:border-orange-900/50">
          <CardHeader>
            <CardTitle>Daily Symptoms</CardTitle>
            <CardDescription>Track specific symptoms for comprehensive health monitoring</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>GI Flare (0-10)</Label>
              <Input 
                type="number" 
                min={0} 
                max={10} 
                step={1} 
                value={symptoms.giFlare} 
                onChange={(e) => setSymptoms({ ...symptoms, giFlare: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Skin Flare (0-10)</Label>
              <Input 
                type="number" 
                min={0} 
                max={10} 
                step={1} 
                value={symptoms.skinFlare} 
                onChange={(e) => setSymptoms({ ...symptoms, skinFlare: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Migraine (0-10)</Label>
              <Input 
                type="number" 
                min={0} 
                max={10} 
                step={1} 
                value={symptoms.migraine} 
                onChange={(e) => setSymptoms({ ...symptoms, migraine: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Fatigue (0-10)</Label>
              <Input 
                type="number" 
                min={0} 
                max={10} 
                step={1} 
                value={symptoms.fatigue} 
                onChange={(e) => setSymptoms({ ...symptoms, fatigue: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Fatigue Severity (0-10)</Label>
              <Input 
                type="number" 
                min={0} 
                max={10} 
                step={1} 
                value={symptoms.fatigueSeverity} 
                onChange={(e) => setSymptoms({ ...symptoms, fatigueSeverity: Number(e.target.value) })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Headache Severity (0-10)</Label>
              <Input 
                type="number" 
                min={0} 
                max={10} 
                step={1} 
                value={symptoms.headacheSeverity} 
                onChange={(e) => setSymptoms({ ...symptoms, headacheSeverity: Number(e.target.value) })} 
              />
            </div>
            <div className="md:col-span-4 space-y-2">
              <Label>Symptom Notes</Label>
              <Input 
                value={symptoms.notes} 
                onChange={(e) => setSymptoms({ ...symptoms, notes: e.target.value })} 
                placeholder="Any additional symptom details..." 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Stomach (Enhanced)</CardTitle>
            <CardDescription>GI-specific tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Severity (0-10)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                step={1}
                value={Number.isNaN(stomach.severity as any) ? "" : stomach.severity}
                onChange={(e) =>
                  setStomach({
                    ...stomach,
                    severity:
                      e.target.value === ""
                        ? ((NaN as unknown) as number)
                        : clamp010(Number(e.target.value) as any),
                  })
                }
              />
            </div>

            {/* New GI-specific fields */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Reflux (0-10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={stomach.refluxSeverity}
                  onChange={(e) => setStomach({ ...stomach, refluxSeverity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bloating (0-10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={stomach.bloatingSeverity}
                  onChange={(e) => setStomach({ ...stomach, bloatingSeverity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Abdominal Pain (0-10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={stomach.abdominalPainSeverity}
                  onChange={(e) => setStomach({ ...stomach, abdominalPainSeverity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bristol Scale (1-7)</Label>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={stomach.stoolConsistency}
                  onChange={(e) => setStomach({ ...stomach, stoolConsistency: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Pain Location</Label>
              <Select value={stomach.painLocation || undefined} onValueChange={(v) => setStomach({ ...stomach, painLocation: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upper-abdomen">Upper Abdomen</SelectItem>
                  <SelectItem value="lower-abdomen">Lower Abdomen</SelectItem>
                  <SelectItem value="left-side">Left Side</SelectItem>
                  <SelectItem value="right-side">Right Side</SelectItem>
                  <SelectItem value="generalized">Generalized</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Bowel Changes</Label>
              <Select value={stomach.bowelChanges || undefined} onValueChange={(v) => setStomach({ ...stomach, bowelChanges: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select change" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="constipation">Constipation</SelectItem>
                  <SelectItem value="diarrhea">Diarrhea</SelectItem>
                  <SelectItem value="alternating">Alternating</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stomach.triggers).map(([k, v]) =>
              <label key={k} className="flex items-center gap-2 text-sm">
                  <Switch checked={v} onCheckedChange={(c) => setStomach({ ...stomach, triggers: { ...stomach.triggers, [k]: c } as any })} />
                  {capitalize(k)}
                </label>
              )}
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={stomach.notes} onChange={(e) => setStomach({ ...stomach, notes: e.target.value })} placeholder="Anything notable..." />
            </div>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Skin (Enhanced)</CardTitle>
            <CardDescription>Detailed skin tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Severity (0-10)</Label>
              <Input type="number" min={0} max={10} step={1} value={skin.severity} onChange={(e) => setSkin({ ...skin, severity: Number(e.target.value) })} />
            </div>

            {/* New skin-specific fields */}
            <div className="space-y-1">
              <Label>Skin Location</Label>
              <Select value={skin.skinLocation || undefined} onValueChange={(v) => setSkin({ ...skin, skinLocation: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="face">Face</SelectItem>
                  <SelectItem value="chest">Chest</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="arms">Arms</SelectItem>
                  <SelectItem value="legs">Legs</SelectItem>
                  <SelectItem value="scalp">Scalp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Skin Type</Label>
              <Select value={skin.skinType || undefined} onValueChange={(v) => setSkin({ ...skin, skinType: v })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="acne">Acne</SelectItem>
                  <SelectItem value="rash">Rash</SelectItem>
                  <SelectItem value="itchiness">Itchiness</SelectItem>
                  <SelectItem value="dryness">Dryness</SelectItem>
                  <SelectItem value="eczema">Eczema</SelectItem>
                  <SelectItem value="psoriasis">Psoriasis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Affected Area</Label>
              <Select value={skin.area || undefined} onValueChange={(v) => setSkin({ ...skin, area: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="face">Face</SelectItem>
                  <SelectItem value="scalp">Scalp</SelectItem>
                  <SelectItem value="arms">Arms</SelectItem>
                  <SelectItem value="torso">Torso</SelectItem>
                  <SelectItem value="legs">Legs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><Switch checked={skin.rash} onCheckedChange={(c) => setSkin({ ...skin, rash: c })} />Rash</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={skin.itch} onCheckedChange={(c) => setSkin({ ...skin, itch: c })} />Itch</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(skin.triggers).map(([k, v]) =>
              <label key={k} className="flex items-center gap-2 text-sm">
                  <Switch checked={v} onCheckedChange={(c) => setSkin({ ...skin, triggers: { ...skin.triggers, [k]: c } as any })} />
                  {pretty(k)}
                </label>
              )}
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={skin.notes} onChange={(e) => setSkin({ ...skin, notes: e.target.value })} placeholder="Care routine, weather, etc." />
            </div>
          </CardContent>
        </Card>

        <Card className="hidden md:block md:col-span-3">
          <CardHeader>
            <CardTitle>Mental Health</CardTitle>
            <CardDescription>Mood, anxiety, sleep, stress</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Mood (0-10)</Label>
              <Input type="number" min={0} max={10} step={1} value={mental.mood} onChange={(e) => setMental({ ...mental, mood: Number(e.target.value) })} />
              {(mental.mood < 0 || mental.mood > 10) && (
                <p className="text-xs text-muted-foreground">Value must be between 0 and 10.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Anxiety (0-10)</Label>
              <Input type="number" min={0} max={10} step={1} value={mental.anxiety} onChange={(e) => setMental({ ...mental, anxiety: Number(e.target.value) })} />
              {(mental.anxiety < 0 || mental.anxiety > 10) && (
                <p className="text-xs text-muted-foreground">Value must be between 0 and 10.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Sleep Hours</Label>
              <Input type="number" min={0} max={24} step={0.5} value={mental.sleepHours} onChange={(e) => setMental({ ...mental, sleepHours: Number(e.target.value) })} />
              {(mental.sleepHours < 0 || mental.sleepHours > 24) && (
                <p className="text-xs text-muted-foreground">Value must be between 0 and 24.</p>
              )}
              {Number.isFinite(mental.sleepHours) && mental.sleepHours >= 0 && mental.sleepHours <= 24 && (mental.sleepHours * 2) % 1 !== 0 && (
                <p className="text-xs text-muted-foreground">Use increments of 0.5 hours.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Stress Level (0-10)</Label>
              <Input type="number" min={0} max={10} step={1} value={mental.stressLevel} onChange={(e) => setMental({ ...mental, stressLevel: Number(e.target.value) })} />
              {(mental.stressLevel < 0 || mental.stressLevel > 10) && (
                <p className="text-xs text-muted-foreground">Value must be between 0 and 10.</p>
              )}
            </div>
            <div className="md:col-span-4 space-y-1">
              <Label>Notes</Label>
              <Input value={mental.notes} onChange={(e) => setMental({ ...mental, notes: e.target.value })} placeholder="What influenced your mood?" />
            </div>
          </CardContent>
        </Card>

        {/* Mobile: Accordion for Stomach/Skin/Mental */}
        <div className="md:hidden">
          <Accordion type="single" collapsible defaultValue="stomach">
            <AccordionItem value="stomach">
              <AccordionTrigger>Stomach</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label>Severity (0-10)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={1}
                      value={Number.isNaN(stomach.severity as any) ? "" : stomach.severity}
                      onChange={(e) =>
                        setStomach({
                          ...stomach,
                          severity:
                            e.target.value === ""
                              ? ((NaN as unknown) as number)
                              : clamp010(Number(e.target.value) as any),
                        })
                      }
                    />
                    {Number.isNaN(stomach.severity as any) && (
                      <p className="text-xs text-muted-foreground">Please enter a value from 0 to 10.</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Pain Location</Label>
                    <Select value={stomach.painLocation || undefined} onValueChange={(v) => setStomach({ ...stomach, painLocation: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select location" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upper-abdomen">Upper Abdomen</SelectItem>
                        <SelectItem value="lower-abdomen">Lower Abdomen</SelectItem>
                        <SelectItem value="left-side">Left Side</SelectItem>
                        <SelectItem value="right-side">Right Side</SelectItem>
                        <SelectItem value="generalized">Generalized</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Bowel Changes</Label>
                    <Select value={stomach.bowelChanges || undefined} onValueChange={(v) => setStomach({ ...stomach, bowelChanges: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select change" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="constipation">Constipation</SelectItem>
                        <SelectItem value="diarrhea">Diarrhea</SelectItem>
                        <SelectItem value="alternating">Alternating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(stomach.triggers).map(([k, v]) => (
                      <label key={k} className="flex items-center gap-2 text-sm">
                        <Switch checked={v} onCheckedChange={(c) => setStomach({ ...stomach, triggers: { ...stomach.triggers, [k]: c } as any })} />
                        {capitalize(k)}
                      </label>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Input value={stomach.notes} onChange={(e) => setStomach({ ...stomach, notes: e.target.value })} placeholder="Anything notable..." />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="skin">
              <AccordionTrigger>Skin</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label>Severity (0-10)</Label>
                    <Input type="number" min={0} max={10} step={1} value={skin.severity} onChange={(e) => setSkin({ ...skin, severity: Number(e.target.value) })} />
                    {(skin.severity < 0 || skin.severity > 10) && (
                      <p className="text-xs text-muted-foreground">Value must be between 0 and 10.</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Affected Area</Label>
                    <Select value={skin.area || undefined} onValueChange={(v) => setSkin({ ...skin, area: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select area" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="face">Face</SelectItem>
                        <SelectItem value="scalp">Scalp</SelectItem>
                        <SelectItem value="arms">Arms</SelectItem>
                        <SelectItem value="torso">Torso</SelectItem>
                        <SelectItem value="legs">Legs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm"><Switch checked={skin.rash} onCheckedChange={(c) => setSkin({ ...skin, rash: c })} />Rash</label>
                    <label className="flex items-center gap-2 text-sm"><Switch checked={skin.itch} onCheckedChange={(c) => setSkin({ ...skin, itch: c })} />Itch</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(skin.triggers).map(([k, v]) => (
                      <label key={k} className="flex items-center gap-2 text-sm">
                        <Switch checked={v} onCheckedChange={(c) => setSkin({ ...skin, triggers: { ...skin.triggers, [k]: c } as any })} />
                        {pretty(k)}
                      </label>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Input value={skin.notes} onChange={(e) => setSkin({ ...skin, notes: e.target.value })} placeholder="Care routine, weather, etc." />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="mental">
              <AccordionTrigger>Mental Health</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label>Mood (0-10)</Label>
                    <Input type="number" min={0} max={10} step={1} value={mental.mood} onChange={(e) => setMental({ ...mental, mood: Number(e.target.value) })} />
                    {(mental.mood < 0 || mental.mood > 10) && (
                      <p className="text-xs text-muted-foreground">Value must be between 0 and 10.</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Anxiety (0-10)</Label>
                    <Input type="number" min={0} max={10} step={1} value={mental.anxiety} onChange={(e) => setMental({ ...mental, anxiety: Number(e.target.value) })} />
                    {(mental.anxiety < 0 || mental.anxiety > 10) && (
                      <p className="text-xs text-muted-foreground">Value must be between 0 and 10.</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Sleep Hours</Label>
                    <Input type="number" min={0} max={24} step={0.5} value={mental.sleepHours} onChange={(e) => setMental({ ...mental, sleepHours: Number(e.target.value) })} />
                    {(mental.sleepHours < 0 || mental.sleepHours > 24) && (
                      <p className="text-xs text-muted-foreground">Value must be between 0 and 24.</p>
                    )}
                    {Number.isFinite(mental.sleepHours) && mental.sleepHours >= 0 && mental.sleepHours <= 24 && (mental.sleepHours * 2) % 1 !== 0 && (
                      <p className="text-xs text-muted-foreground">Use increments of 0.5 hours.</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Stress Level (0-10)</Label>
                    <Input type="number" min={0} max={10} step={1} value={mental.stressLevel} onChange={(e) => setMental({ ...mental, stressLevel: Number(e.target.value) })} />
                    {(mental.stressLevel < 0 || mental.stressLevel > 10) && (
                      <p className="text-xs text-muted-foreground">Value must be between 0 and 10.</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Notes</Label>
                    <Input value={mental.notes} onChange={(e) => setMental({ ...mental, notes: e.target.value })} placeholder="What influenced your mood?" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Desktop charts grid */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Stomach Trend (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[180px] md:h-[220px]" config={{ stomach: { label: "Severity", color: "var(--chart-1)" } }}>
              <LineChart data={series14.stomach}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="severity" stroke="var(--color-stomach)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Skin Trend (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[180px] md:h-[220px]" config={{ skin: { label: "Severity", color: "var(--chart-2)" } }}>
              <LineChart data={series14.skin}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="severity" stroke="var(--color-skin)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mental Trend (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[180px] md:h-[220px]" config={{ mood: { label: "Mood", color: "var(--chart-3)" }, anxiety: { label: "Anxiety", color: "var(--chart-4)" } }}>
              <LineChart data={series14.mentalMood}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={(props) => <ChartLegendContent payload={props.payload} verticalAlign={props.verticalAlign} />} />
                <Line type="monotone" dataKey="mood" stroke="var(--color-mood)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="anxiety" stroke="var(--color-anxiety)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Mobile charts in tabs */}
      <div className="md:hidden">
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="stomach">Stomach</TabsTrigger>
            <TabsTrigger value="skin">Skin</TabsTrigger>
            <TabsTrigger value="mental">Mental</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Stomach Trend (14d)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[180px]" config={{ stomach: { label: "Severity", color: "var(--chart-1)" } }}>
                  <LineChart data={series14.stomach}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="severity" stroke="var(--color-stomach)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Skin Trend (14d)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[180px]" config={{ skin: { label: "Severity", color: "var(--chart-2)" } }}>
                  <LineChart data={series14.skin}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="severity" stroke="var(--color-skin)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Mental Trend (14d)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[180px]" config={{ mood: { label: "Mood", color: "var(--chart-3)" }, anxiety: { label: "Anxiety", color: "var(--chart-4)" } }}>
                  <LineChart data={series14.mentalMood}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="mood" stroke="var(--color-mood)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="anxiety" stroke="var(--color-anxiety)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="stomach">
            <Card>
              <CardHeader><CardTitle className="text-base">Stomach Trend (14d)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[200px]" config={{ stomach: { label: "Severity", color: "var(--chart-1)" } }}>
                  <LineChart data={series14.stomach}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="severity" stroke="var(--color-stomach)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="skin">
            <Card>
              <CardHeader><CardTitle className="text-base">Skin Trend (14d)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[200px]" config={{ skin: { label: "Severity", color: "var(--chart-2)" } }}>
                  <LineChart data={series14.skin}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="severity" stroke="var(--color-skin)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="mental">
            <Card>
              <CardHeader><CardTitle className="text-base">Mental Trend (14d)</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[200px]" config={{ mood: { label: "Mood", color: "var(--chart-3)" }, anxiety: { label: "Anxiety", color: "var(--chart-4)" } }}>
                  <LineChart data={series14.mentalMood}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="mood" stroke="var(--color-mood)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="anxiety" stroke="var(--color-anxiety)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>Adaptive suggestions based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ?
          <p className="text-muted-foreground">No strong patterns yet. Keep logging for better recommendations.</p> :

          <ul className="space-y-2 list-disc pl-5">
              {insights.slice(0, 5).map((ins, i) =>
            <li key={i} className="leading-relaxed">
                  <span className="font-medium">[{ins.area}]</span> {ins.description} <span className="text-muted-foreground">(score: {ins.score.toFixed(2)})</span>
                </li>
            )}
            </ul>
          }
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function capitalize(s: string) {return s.charAt(0).toUpperCase() + s.slice(1);}
function pretty(s: string) {return s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());}

function clamp010(x: any) {
  return Math.max(0, Math.min(10, x));
}

function clamp024(x: any) {
  return Math.max(0, Math.min(24, x));
}