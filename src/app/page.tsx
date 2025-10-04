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
import { Download, Activity, Sparkles, HeartPulse, Brain, Plug, Moon, ArrowRight, AlertCircle, TrendingUp, Zap, Apple, Leaf } from "lucide-react";

export default function HomePage() {
  const [date, setDate] = React.useState(todayISO());
  const [entries, setEntries] = React.useState(() => loadEntries());

  const [stomach, setStomach] = React.useState({
    severity: 0,
    painLocation: "",
    bowelChanges: "",
    triggers: { dairy: false, gluten: false, spicy: false, alcohol: false, caffeine: false },
    notes: ""
  });
  const [skin, setSkin] = React.useState({
    severity: 0,
    area: "",
    rash: false,
    itch: false,
    triggers: { cosmetics: false, detergent: false, weather: false, sweat: false, dietSugar: false },
    notes: ""
  });
  const [mental, setMental] = React.useState({ mood: 5, anxiety: 5, sleepHours: 7, stressLevel: 5, notes: "" });

  // New: Symptom tracking state
  const [symptoms, setSymptoms] = React.useState({
    giFlare: 0,
    skinFlare: 0,
    migraine: 0,
    fatigue: 0,
    notes: ""
  });

  // Quick sleep check-in state
  const [quickSleep, setQuickSleep] = React.useState({ hours: 7, stress: 5 });

  React.useEffect(() => {
    // preload existing for selected date
    const e = loadEntries().find((x) => x.date === date);
    if (e?.stomach) setStomach({
      severity: e.stomach.severity,
      painLocation: e.stomach.painLocation ?? "",
      bowelChanges: e.stomach.bowelChanges ?? "",
      triggers: { ...e.stomach.triggers },
      notes: e.stomach.notes ?? ""
    });
    if (e?.skin) setSkin({
      severity: e.skin.severity,
      area: e.skin.area ?? "",
      rash: !!e.skin.rash,
      itch: !!e.skin.itch,
      triggers: { ...e.skin.triggers },
      notes: e.skin.notes ?? ""
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
      notes: e.symptoms.notes ?? ""
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
    symptoms: { date, giFlare: clamp010(symptoms.giFlare as any), skinFlare: clamp010(symptoms.skinFlare as any), migraine: clamp010(symptoms.migraine as any), fatigue: clamp010(symptoms.fatigue as any), notes: symptoms.notes || undefined }
  }), [date, stomach, skin, mental, symptoms]);
  
  const sleepPrediction = React.useMemo(() => predictSleepQuality(currentEntry), [currentEntry]);
  const symptomPrediction = React.useMemo(() => predictSymptoms(currentEntry), [currentEntry]);

  function saveAll() {
    const updated = upsertEntry({
      date,
      stomach: { date, severity: clamp010(stomach.severity as any), painLocation: stomach.painLocation || undefined, bowelChanges: stomach.bowelChanges || undefined, triggers: stomach.triggers, notes: stomach.notes || undefined },
      skin: { date, severity: clamp010(skin.severity as any), area: skin.area || undefined, rash: skin.rash, itch: skin.itch, triggers: skin.triggers, notes: skin.notes || undefined },
      mental: { date, mood: clamp010(mental.mood as any), anxiety: clamp010(mental.anxiety as any), sleepHours: clamp024(mental.sleepHours as any), stressLevel: clamp010(mental.stressLevel as any), notes: mental.notes || undefined },
      symptoms: { date, giFlare: clamp010(symptoms.giFlare as any), skinFlare: clamp010(symptoms.skinFlare as any), migraine: clamp010(symptoms.migraine as any), fatigue: clamp010(symptoms.fatigue as any), notes: symptoms.notes || undefined }
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
    // Reload the page to show the new data with all insights
    window.location.reload();
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Health Dashboard</h1>
          <p className="text-muted-foreground">AI-powered tracking for stomach, skin, and mental health</p>
        </div>
        <div className="relative">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={handleLoadSampleData}
              className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Load Sample Data
            </Button>
            <ProfileMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
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

      {/* Desktop Navigation Tabs */}
      <nav className="block">
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg flex-wrap">
          <Button asChild variant="secondary" size="sm" className="flex-1 bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
            <Link href="/analytics" className="flex items-center justify-center gap-2">
              <Activity className="w-4 h-4" />
              Analytics
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1 bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
            <Link href="/nutrition" className="flex items-center justify-center gap-2">
              <Apple className="w-4 h-4" />
              Nutrition
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1 bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
            <Link href="/remedies" className="flex items-center justify-center gap-2">
              <Leaf className="w-4 h-4" />
              Remedies
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1 bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
            <Link href="/skintrack" className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              SkinTrack+
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1 bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
            <Link href="/gastro" className="flex items-center justify-center gap-2">
              <HeartPulse className="w-4 h-4" />
              GastroGuard
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1 bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
            <Link href="/mindtrack" className="flex items-center justify-center gap-2">
              <Brain className="w-4 h-4" />
              MindTrack
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1 bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
            <Link href="/sleeptrack" className="flex items-center justify-center gap-2">
              <Moon className="w-4 h-4" />
              SleepTrack
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="flex-1 bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300">
            <Link href="/integrations" className="flex items-center justify-center gap-2">
              <Plug className="w-4 h-4" />
              Integrations
            </Link>
          </Button>
        </div>
      </nav>

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
            <CardTitle>Stomach</CardTitle>
            <CardDescription>Symptoms and triggers</CardDescription>
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
            <CardTitle>Skin</CardTitle>
            <CardDescription>Symptoms and triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
                <ChartLegend content={<ChartLegendContent />} />
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
    </div>);

}

function capitalize(s: string) {return s.charAt(0).toUpperCase() + s.slice(1);}
function pretty(s: string) {return s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());}

function clamp010(x: any) {
  return Math.max(0, Math.min(10, x));
}

function clamp024(x: any) {
  return Math.max(0, Math.min(24, x));
}