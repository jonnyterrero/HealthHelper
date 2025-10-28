"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts";
import { loadEntries, upsertEntry, todayISO, lastNDays, toTimeSeries } from "@/lib/health";
import { ArrowLeft, Moon, Brain, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SleepTrackPage() {
  const [date, setDate] = React.useState(todayISO());
  const [entries, setEntries] = React.useState(() => loadEntries());
  
  const [sleepData, setSleepData] = React.useState({
    sleepHours: 7,
    stressLevel: 5,
    sleepQuality: 5,
    notes: ""
  });

  React.useEffect(() => {
    const e = loadEntries().find((x) => x.date === date);
    if (e?.mental) {
      setSleepData({
        sleepHours: e.mental.sleepHours ?? 7,
        stressLevel: e.mental.stressLevel ?? 5,
        sleepQuality: e.mental.mood ?? 5,
        notes: e.mental.notes ?? ""
      });
    }
  }, [date]);

  const series14 = toTimeSeries(lastNDays(entries, 14));

  // Calculate sleep stages based on duration, stress, and quality
  const calculateSleepStages = () => {
    const duration = sleepData.sleepHours;
    const stress = sleepData.stressLevel;
    const quality = sleepData.sleepQuality;

    // Heuristic ML model for sleep stages
    const deepSleepBase = Math.max(0, Math.min(25, (duration / 8) * 20 - stress * 2));
    const remSleepBase = Math.max(0, Math.min(25, (quality / 10) * 25));
    const lightSleepBase = Math.max(0, Math.min(60, 100 - deepSleepBase - remSleepBase - (stress * 2)));
    const awakBase = Math.max(0, Math.min(20, stress * 2));

    const total = deepSleepBase + remSleepBase + lightSleepBase + awakBase;
    
    return {
      deep: Math.round((deepSleepBase / total) * 100),
      rem: Math.round((remSleepBase / total) * 100),
      light: Math.round((lightSleepBase / total) * 100),
      awake: Math.round((awakBase / total) * 100)
    };
  };

  const stages = calculateSleepStages();

  // Calculate sleep efficiency score
  const calculateEfficiency = () => {
    const durationScore = Math.min(100, (sleepData.sleepHours / 8) * 100) * 0.3;
    const qualityScore = (sleepData.sleepQuality / 10) * 100 * 0.3;
    const stressScore = ((10 - sleepData.stressLevel) / 10) * 100 * 0.2;
    const stagesScore = (stages.deep + stages.rem) * 0.2;

    return Math.round(durationScore + qualityScore + stressScore + stagesScore);
  };

  const efficiency = calculateEfficiency();

  // Generate recommendations
  const getRecommendations = () => {
    const recs = [];
    
    if (sleepData.sleepHours < 7) {
      recs.push({ priority: "high", text: "Sleep debt detected. Aim for 7-9 hours tonight." });
    }
    
    if (sleepData.stressLevel >= 7) {
      recs.push({ priority: "high", text: "High stress may disrupt sleep. Try relaxation techniques before bed." });
    }
    
    if (stages.deep < 15) {
      recs.push({ priority: "medium", text: "Low deep sleep. Avoid caffeine 6+ hours before bedtime." });
    }
    
    if (stages.rem < 20) {
      recs.push({ priority: "medium", text: "REM deficiency detected. Maintain consistent sleep schedule." });
    }
    
    if (sleepData.sleepQuality < 5) {
      recs.push({ priority: "high", text: "Poor sleep quality. Review sleep environment (temperature, noise, light)." });
    }

    if (recs.length === 0) {
      recs.push({ priority: "low", text: "Sleep metrics look good! Keep up the healthy habits." });
    }

    return recs;
  };

  const recommendations = getRecommendations();

  function saveEntry() {
    const e = entries.find((x) => x.date === date) || { date, stomach: undefined, skin: undefined, mental: undefined };
    
    const updated = upsertEntry({
      ...e,
      mental: {
        date,
        mood: sleepData.sleepQuality,
        anxiety: 10 - sleepData.sleepQuality,
        sleepHours: sleepData.sleepHours,
        stressLevel: sleepData.stressLevel,
        notes: sleepData.notes || undefined
      }
    });
    
    setEntries(updated);
  }

  // Chart data for sleep and stress trends
  const sleepStressData = series14.mentalMood.map(entry => ({
    date: entry.date,
    sleep: series14.mentalMood.find(e => e.date === entry.date)?.mood || 0,
    stress: 10 - (series14.mentalMood.find(e => e.date === entry.date)?.anxiety || 0)
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-indigo-100/30 to-purple-50">
      <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Moon className="w-6 h-6 text-purple-500" />
              Sleep & Stress Tracker
            </h1>
            <p className="text-muted-foreground">Monitor your sleep patterns and stress levels</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Entry</CardTitle>
            <CardDescription>Track your sleep and stress for {date}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label>Sleep Hours</Label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={sleepData.sleepHours}
                  onChange={(e) => setSleepData({ ...sleepData, sleepHours: Number(e.target.value) })}
                />
                {(sleepData.sleepHours < 0 || sleepData.sleepHours > 24) && (
                  <p className="text-xs text-muted-foreground">Value must be between 0 and 24.</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Stress Level (0-10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  value={sleepData.stressLevel}
                  onChange={(e) => setSleepData({ ...sleepData, stressLevel: Number(e.target.value) })}
                />
                {(sleepData.stressLevel < 0 || sleepData.stressLevel > 10) && (
                  <p className="text-xs text-muted-foreground">Value must be between 0 and 10.</p>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label>Sleep Quality (0-10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  value={sleepData.sleepQuality}
                  onChange={(e) => setSleepData({ ...sleepData, sleepQuality: Number(e.target.value) })}
                />
                {(sleepData.sleepQuality < 0 || sleepData.sleepQuality > 10) && (
                  <p className="text-xs text-muted-foreground">Value must be between 0 and 10.</p>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={sleepData.notes}
                  onChange={(e) => setSleepData({ ...sleepData, notes: e.target.value })}
                  placeholder="How did you feel? Any dreams?"
                />
              </div>
            </div>

            <Button onClick={saveEntry} className="w-full">Save Entry</Button>
          </CardContent>
        </Card>

        {/* Sleep Efficiency Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Sleep Efficiency
            </CardTitle>
            <CardDescription>Overall sleep score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(efficiency / 100) * 351.86} 351.86`}
                    className={
                      efficiency >= 80
                        ? "text-green-500"
                        : efficiency >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{efficiency}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{Math.round((sleepData.sleepHours / 8) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality</span>
                <span>{Math.round((sleepData.sleepQuality / 10) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low Stress</span>
                <span>{Math.round(((10 - sleepData.stressLevel) / 10) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sleep Stages</span>
                <span>{stages.deep + stages.rem}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Sleep Stages Breakdown
          </CardTitle>
          <CardDescription>Estimated sleep cycle distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Deep Sleep</span>
                <span className="font-medium">{stages.deep}%</span>
              </div>
              <Progress value={stages.deep} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>REM Sleep</span>
                <span className="font-medium">{stages.rem}%</span>
              </div>
              <Progress value={stages.rem} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Light Sleep</span>
                <span className="font-medium">{stages.light}%</span>
              </div>
              <Progress value={stages.light} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Awake</span>
                <span className="font-medium">{stages.awake}%</span>
              </div>
              <Progress value={stages.awake} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sleep Duration Trend (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="w-full h-[250px]"
              config={{
                sleep: { label: "Sleep Hours", color: "var(--chart-3)" }
              }}
            >
              <BarChart data={sleepStressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 12]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sleep" fill="var(--color-sleep)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep vs Stress Correlation (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="w-full h-[250px]"
              config={{
                sleep: { label: "Sleep Quality", color: "var(--chart-3)" },
                stress: { label: "Stress Level", color: "var(--chart-1)" }
              }}
            >
              <LineChart data={sleepStressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={(props) => <ChartLegendContent payload={props.payload} verticalAlign={props.verticalAlign} />} />
                <Line type="monotone" dataKey="sleep" stroke="var(--color-sleep)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stress" stroke="var(--color-stress)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>AI-powered insights based on your data</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={`inline-block w-2 h-2 rounded-full mt-2 ${
                    rec.priority === "high"
                      ? "bg-red-500"
                      : rec.priority === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />
                <span className="flex-1">{rec.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}