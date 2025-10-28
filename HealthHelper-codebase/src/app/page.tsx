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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Upload, Activity, Sparkles, HeartPulse, Brain, Plug, Moon, ArrowRight, AlertCircle, TrendingUp, Zap, Apple, Leaf, Dumbbell, Calendar, Target, Award, Lightbulb, FileText, Image, File } from "lucide-react";

export default function HomePage() {
  const [date, setDate] = React.useState(todayISO());
  const [entries, setEntries] = React.useState(() => loadEntries());
  const [showAllServices, setShowAllServices] = React.useState(false);
  const [showAllActivity, setShowAllActivity] = React.useState(false);
  
  // External app data for comprehensive overview
  const [gastroData, setGastroData] = React.useState<any[]>([]);
  const [mindData, setMindData] = React.useState<any[]>([]);
  const [skinData, setSkinData] = React.useState<any[]>([]);
  
  // Modal states
  const [showTodayEntriesModal, setShowTodayEntriesModal] = React.useState(false);
  const [showHealthScoreModal, setShowHealthScoreModal] = React.useState(false);
  const [showStreakModal, setShowStreakModal] = React.useState(false);
  const [showInsightsModal, setShowInsightsModal] = React.useState(false);
  const [showImportModal, setShowImportModal] = React.useState(false);
  
  // Import states
  const [importedFiles, setImportedFiles] = React.useState<File[]>([]);
  const [importPreview, setImportPreview] = React.useState<any[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

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

  // Load data from external health tracking apps
  React.useEffect(() => {
    const loadExternalData = () => {
      try {
        const gastro = JSON.parse(localStorage.getItem("orchids.gastro.logs.v1") || "[]");
        setGastroData(Array.isArray(gastro) ? gastro : []);
      } catch {
        setGastroData([]);
      }
      
      try {
        const mind = JSON.parse(localStorage.getItem("orchids.mindtrack.entries.v1") || "[]");
        setMindData(Array.isArray(mind) ? mind : []);
      } catch {
        setMindData([]);
      }
      
      try {
        const skin = JSON.parse(localStorage.getItem("orchids.skintrack.lesions.v1") || "[]");
        setSkinData(Array.isArray(skin) ? skin : []);
      } catch {
        setSkinData([]);
      }
    };

    loadExternalData();
    
    // Listen for storage changes to update data in real-time
    const handleStorageChange = () => loadExternalData();
    window.addEventListener("storage", handleStorageChange);
    
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const series14 = toTimeSeries(lastNDays(entries, 14));
  const insights = React.useMemo(() => generateInsights(entries), [entries]);

  // Calculate sleep stats for quick view
  const sleepStats = React.useMemo(() => {
    const recent = lastNDays(entries, 7);
    const avgSleep = recent.reduce((acc, e) => acc + (e.mental?.sleepHours ?? 0), 0) / Math.max(recent.length, 1);
    const avgStress = recent.reduce((acc, e) => acc + (e.mental?.stressLevel ?? 5), 0) / Math.max(recent.length, 1);
    return { avgSleep: avgSleep.toFixed(1), avgStress: avgStress.toFixed(1) };
  }, [entries]);

  // Comprehensive health overview data
  const comprehensiveData = React.useMemo(() => {
    // Get last 30 days of data
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().slice(0, 10);
    }).reverse();

    return last30Days.map(date => {
      // Gastro data
      const gastroEntry = gastroData.find(g => g.datetime?.startsWith(date));
      const gastroPain = gastroEntry ? Number(gastroEntry.pain || 0) : null;
      const gastroStress = gastroEntry ? Number(gastroEntry.stress || 0) : null;

      // Mind data
      const mindEntry = mindData.find(m => m.date === date);
      const mood = mindEntry ? Number(mindEntry.mood || 0) : null;
      const mindStress = mindEntry ? Number(mindEntry.stress || 0) : null;
      const energy = mindEntry ? Number(mindEntry.energy || 0) : null;

      // Skin data
      const skinEntry = skinData.find(s => s.date === date);
      const skinSeverity = skinEntry ? Number(skinEntry.severity || 0) : null;
      const skinArea = skinEntry ? Number(skinEntry.area || 0) : null;

      // Main app data
      const mainEntry = entries.find(e => e.date === date);
      const mainMood = mainEntry?.mental?.mood || null;
      const mainStress = mainEntry?.mental?.stressLevel || null;
      const mainSleep = mainEntry?.mental?.sleepHours || null;

      return {
        date,
        gastroPain,
        gastroStress,
        mood: mood || mainMood,
        stress: mindStress || mainStress,
        energy,
        skinSeverity,
        skinArea,
        sleep: mainSleep
      };
    });
  }, [gastroData, mindData, skinData, entries]);

  // Detailed stats calculations for modals
  const todayEntriesDetails = React.useMemo(() => {
    const today = todayISO();
    const todayEntry = entries.find(e => e.date === today);
    const last7Days = lastNDays(entries, 7);
    const last30Days = lastNDays(entries, 30);
    
    // Count days with entries in last 30 days
    const daysWithEntries = last30Days.length;
    const daysMissed = 30 - daysWithEntries;
    
    // Previous entries for comparison
    const previousWeek = lastNDays(entries, 14).slice(0, 7);
    const previousWeekCount = previousWeek.length;
    
    return {
      todayEntry,
      last7Days,
      last30Days,
      daysWithEntries,
      daysMissed,
      previousWeekCount,
      completionRate: Math.round((daysWithEntries / 30) * 100)
    };
  }, [entries]);

  const healthScoreDetails = React.useMemo(() => {
    const recent = lastNDays(entries, 7);
    if (recent.length === 0) return { score: 0, factors: [], breakdown: {} };
    
    // Calculate health score based on multiple factors
    let score = 0;
    let maxScore = 0;
    const factors = [];
    
    // Mood factor (0-10 scale)
    const avgMood = recent.reduce((acc, e) => acc + (e.mental?.mood ?? 5), 0) / recent.length;
    const moodScore = (avgMood / 10) * 25; // 25% of total score
    score += moodScore;
    maxScore += 25;
    factors.push({ name: "Mood", value: avgMood.toFixed(1), score: moodScore, max: 25, color: "blue" });
    
    // Sleep factor (0-10 scale, optimal around 7-8 hours)
    const avgSleep = recent.reduce((acc, e) => acc + (e.mental?.sleepHours ?? 7), 0) / recent.length;
    const sleepScore = Math.max(0, 25 - Math.abs(avgSleep - 7.5) * 3); // Penalty for deviation from 7.5h
    score += sleepScore;
    maxScore += 25;
    factors.push({ name: "Sleep", value: `${avgSleep.toFixed(1)}h`, score: sleepScore, max: 25, color: "purple" });
    
    // Stress factor (0-10 scale, lower is better)
    const avgStress = recent.reduce((acc, e) => acc + (e.mental?.stressLevel ?? 5), 0) / recent.length;
    const stressScore = (10 - avgStress) / 10 * 25; // Inverted: lower stress = higher score
    score += stressScore;
    maxScore += 25;
    factors.push({ name: "Stress", value: avgStress.toFixed(1), score: stressScore, max: 25, color: "red" });
    
    // Activity factor (workout frequency)
    const workoutDays = recent.filter(e => e.workout && e.workout.duration > 0).length;
    const activityScore = (workoutDays / 7) * 25;
    score += activityScore;
    maxScore += 25;
    factors.push({ name: "Activity", value: `${workoutDays}/7 days`, score: activityScore, max: 25, color: "green" });
    
    return {
      score: Math.round(score),
      maxScore,
      factors,
      breakdown: { mood: avgMood, sleep: avgSleep, stress: avgStress, activity: workoutDays }
    };
  }, [entries]);

  const streakDetails = React.useMemo(() => {
    const allEntries = entries.sort((a, b) => b.date.localeCompare(a.date));
    const today = todayISO();
    
    // Current streak
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    while (true) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      const hasEntry = allEntries.some(e => e.date === dateStr);
      if (hasEntry) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Previous streaks
    const streaks = [];
    let tempStreak = 0;
    let lastDate = null;
    
    for (const entry of allEntries) {
      if (!lastDate || new Date(entry.date).getTime() === new Date(lastDate).getTime() - 86400000) {
        tempStreak++;
      } else {
        if (tempStreak > 1) streaks.push(tempStreak);
        tempStreak = 1;
      }
      lastDate = entry.date;
    }
    if (tempStreak > 1) streaks.push(tempStreak);
    
    const longestStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
    const averageStreak = streaks.length > 0 ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length) : 0;
    
    // Missed days in current streak period
    const streakStartDate = new Date(today);
    streakStartDate.setDate(streakStartDate.getDate() - currentStreak);
    const totalDays = Math.ceil((new Date(today).getTime() - streakStartDate.getTime()) / 86400000);
    const missedDays = totalDays - currentStreak;
    
    return {
      currentStreak,
      longestStreak,
      averageStreak,
      missedDays,
      totalStreaks: streaks.length,
      streaks: streaks.slice(0, 5) // Last 5 streaks
    };
  }, [entries]);

  const insightsDetails = React.useMemo(() => {
    const recent = lastNDays(entries, 14);
    const insights = generateInsights(entries);
    
    // Analyze what's affecting insights
    const factors = [];
    
    // Mood trends
    const moodTrend = recent.map(e => e.mental?.mood ?? 5);
    const moodImproving = moodTrend.length > 1 && moodTrend[0] > moodTrend[moodTrend.length - 1];
    if (moodImproving) factors.push({ type: "positive", text: "Mood is improving over time" });
    else if (!moodImproving && moodTrend.length > 1) factors.push({ type: "negative", text: "Mood has been declining" });
    
    // Sleep patterns
    const sleepHours = recent.map(e => e.mental?.sleepHours ?? 7);
    const avgSleep = sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length;
    if (avgSleep < 6) factors.push({ type: "negative", text: "Sleep duration is below recommended 7-8 hours" });
    else if (avgSleep > 9) factors.push({ type: "warning", text: "Sleep duration is above recommended range" });
    else factors.push({ type: "positive", text: "Sleep duration is within healthy range" });
    
    // Stress levels
    const stressLevels = recent.map(e => e.mental?.stressLevel ?? 5);
    const avgStress = stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length;
    if (avgStress > 7) factors.push({ type: "negative", text: "High stress levels detected" });
    else if (avgStress < 4) factors.push({ type: "positive", text: "Stress levels are well managed" });
    
    // Activity levels
    const workoutDays = recent.filter(e => e.workout && e.workout.duration > 0).length;
    if (workoutDays < 3) factors.push({ type: "warning", text: "Low activity levels - consider more exercise" });
    else if (workoutDays > 5) factors.push({ type: "positive", text: "Excellent activity levels" });
    
    return {
      insights,
      factors,
      dataPoints: recent.length,
      timeRange: "14 days"
    };
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

  // Import functionality
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    setImportedFiles(prev => [...prev, ...files]);
    processFiles(files);
  }

  function processFiles(files: File[]) {
    setIsProcessing(true);
    const processedData: any[] = [];
    
    files.forEach(file => {
      const fileData = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        category: categorizeFile(file),
        status: 'processing' as const
      };
      processedData.push(fileData);
    });
    
    setImportPreview(processedData);
    setIsProcessing(false);
  }

  function categorizeFile(file: File): string {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    
    if (type.includes('image')) return 'Medical Photo';
    if (name.includes('lab') || name.includes('blood') || name.includes('test')) return 'Lab Results';
    if (name.includes('prescription') || name.includes('medication')) return 'Prescription';
    if (name.includes('report') || name.includes('summary')) return 'Medical Report';
    if (name.includes('note') || name.includes('visit')) return 'Doctor Notes';
    if (type.includes('pdf')) return 'Document';
    return 'Other';
  }

  function confirmImport() {
    // Process and integrate the imported data
    const newEntries: HealthEntry[] = [];
    
    importPreview.forEach(item => {
      // Create a basic entry from the imported file
      const entry: HealthEntry = {
        date: todayISO(),
        mental: {
          date: todayISO(),
          mood: 5,
          anxiety: 5,
          sleepHours: 7,
          stressLevel: 5,
          notes: `Imported: ${item.name} (${item.category})`
        }
      };
      newEntries.push(entry);
    });
    
    // Add to existing entries
    const updatedEntries = [...entries, ...newEntries];
    setEntries(updatedEntries);
    
    // Clear import data
    setImportedFiles([]);
    setImportPreview([]);
    setShowImportModal(false);
    
    toast.success(`Successfully imported ${newEntries.length} medical documents!`);
  }

  function removeFile(index: number) {
    setImportedFiles(prev => prev.filter((_, i) => i !== index));
    setImportPreview(prev => prev.filter((_, i) => i !== index));
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50">
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
            <Link href="/integrations">
              <Button 
                variant="outline" 
                size="sm"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Plug className="w-4 h-4 mr-1" />
                Integrations
              </Button>
            </Link>
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
            
            <Button 
              variant="outline" 
              size="sm" 
              className="border-green-200 text-green-700 hover:bg-green-50"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
        </div>
      </header>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Dialog open={showTodayEntriesModal} onOpenChange={setShowTodayEntriesModal}>
            <DialogTrigger asChild>
              <Card className="bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Entries</p>
                      <p className="text-2xl font-bold text-blue-600">{entries.filter(e => e.date === date).length}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Today's Entries Details
                </DialogTitle>
                <DialogDescription>
                  Detailed breakdown of your daily entries and tracking consistency
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{todayEntriesDetails.daysWithEntries}</p>
                      <p className="text-sm text-muted-foreground">Days with entries (30 days)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">{todayEntriesDetails.daysMissed}</p>
                      <p className="text-sm text-muted-foreground">Days missed</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{todayEntriesDetails.completionRate}%</p>
                      <p className="text-sm text-muted-foreground">Completion rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{todayEntriesDetails.previousWeekCount}</p>
                      <p className="text-sm text-muted-foreground">Previous week entries</p>
                    </CardContent>
                  </Card>
                </div>
                {todayEntriesDetails.todayEntry && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Today's Entry</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {todayEntriesDetails.todayEntry.mental && (
                          <div className="flex justify-between">
                            <span>Mood:</span>
                            <span className="font-medium">{todayEntriesDetails.todayEntry.mental.mood}/10</span>
                          </div>
                        )}
                        {todayEntriesDetails.todayEntry.mental && (
                          <div className="flex justify-between">
                            <span>Sleep:</span>
                            <span className="font-medium">{todayEntriesDetails.todayEntry.mental.sleepHours}h</span>
                          </div>
                        )}
                        {todayEntriesDetails.todayEntry.workout && (
                          <div className="flex justify-between">
                            <span>Workout:</span>
                            <span className="font-medium">{todayEntriesDetails.todayEntry.workout.duration}min</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showHealthScoreModal} onOpenChange={setShowHealthScoreModal}>
            <DialogTrigger asChild>
              <Card className="bg-gradient-to-br from-white/90 via-green-50/50 to-pink-50/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Health Score</p>
                      <p className="text-2xl font-bold text-green-600">{healthScoreDetails.score}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Health Score Breakdown
                </DialogTitle>
                <DialogDescription>
                  Your health score is calculated based on multiple factors over the last 7 days
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">{healthScoreDetails.score}/{healthScoreDetails.maxScore || 100}</div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${((healthScoreDetails.score / (healthScoreDetails.maxScore || 100)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-3">
                  {healthScoreDetails.factors.map((factor, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${factor.color}-500`}></div>
                            <span className="font-medium">{factor.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{factor.value}</div>
                            <div className="text-sm text-muted-foreground">{factor.score.toFixed(1)}/{factor.max}</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`bg-${factor.color}-500 h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${(factor.score / factor.max) * 100}%` }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showStreakModal} onOpenChange={setShowStreakModal}>
            <DialogTrigger asChild>
              <Card className="bg-gradient-to-br from-white/90 via-purple-50/50 to-pink-50/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Streak</p>
                      <p className="text-2xl font-bold text-purple-600">{streakDetails.currentStreak} days</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Streak Details
                </DialogTitle>
                <DialogDescription>
                  Your tracking consistency and streak history
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{streakDetails.currentStreak}</p>
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">{streakDetails.longestStreak}</p>
                      <p className="text-sm text-muted-foreground">Longest Streak</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{streakDetails.averageStreak}</p>
                      <p className="text-sm text-muted-foreground">Average Streak</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">{streakDetails.missedDays}</p>
                      <p className="text-sm text-muted-foreground">Days Missed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{streakDetails.totalStreaks}</p>
                      <p className="text-sm text-muted-foreground">Total Streaks</p>
                    </CardContent>
                  </Card>
                </div>
                {streakDetails.streaks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Streaks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {streakDetails.streaks.map((streak, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span>Streak #{index + 1}</span>
                            <span className="font-medium">{streak} days</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showInsightsModal} onOpenChange={setShowInsightsModal}>
            <DialogTrigger asChild>
              <Card className="bg-gradient-to-br from-white/90 via-orange-50/50 to-pink-50/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Insights</p>
                      <p className="text-2xl font-bold text-orange-600">{insightsDetails.insights.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Lightbulb className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-orange-600" />
                  Health Insights Analysis
                </DialogTitle>
                <DialogDescription>
                  AI-generated insights based on your health data over the last {insightsDetails.timeRange}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">{insightsDetails.insights.length}</p>
                      <p className="text-sm text-muted-foreground">Total Insights</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{insightsDetails.dataPoints}</p>
                      <p className="text-sm text-muted-foreground">Data Points</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Factors Affecting Your Insights:</h4>
                  {insightsDetails.factors.map((factor, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            factor.type === 'positive' ? 'bg-green-500' : 
                            factor.type === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>
                          <p className={`text-sm ${
                            factor.type === 'positive' ? 'text-green-700' : 
                            factor.type === 'negative' ? 'text-red-700' : 'text-yellow-700'
                          }`}>
                            {factor.text}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Generated Insights:</h4>
                  {insightsDetails.insights.length > 0 ? (
                    <div className="space-y-2">
                      {insightsDetails.insights.map((insight, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <p className="text-sm">{String(insight)}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-4 text-center text-muted-foreground">
                        <p>No insights available yet. Keep tracking your health data to generate personalized insights!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
                </div>

        {/* Import Modal */}
        <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                Import Medical Data
              </DialogTitle>
              <DialogDescription>
                Upload your medical documents, lab results, prescriptions, and photos to integrate with your health tracking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">Upload Medical Files</p>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports: PDF, Images, Documents (JPG, PNG, PDF, DOC, DOCX, TXT)
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* File Categories Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Lab Results</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Blood tests, urine analysis, etc.</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Medical Photos</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Skin conditions, wounds, etc.</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <File className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm">Prescriptions</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Medication lists, dosages</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-sm">Doctor Notes</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Visit summaries, diagnoses</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <File className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-sm">Medical Reports</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Imaging, test results</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-sm">Other Documents</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Insurance, referrals, etc.</p>
                </Card>
              </div>

              {/* File Preview */}
              {importPreview.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Files to Import ({importPreview.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {importPreview.map((file, index) => (
                      <Card key={file.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                              {file.type.includes('image') ? (
                                <Image className="w-4 h-4 text-gray-600" />
                              ) : file.type.includes('pdf') ? (
                                <FileText className="w-4 h-4 text-red-600" />
                              ) : (
                                <File className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.category} • {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportedFiles([]);
                    setImportPreview([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmImport}
                  disabled={importPreview.length === 0 || isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {importPreview.length} Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
              <Card className="bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 backdrop-blur-sm border-0 shadow-lg">
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
              <Card className="bg-gradient-to-br from-white/90 via-green-50/50 to-pink-50/50 backdrop-blur-sm border-0 shadow-lg">
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
              <Card className="bg-gradient-to-br from-white/90 via-indigo-50/50 to-purple-50/50 backdrop-blur-sm border-0 shadow-lg">
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
              <Card className="bg-gradient-to-br from-white/90 via-red-50/50 to-pink-50/50 backdrop-blur-sm border-0 shadow-lg">
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

        {/* Comprehensive Health Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Health Overview</h2>
              <p className="text-sm text-muted-foreground">Comprehensive view of all your health data</p>
            </div>
          </div>
          
          <Card className="bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Health Trends (Last 30 Days)
              </CardTitle>
              <CardDescription>
                Combined data from MindMap, SkinTrack+, and GastroGuard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  mood: { label: "Mood", color: "#a855f7" },
                  stress: { label: "Stress", color: "#dc2626" },
                  energy: { label: "Energy", color: "#10b981" },
                  gastroPain: { label: "Gastro Pain", color: "#f87171" },
                  skinSeverity: { label: "Skin Severity", color: "#6b21a8" },
                  sleep: { label: "Sleep Hours", color: "#06b6d4" }
                }}
                className="h-[200px] w-full"
              >
                <LineChart data={comprehensiveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={{ fill: "#a855f7", strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stress" 
                    stroke="#dc2626" 
                    strokeWidth={2}
                    dot={{ fill: "#dc2626", strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gastroPain" 
                    stroke="#f87171" 
                    strokeWidth={2}
                    dot={{ fill: "#f87171", strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="skinSeverity" 
                    stroke="#6b21a8" 
                    strokeWidth={2}
                    dot={{ fill: "#6b21a8", strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ChartContainer>
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600"
              onClick={() => setShowAllServices(!showAllServices)}
            >
              {showAllServices ? 'SHOW LESS' : 'VIEW ALL'} →
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/analytics" className="block">
              <Card className="bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
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
              <Card className="bg-gradient-to-br from-white/90 via-green-50/50 to-pink-50/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
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
              <Card className="bg-gradient-to-br from-white/90 via-purple-50/50 to-pink-50/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
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
              <Card className="bg-gradient-to-br from-white/90 via-red-50/50 to-pink-50/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <HeartPulse className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-medium text-sm">GastroGuard</h3>
                  <p className="text-xs text-muted-foreground mt-1">Digestive health</p>
                </div>
              </Card>
            </Link>
            
            {showAllServices && (
              <>
                <Link href="/mindtrack" className="block">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Brain className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="font-medium text-sm">MindMap</h3>
                      <p className="text-xs text-muted-foreground mt-1">Mental health</p>
                    </div>
                  </Card>
                </Link>
                
                <Link href="/sleeptrack" className="block">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Moon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="font-medium text-sm">Sleep</h3>
                      <p className="text-xs text-muted-foreground mt-1">Sleep tracking</p>
                    </div>
                  </Card>
                </Link>
                
                <Link href="/nutrition" className="block">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Apple className="w-6 h-6 text-yellow-600" />
                      </div>
                      <h3 className="font-medium text-sm">Nutrition</h3>
                      <p className="text-xs text-muted-foreground mt-1">Food tracking</p>
                    </div>
                  </Card>
                </Link>
                
                <Link href="/remedies" className="block">
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group">
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <Leaf className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="font-medium text-sm">Remedies</h3>
                      <p className="text-xs text-muted-foreground mt-1">Natural remedies</p>
                    </div>
                  </Card>
                </Link>
              </>
            )}
          </div>
          </div>

        {/* Recent Activity */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">Your latest health entries</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600"
              onClick={() => setShowAllActivity(!showAllActivity)}
            >
              {showAllActivity ? 'SHOW LESS' : 'VIEW ALL'} →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.slice(0, showAllActivity ? 8 : 4).map((entry, idx) => (
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