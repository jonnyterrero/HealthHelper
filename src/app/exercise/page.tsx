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
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Bar, BarChart, ResponsiveContainer } from "recharts";
import { loadEntries, todayISO, lastNDays, upsertEntry, type HealthEntry, type Workout, type ExerciseEntry } from "@/lib/health";
import { ArrowLeft, Plus, Trash2, Upload, Activity, TrendingUp, Calendar, Zap, Heart, AlertCircle } from "lucide-react";

type WorkoutWithId = Workout & { id: string };

export default function ExercisePage() {
  const [entries, setEntries] = React.useState(() => loadEntries());
  const [date, setDate] = React.useState(todayISO());
  const [workouts, setWorkouts] = React.useState<WorkoutWithId[]>([]);
  
  const [newWorkout, setNewWorkout] = React.useState({
    type: "walking" as Workout['type'],
    duration: 30,
    intensity: 5,
    caloriesBurned: 0,
    heartRateAvg: 0,
    notes: "",
    feeling: "normal" as Workout['feeling'],
    location: "outdoors" as Workout['location'],
  });

  // Load workouts for selected date
  React.useEffect(() => {
    const entry = entries.find((e) => e.date === date);
    if (entry?.exercise?.workouts) {
      setWorkouts(entry.exercise.workouts.map((w, i) => ({
        id: `${date}-${i}`,
        ...w
      })));
    } else {
      setWorkouts([]);
    }
  }, [date, entries]);

  const addWorkout = () => {
    const workout: WorkoutWithId = {
      id: `${date}-${Date.now()}`,
      ...newWorkout
    };

    const { id, ...workoutData } = workout;

    const currentWorkouts = entries.find(e => e.date === date)?.exercise?.workouts || [];
    const newWorkouts = [...currentWorkouts, workoutData];

    const updatedEntries = upsertEntry({
      date,
      exercise: {
        date,
        workouts: newWorkouts
      }
    });
    setEntries(updatedEntries);

    // Reset form
    setNewWorkout({
      type: "walking",
      duration: 30,
      intensity: 5,
      caloriesBurned: 0,
      heartRateAvg: 0,
      notes: "",
      feeling: "normal",
      location: "outdoors"
    });
  };

  const deleteWorkout = (id: string) => {
    const updatedWorkouts = workouts.filter((w) => w.id !== id);
    
    const updatedEntries = upsertEntry({
      date,
      exercise: {
        date,
        workouts: updatedWorkouts.map(({ id, ...w }) => w)
      }
    });
    setEntries(updatedEntries);
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

      type CsvWorkout = Workout & { date: string };
      const imported: CsvWorkout[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const workout: CsvWorkout = {
          date: values[headers.indexOf("date")] || todayISO(),
          type: (values[headers.indexOf("type")] as Workout['type']) || "other",
          duration: parseInt(values[headers.indexOf("duration")] || "30"),
          intensity: parseInt(values[headers.indexOf("intensity")] || "5"),
          caloriesBurned: parseInt(values[headers.indexOf("calories")] || "0") || undefined,
          heartRateAvg: parseInt(values[headers.indexOf("heartrate")] || "0") || undefined,
          feeling: (values[headers.indexOf("feeling")] as Workout['feeling']) || "normal",
          location: (values[headers.indexOf("location")] as Workout['location']) || "other",
          notes: values[headers.indexOf("notes")] || "",
        };
        imported.push(workout);
      }

      // Group imported workouts by date
      const workoutsByDate: Record<string, Workout[]> = {};
      imported.forEach(w => {
        if (!workoutsByDate[w.date]) workoutsByDate[w.date] = [];
        const { date, ...workoutData } = w;
        workoutsByDate[w.date].push(workoutData);
      });

      // Merge with existing entries and save
      let updatedEntries = loadEntries();
      Object.keys(workoutsByDate).forEach(d => {
        const existingWorkouts = updatedEntries.find(e => e.date === d)?.exercise?.workouts || [];
        const newWorkouts = workoutsByDate[d];
        
        updatedEntries = upsertEntry({
          date: d,
          exercise: {
            date: d,
            workouts: [...existingWorkouts, ...newWorkouts]
          }
        });
      });
      
      setEntries(updatedEntries);
      alert(`Imported ${imported.length} workouts successfully!`);
    };
    reader.readAsText(file);
  };

  // Statistics
  const stats = React.useMemo(() => {
    const recent = lastNDays(entries, 30);
    const allWorkouts = recent.flatMap((e) => 
      (e.exercise?.workouts || []).map(w => ({ ...w, date: e.date }))
    );
    
    return {
      totalWorkouts: allWorkouts.length,
      totalMinutes: allWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
      avgIntensity: allWorkouts.length > 0 
        ? allWorkouts.reduce((sum, w) => sum + (w.intensity || 0), 0) / allWorkouts.length 
        : 0,
      totalCalories: allWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
      weeklyData: (() => {
        const weekData: { date: string; duration: number; workouts: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const dayWorkouts = allWorkouts.filter((w) => w.date === dateStr);
          weekData.push({
            date: d.toLocaleDateString("en-US", { weekday: "short" }),
            duration: dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
            workouts: dayWorkouts.length
          });
        }
        return weekData;
      })()
    };
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Exercise & Recovery Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Track workouts, monitor recovery, and analyze your fitness patterns
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Workouts</CardDescription>
              <CardTitle className="text-3xl">{stats.totalWorkouts}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Minutes</CardDescription>
              <CardTitle className="text-3xl">{stats.totalMinutes}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Exercise time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Intensity</CardDescription>
              <CardTitle className="text-3xl">{stats.avgIntensity.toFixed(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Out of 10</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Calories Burned</CardDescription>
              <CardTitle className="text-3xl">{stats.totalCalories}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Total burned</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="log" className="space-y-4">
          <TabsList>
            <TabsTrigger value="log">Log Workout</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Workout</CardTitle>
                <CardDescription>Log your exercise session for {date}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Workout Type</Label>
                    <Select value={newWorkout.type} onValueChange={(v) => setNewWorkout({ ...newWorkout, type: v as Workout['type'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walking">Walking</SelectItem>
                        <SelectItem value="running">Running</SelectItem>
                        <SelectItem value="cycling">Cycling</SelectItem>
                        <SelectItem value="swimming">Swimming</SelectItem>
                        <SelectItem value="strength">Strength Training</SelectItem>
                        <SelectItem value="yoga">Yoga</SelectItem>
                        <SelectItem value="hiit">HIIT</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newWorkout.duration}
                      onChange={(e) => setNewWorkout({ ...newWorkout, duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Intensity (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newWorkout.intensity}
                      onChange={(e) => setNewWorkout({ ...newWorkout, intensity: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                  <div>
                    <Label>Feeling After</Label>
                    <Select value={newWorkout.feeling} onValueChange={(v: any) => setNewWorkout({ ...newWorkout, feeling: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="energized">Energized</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="tired">Tired</SelectItem>
                        <SelectItem value="sore">Sore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Calories Burned (optional)</Label>
                    <Input
                      type="number"
                      value={newWorkout.caloriesBurned || ""}
                      onChange={(e) => setNewWorkout({ ...newWorkout, caloriesBurned: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Avg Heart Rate (optional)</Label>
                    <Input
                      type="number"
                      value={newWorkout.heartRateAvg || ""}
                      onChange={(e) => setNewWorkout({ ...newWorkout, heartRateAvg: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={newWorkout.notes}
                    onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                    placeholder="How did you feel? Any observations?"
                  />
                </div>
                <Button onClick={addWorkout} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Workout
                </Button>
              </CardContent>
            </Card>

            {workouts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Today's Workouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workouts.map((workout) => (
                      <div key={workout.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-semibold capitalize">{workout.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {workout.duration} min • Intensity: {workout.intensity}/10
                            {workout.caloriesBurned && ` • ${workout.caloriesBurned} cal`}
                            {workout.feeling && ` • Feeling: ${workout.feeling}`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWorkout(workout.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workout History</CardTitle>
                <CardDescription>View past workouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lastNDays(entries, 30)
                    .flatMap((e) => (e.exercise?.workouts || []).map((w: any, i: number) => ({ ...w, date: e.date, id: `${e.date}-${i}` })))
                    .reverse()
                    .slice(0, 20)
                    .map((workout: any) => (
                      <div key={workout.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-semibold capitalize">{workout.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {workout.date} • {workout.duration} min • Intensity: {workout.intensity}/10
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Last 7 days workout duration</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip />
                    <Bar dataKey="duration" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Wearable Data</CardTitle>
                <CardDescription>Import workout data from Fitbit, Apple Watch, or other devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>CSV Format</AlertTitle>
                  <AlertDescription>
                    Your CSV should have columns: date, type, duration, intensity, calories (optional), heartrate (optional)
                    <br />
                    Example:
                    <br />
                    <code className="text-xs">
                      date,type,duration,intensity,calories,heartrate<br />
                      2024-01-01,Running,30,7,300,145<br />
                      2024-01-02,Yoga,45,3,150,90
                    </code>
                  </AlertDescription>
                </Alert>
                <div>
                  <Label>Upload CSV File</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

