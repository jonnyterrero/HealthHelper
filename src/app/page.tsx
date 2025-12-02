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
    meditation: 0,
    water: 0,
    steps: 0,
    sleep: 7,
    notes: ""
  });

  // Enhanced stomach tracking state
  const [stomach, setStomach] = React.useState({
    severity: 0,
    painLocation: "",
    bowelChanges: "",
    triggers: { dairy: false, gluten: false, spicy: false, alcohol: false, caffeine: false },
    notes: ""
  });

  // Enhanced skin tracking state
  const [skin, setSkin] = React.useState({
    severity: 0,
    area: "",
    rash: false,
    itch: false,
    triggers: { cosmetics: false, detergent: false, weather: false, sweat: false, dietSugar: false },
    notes: ""
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
    });
    if (e?.skin) setSkin({
      severity: e.skin.severity,
      area: e.skin.area ?? "",
      rash: e.skin.rash ?? false,
      itch: e.skin.itch ?? false,
      triggers: { ...e.skin.triggers },
      notes: e.skin.notes ?? "",
    });
    if (e?.mental) setMental({
      mood: e.mental.mood,
      anxiety: e.mental.anxiety,
      sleepHours: e.mental.sleepHours ?? 7,
      stressLevel: e.mental.stressLevel ?? 5,
      notes: e.mental.notes ?? "",
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
    // Create a temporary, explicitly typed object for the entry.
    const entryToSave: Partial<HealthEntry> = {
      date,
      stomach: { date, severity: clamp010(stomach.severity as any), painLocation: stomach.painLocation || undefined, bowelChanges: stomach.bowelChanges || undefined, triggers: stomach.triggers, notes: stomach.notes || undefined },
      skin: { date, severity: clamp010(skin.severity as any), area: skin.area || undefined, rash: skin.rash, itch: skin.itch, triggers: skin.triggers, notes: skin.notes || undefined },
      mental: { date, mood: clamp010(mental.mood as any), anxiety: clamp010(mental.anxiety as any), sleepHours: clamp024(mental.sleepHours as any), stressLevel: clamp010(mental.stressLevel as any), notes: mental.notes || undefined },
      symptoms: { date, giFlare: clamp010(symptoms.giFlare as any), skinFlare: clamp010(symptoms.skinFlare as any), migraine: clamp010(symptoms.migraine as any), fatigue: clamp010(symptoms.fatigue as any), notes: symptoms.notes || undefined },
    };

    // Conditionally add the exercise data.
    if (workout.duration > 0) {
      entryToSave.exercise = {
        date,
        workouts: [{
            type: workout.type,
            duration: workout.duration,
            intensity: clamp010(workout.intensity as any),
            caloriesBurned: workout.caloriesBurned || undefined,
            heartRateAvg: workout.heartRateAvg || undefined,
            notes: workout.notes || undefined,
            feeling: workout.feeling,
            location: workout.location
        }]
      };
    }

    if (!entryToSave.date) {
      console.error("Date is missing, cannot save entry");
      return;
    }
    
    const updated = upsertEntry(entryToSave as HealthEntry);
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
            <Link href="/analytics" className="block">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-sm">Analytics</h3>
                  <p className="text-xs text-muted-foreground mt-1">Health insights</p>
                </div>
              </Card>
            </Link>
            
            <Link href="/lifestyle" className="block">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Dumbbell className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-sm">Lifestyle</h3>
                  <p className="text-xs text-muted-foreground mt-1">Workouts & nutrition</p>
                </div>
              </Card>
            </Link>
            
            <Link href="/skintrack" className="block">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-sm">SkinTrack+</h3>
                  <p className="text-xs text-muted-foreground mt-1">Skin monitoring</p>
                </div>
              </Card>
            </Link>
            
            <Link href="/gastro" className="block">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <HeartPulse className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-medium text-sm">GastroGuard</h3>
                  <p className="text-xs text-muted-foreground mt-1">Digestive health</p>
                </div>
              </Card>
            </Link>
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
                        value={dailyLog.meditation} 
                        onChange={(e) => setDailyLog({ ...dailyLog, meditation: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Water (glasses)</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        value={dailyLog.water} 
                        onChange={(e) => setDailyLog({ ...dailyLog, water: Number(e.target.value) })} 
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={saveAll} className="w-full">Save Today</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="workout" className="mt-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  <div className="mt-4">
                    <Button onClick={saveAll} className="w-full">Save Workout</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="sleep" className="mt-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sleep Hours</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        max={24} 
                        value={quickSleep.hours} 
                        onChange={(e) => setQuickSleep({ ...quickSleep, hours: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stress Level (1-10)</Label>
                      <Input 
                        type="number" 
                        min={1} 
                        max={10} 
                        value={quickSleep.stress} 
                        onChange={(e) => setQuickSleep({ ...quickSleep, stress: Number(e.target.value) })} 
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={saveQuickSleep} className="w-full">Save Sleep</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="symptoms" className="mt-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>GI Flare (1-10)</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        max={10} 
                        value={symptoms.giFlare} 
                        onChange={(e) => setSymptoms({ ...symptoms, giFlare: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Skin Flare (1-10)</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        max={10} 
                        value={symptoms.skinFlare} 
                        onChange={(e) => setSymptoms({ ...symptoms, skinFlare: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Migraine (1-10)</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        max={10} 
                        value={symptoms.migraine} 
                        onChange={(e) => setSymptoms({ ...symptoms, migraine: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fatigue (1-10)</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        max={10} 
                        value={symptoms.fatigue} 
                        onChange={(e) => setSymptoms({ ...symptoms, fatigue: Number(e.target.value) })} 
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={saveAll} className="w-full">Save Symptoms</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
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