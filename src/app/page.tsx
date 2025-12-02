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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { loadEntries, upsertEntry, todayISO, lastNDays, toTimeSeries, generateInsights, predictSleepQuality, predictSymptoms, type HealthEntry } from "@/lib/health";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Zap, Moon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkoutType = "other" | "walking" | "cardio" | "strength" | "yoga" | "stretching" | "sports" | "running" | "cycling" | "swimming" | "hiit";

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

  // Workout tracking from Python backend
  const [workout, setWorkout] = React.useState({
    timestamp: "",
    type: "walking" as WorkoutType,
    durationMin: 30,
    intensity: 5,
    caloriesBurned: 0,
    heartRateAvg: 0,
    heartRateMax: 0,
    notes: "",
    feeling: "normal" as "energized" | "tired" | "normal" | "sore",
    location: "outdoors" as "gym" | "home" | "outdoors" | "other"
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
    exercise: workout.durationMin > 0 ? { 
      date, 
      workouts: [{
          type: workout.type, 
          duration: workout.durationMin, 
          intensity: clamp010(workout.intensity as any), 
          caloriesBurned: workout.caloriesBurned || undefined, 
          heartRateAvg: workout.heartRateAvg || undefined, 
          notes: workout.notes || undefined, 
          feeling: workout.feeling,
          location: workout.location
      }]
  } : undefined
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
      exercise: workout.durationMin > 0 ? { 
        date, 
        workouts: [{
            type: workout.type, 
            duration: workout.durationMin, 
            intensity: clamp010(workout.intensity as any), 
            caloriesBurned: workout.caloriesBurned || undefined, 
            heartRateAvg: workout.heartRateAvg || undefined, 
            notes: workout.notes || undefined, 
            feeling: workout.feeling,
            location: workout.location
        }]
    } : undefined
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

  const GlassCard = ({ className, children, ...props }: React.ComponentProps<typeof Card>) => (
    <Card className={cn("glass-panel rounded-3xl border-white/40 shadow-sm hover:shadow-md transition-shadow duration-300", className)} {...props}>
        {children}
    </Card>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400">Welcome back. Here's your health overview.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/30 p-2 rounded-2xl border border-white/50">
            <div className="px-3 text-sm font-medium text-slate-600">Date:</div>
            <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="bg-transparent border-0 w-auto focus-visible:ring-0"
            />
            <Button onClick={saveAll} className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200">Save Changes</Button>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="space-y-4">
        {symptomPrediction.overallRisk === 'high' && (
            <Alert className="glass-panel border-red-200/50 bg-red-50/50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-800 dark:text-red-300 font-semibold">High Risk Alert</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-400">
                <p>Your patterns suggest elevated risk for symptoms. Check Insights for details.</p>
            </AlertDescription>
            </Alert>
        )}
        {sleepPrediction.riskFactors.length > 0 && sleepPrediction.confidence > 60 && (
            <Alert className="glass-panel border-yellow-200/50 bg-yellow-50/50 dark:bg-yellow-900/20">
            <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-300 font-semibold">Sleep Quality Alert</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                <p>Risk Factors: {sleepPrediction.riskFactors.join(', ')}</p>
            </AlertDescription>
            </Alert>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Daily Log & Vitals */}
        <div className="space-y-6">
            <GlassCard className="h-fit">
                <CardHeader>
                <CardTitle>📋 Daily Log</CardTitle>
                <CardDescription>Energy, focus, and daily factors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label>Energy</Label>
                        <Input type="number" min={1} max={10} value={dailyLog.energy} onChange={(e) => setDailyLog({ ...dailyLog, energy: Number(e.target.value) })} className="bg-white/50 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                        <Label>Focus</Label>
                        <Input type="number" min={1} max={10} value={dailyLog.focus} onChange={(e) => setDailyLog({ ...dailyLog, focus: Number(e.target.value) })} className="bg-white/50 rounded-xl" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Journal</Label>
                        <Textarea 
                        value={dailyLog.journalEntry} 
                        onChange={(e) => setDailyLog({ ...dailyLog, journalEntry: e.target.value })} 
                        placeholder="How are you feeling?"
                        className="bg-white/50 rounded-xl border-0 resize-none"
                        rows={3}
                        />
                    </div>
                </CardContent>
            </GlassCard>

            <GlassCard>
                <CardHeader>
                <CardTitle>❤️ Vitals</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Steps</Label>
                        <Input type="number" value={vitals.steps || ""} onChange={(e) => setVitals({ ...vitals, steps: Number(e.target.value) })} className="bg-white/50 rounded-xl h-9" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">HRV</Label>
                        <Input type="number" value={vitals.hrvMs || ""} onChange={(e) => setVitals({ ...vitals, hrvMs: Number(e.target.value) })} className="bg-white/50 rounded-xl h-9" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Resting HR</Label>
                        <Input type="number" value={vitals.hrMean || ""} onChange={(e) => setVitals({ ...vitals, hrMean: Number(e.target.value) })} className="bg-white/50 rounded-xl h-9" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">SpO2</Label>
                        <Input type="number" value={vitals.spo2 || ""} onChange={(e) => setVitals({ ...vitals, spo2: Number(e.target.value) })} className="bg-white/50 rounded-xl h-9" />
                    </div>
                </CardContent>
            </GlassCard>
        </div>

        {/* Column 2: Nutrition & Workout */}
        <div className="space-y-6">
            <GlassCard>
                <CardHeader>
                    <CardTitle>🍎 Nutrition</CardTitle>
                    <CardDescription>Track meals & macros</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-2">
                            <Label>Food Items</Label>
                            <Input value={nutrition.foodItems} onChange={(e) => setNutrition({ ...nutrition, foodItems: e.target.value })} placeholder="e.g. Oatmeal, Coffee" className="bg-white/50 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Calories</Label>
                            <Input type="number" value={nutrition.calories || ""} onChange={(e) => setNutrition({ ...nutrition, calories: Number(e.target.value) })} className="bg-white/50 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Protein (g)</Label>
                            <Input type="number" value={nutrition.proteinG || ""} onChange={(e) => setNutrition({ ...nutrition, proteinG: Number(e.target.value) })} className="bg-white/50 rounded-xl" />
                        </div>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="details" className="border-0">
                            <AccordionTrigger className="text-sm py-2 hover:no-underline hover:bg-white/20 rounded-lg px-2">More Details</AccordionTrigger>
                            <AccordionContent className="pt-2 grid grid-cols-3 gap-2">
                                <Input placeholder="Carbs" type="number" value={nutrition.carbsG || ""} onChange={(e) => setNutrition({ ...nutrition, carbsG: Number(e.target.value) })} className="bg-white/50 rounded-xl h-8 text-xs" />
                                <Input placeholder="Fat" type="number" value={nutrition.fatG || ""} onChange={(e) => setNutrition({ ...nutrition, fatG: Number(e.target.value) })} className="bg-white/50 rounded-xl h-8 text-xs" />
                                <Input placeholder="Sugar" type="number" value={nutrition.sugarG || ""} onChange={(e) => setNutrition({ ...nutrition, sugarG: Number(e.target.value) })} className="bg-white/50 rounded-xl h-8 text-xs" />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </GlassCard>

            <GlassCard>
                <CardHeader>
                    <CardTitle>💪 Workout</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={workout.type} onValueChange={(v) => setWorkout({ ...workout, type: v as WorkoutType })}>
                            <SelectTrigger className="bg-white/50 rounded-xl border-0"><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="run">Run</SelectItem>
                                <SelectItem value="weights">Weights</SelectItem>
                                <SelectItem value="yoga">Yoga</SelectItem>
                                <SelectItem value="walking">Walking</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Duration (m)</Label>
                        <Input type="number" value={workout.durationMin || ""} onChange={(e) => setWorkout({ ...workout, durationMin: Number(e.target.value) })} className="bg-white/50 rounded-xl" />
                    </div>
                </CardContent>
            </GlassCard>
        </div>

        {/* Column 3: Sleep & Symptoms */}
        <div className="space-y-6">
            <GlassCard>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Moon className="w-5 h-5 text-purple-500" />
                            <CardTitle>Quick Sleep</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="h-6 text-xs"><Link href="/sleeptrack">Full <ArrowRight className="w-3 h-3 ml-1" /></Link></Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Hours</Label>
                            <Input type="number" step={0.5} value={quickSleep.hours} onChange={(e) => setQuickSleep({ ...quickSleep, hours: Number(e.target.value) })} className="bg-white/50 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Stress</Label>
                            <Input type="number" min={0} max={10} value={quickSleep.stress} onChange={(e) => setQuickSleep({ ...quickSleep, stress: Number(e.target.value) })} className="bg-white/50 rounded-xl" />
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/40 text-xs space-y-1">
                        <div className="flex justify-between"><span>7d Avg Sleep:</span> <span className="font-semibold">{sleepStats.avgSleep}h</span></div>
                        <div className="flex justify-between"><span>7d Avg Stress:</span> <span className="font-semibold">{sleepStats.avgStress}/10</span></div>
                    </div>
                </CardContent>
            </GlassCard>

            <GlassCard>
                <CardHeader>
                    <CardTitle>Symptoms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm"><Label>GI Flare</Label> <span className="text-muted-foreground">{symptoms.giFlare}/10</span></div>
                        <Input type="range" min={0} max={10} value={symptoms.giFlare} onChange={(e) => setSymptoms({ ...symptoms, giFlare: Number(e.target.value) })} className="accent-purple-600" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm"><Label>Migraine</Label> <span className="text-muted-foreground">{symptoms.migraine}/10</span></div>
                        <Input type="range" min={0} max={10} value={symptoms.migraine} onChange={(e) => setSymptoms({ ...symptoms, migraine: Number(e.target.value) })} className="accent-purple-600" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm"><Label>Fatigue</Label> <span className="text-muted-foreground">{symptoms.fatigue}/10</span></div>
                        <Input type="range" min={0} max={10} value={symptoms.fatigue} onChange={(e) => setSymptoms({ ...symptoms, fatigue: Number(e.target.value) })} className="accent-purple-600" />
                    </div>
                </CardContent>
            </GlassCard>
        </div>
      </div>

      {/* Trends Section - Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <GlassCard>
            <CardHeader><CardTitle>Stomach Trend</CardTitle></CardHeader>
            <CardContent>
                <ChartContainer className="w-full h-[150px]" config={{ stomach: { label: "Severity", color: "var(--color-stomach)" } }}>
                    <LineChart data={series14.stomach}>
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0, 10]} hide />
                        <Line type="monotone" dataKey="severity" stroke="var(--color-stomach)" strokeWidth={3} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
         </GlassCard>
         <GlassCard>
            <CardHeader><CardTitle>Skin Trend</CardTitle></CardHeader>
            <CardContent>
                <ChartContainer className="w-full h-[150px]" config={{ skin: { label: "Severity", color: "var(--color-skin)" } }}>
                    <LineChart data={series14.skin}>
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0, 10]} hide />
                        <Line type="monotone" dataKey="severity" stroke="var(--color-skin)" strokeWidth={3} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
         </GlassCard>
         <GlassCard>
            <CardHeader><CardTitle>Mood Trend</CardTitle></CardHeader>
            <CardContent>
                <ChartContainer className="w-full h-[150px]" config={{ mood: { label: "Mood", color: "var(--color-mood)" } }}>
                    <LineChart data={series14.mentalMood}>
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0, 10]} hide />
                        <Line type="monotone" dataKey="mood" stroke="var(--color-mood)" strokeWidth={3} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
         </GlassCard>
      </div>
    </div>
  );
}

function clamp010(x: any) {
  return Math.max(0, Math.min(10, x));
}

function clamp024(x: any) {
  return Math.max(0, Math.min(24, x));
}
