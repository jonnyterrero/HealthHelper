"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"

// GastroGuard Enhanced v3 - minimal local implementation
const STORAGE_KEY = "orchids.gastro.logs.v1"

export type GastroLog = {
  id: string
  datetime: string // ISO datetime
  meal: string
  pain: number // 0-10
  stress: number // 0-10
  remedy?: string
  condition?: "gastritis" | "GERD" | "IBS" | "dyspepsia" | "food_sensitivity"
  symptoms: {
    stomach_pain: boolean
    heartburn: boolean
    nausea: boolean
    vomiting: boolean
    bloating: boolean
    gas: boolean
    diarrhea: boolean
    constipation: boolean
    loss_of_appetite: boolean
    early_satiety: boolean
    regurgitation: boolean
    chest_pain: boolean
    difficulty_swallowing: boolean
    chronic_cough: boolean
    belching: boolean
  }
  mealSize?: "Small" | "Medium" | "Large"
  mealTiming?: "Breakfast" | "Lunch" | "Dinner" | "Snack"
  sleepQuality?: number // 0-10
  exercise?: number // 0-10
  weather?: "Clear" | "Cloudy" | "Rainy" | "Stormy" | "Hot" | "Cold"
  notes?: string
}

function loadLogs(): GastroLog[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveLogs(list: GastroLog[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function nowLocalISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function effectivenessByRemedy(logs: GastroLog[]) {
  // Very lightweight approximation of the described algorithm
  const groups = new Map<string, number[]>()
  for (const l of logs) {
    if (!l.remedy) continue
    if (!groups.has(l.remedy)) groups.set(l.remedy, [])
    groups.get(l.remedy)!.push(l.pain)
  }
  const out: { remedy: string; effectiveness: number; uses: number }[] = []
  for (const [remedy, pains] of groups.entries()) {
    if (pains.length < 1) continue
    const mean = pains.reduce((a, b) => a + b, 0) / pains.length
    const std = Math.sqrt(pains.reduce((s, x) => s + (x - mean) ** 2, 0) / pains.length)
    // pain reduction calc (10 - weighted_pain)/10, with simple time boost for recent entries
    const base = (10 - mean) / 10
    const consistency = 1 - Math.min(1, std / 10)
    const effectiveness = base * (0.7 + 0.3 * consistency)
    out.push({ remedy, effectiveness, uses: pains.length })
  }
  return out.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 5)
}

export default function GastroPage() {
  const [logs, setLogs] = React.useState<GastroLog[]>([])

  // Form state
  const [datetime, setDatetime] = React.useState(nowLocalISO())
  const [meal, setMeal] = React.useState("")
  const [pain, setPain] = React.useState(0)
  const [stress, setStress] = React.useState(0)
  const [remedy, setRemedy] = React.useState("")
  const [condition, setCondition] = React.useState<GastroLog["condition"]>("gastritis")
  const [symptoms, setSymptoms] = React.useState<GastroLog["symptoms"]>({
    stomach_pain: false,
    heartburn: false,
    nausea: false,
    vomiting: false,
    bloating: false,
    gas: false,
    diarrhea: false,
    constipation: false,
    loss_of_appetite: false,
    early_satiety: false,
    regurgitation: false,
    chest_pain: false,
    difficulty_swallowing: false,
    chronic_cough: false,
    belching: false,
  })
  const [mealSize, setMealSize] = React.useState<GastroLog["mealSize"]>()
  const [mealTiming, setMealTiming] = React.useState<GastroLog["mealTiming"]>()
  const [sleepQuality, setSleepQuality] = React.useState<number>(5)
  const [exercise, setExercise] = React.useState<number>(3)
  const [weather, setWeather] = React.useState<GastroLog["weather"]>("Clear")
  const [notes, setNotes] = React.useState("")

  React.useEffect(() => {
    setLogs(loadLogs())
  }, [])

  function saveLog() {
    const id = `${datetime}-${meal || "meal"}`
    const rec: GastroLog = {
      id,
      datetime,
      meal,
      pain: Math.max(0, Math.min(10, Number(pain))),
      stress: Math.max(0, Math.min(10, Number(stress))),
      remedy: remedy || undefined,
      condition,
      symptoms,
      mealSize,
      mealTiming,
      sleepQuality,
      exercise,
      weather,
      notes: notes || undefined,
    }
    const next = [rec, ...logs.filter((l) => l.id !== id)].slice(0, 1000)
    setLogs(next)
    saveLogs(next)
  }

  const series = React.useMemo(() => {
    return logs
      .slice()
      .sort((a, b) => a.datetime.localeCompare(b.datetime))
      .map((l) => ({ time: l.datetime.slice(0, 16).replace("T", " "), pain: l.pain, stress: l.stress }))
  }, [logs])

  const topRemedies = React.useMemo(() => effectivenessByRemedy(logs), [logs])

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">GastroGuard Enhanced</h1>
          <p className="text-muted-foreground">Meal logging, symptoms, and remedy insights</p>
        </div>
        <Button onClick={saveLog}>Save Log</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Logging</CardTitle>
            <CardDescription>Meal and timing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Meal/Food</Label>
              <Input value={meal} onChange={(e) => setMeal(e.target.value)} placeholder="e.g., pasta, spicy curry" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Pain (0-10)</Label><Input type="number" min={0} max={10} value={pain} onChange={(e) => setPain(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Stress (0-10)</Label><Input type="number" min={0} max={10} value={stress} onChange={(e) => setStress(Number(e.target.value))} /></div>
            </div>
            <div className="space-y-1">
              <Label>Remedy used</Label>
              <Input value={remedy} onChange={(e) => setRemedy(e.target.value)} placeholder="e.g., antacid, ginger tea" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enhanced Tracking</CardTitle>
            <CardDescription>Condition, symptoms, context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as GastroLog["condition"])}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gastritis">Gastritis</SelectItem>
                  <SelectItem value="GERD">GERD</SelectItem>
                  <SelectItem value="IBS">IBS</SelectItem>
                  <SelectItem value="dyspepsia">Dyspepsia</SelectItem>
                  <SelectItem value="food_sensitivity">Food Sensitivity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(symptoms).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 text-xs">
                  <Switch checked={v} onCheckedChange={(c) => setSymptoms((s) => ({ ...s, [k]: c }))} />
                  {k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Meal size</Label>
                <Select value={mealSize} onValueChange={(v) => setMealSize(v as GastroLog["mealSize"])}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small">Small</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Meal timing</Label>
                <Select value={mealTiming} onValueChange={(v) => setMealTiming(v as GastroLog["mealTiming"])}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select timing" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Sleep quality (0-10)</Label><Input type="number" min={0} max={10} value={sleepQuality} onChange={(e) => setSleepQuality(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Exercise (0-10)</Label><Input type="number" min={0} max={10} value={exercise} onChange={(e) => setExercise(Number(e.target.value))} /></div>
            </div>
            <div className="space-y-1">
              <Label>Weather</Label>
              <Select value={weather} onValueChange={(v) => setWeather(v as GastroLog["weather"])}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select weather" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clear">Clear</SelectItem>
                  <SelectItem value="Cloudy">Cloudy</SelectItem>
                  <SelectItem value="Rainy">Rainy</SelectItem>
                  <SelectItem value="Stormy">Stormy</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything notable" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remedy Insights</CardTitle>
            <CardDescription>Estimated effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            {topRemedies.length === 0 ? (
              <p className="text-muted-foreground text-sm">Log meals and remedies to see insights.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {topRemedies.map((r) => (
                  <li key={r.remedy} className="flex items-center justify-between">
                    <span className="truncate mr-2">{r.remedy}</span>
                    <span className="text-muted-foreground">{(r.effectiveness * 100).toFixed(0)}% · {r.uses} uses</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Pain & Stress Timeline</CardTitle>
            <CardDescription>Across your logs</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[240px]" config={{ pain: { label: "Pain", color: "var(--chart-1)" }, stress: { label: "Stress", color: "var(--chart-4)" } }}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="pain" stroke="var(--color-pain)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stress" stroke="var(--color-stress)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}