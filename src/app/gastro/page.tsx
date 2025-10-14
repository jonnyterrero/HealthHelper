"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts"
import { ProfileMenu } from "@/components/profile-menu"
import { toast } from "sonner"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatPanel, ChatMessage } from "@/components/chat/chat-panel"
import { generateGastroResponse } from "@/lib/chat/gastro-chat"

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

// Add gastritis simulator (adapted from MATLAB version)
function simulateGastritisSeries(stress: number, lastMealHours: number) {
  const k_s = 0.08
  const k_f = 0.1
  const k_h = 0.05
  const mealThreshold = 4
  const hunger = lastMealHours > mealThreshold ? 1 : 0
  const D = k_s * stress + k_f * hunger

  const dt = 0.5 // hours step
  const hours = 48
  let S = 0.4 // initial severity (0-1)
  const series: { t: number; S: number }[] = []
  for (let t = 0; t <= hours; t += dt) {
    series.push({ t, S: Math.max(0, Math.min(1, Number(S.toFixed(4)))) })
    const dSdt = D - k_h * (1 - S)
    S = S + dSdt * dt
  }
  const finalSeverity = series[series.length - 1]?.S ?? S
  return { series, finalSeverity }
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
  const [chat, setChat] = React.useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = React.useState("")

  // Form state
  const [datetime, setDatetime] = React.useState(nowLocalISO())
  const [meal, setMeal] = React.useState("")
  const [pain, setPain] = React.useState(0)
  const [stress, setStress] = React.useState(0)
  const [remedy, setRemedy] = React.useState("")
  const [noRemedy, setNoRemedy] = React.useState(false)
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

  // Simulator inputs
  const [simStress, setSimStress] = React.useState(5)
  const [simLastMealHrs, setSimLastMealHrs] = React.useState(5)

  // Filters
  const [range, setRange] = React.useState<"all" | "last7" | "last30" | "custom">("all")
  const [startDate, setStartDate] = React.useState<string>("")
  const [endDate, setEndDate] = React.useState<string>("")

  React.useEffect(() => {
    setLogs(loadLogs())
  }, [])

  // Prefill from shared profile (orchids.profile.v1)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("orchids.profile.v1")
      if (!raw) return
      const prof = JSON.parse(raw || "{}") || {}
      // Prefill remedy from medications if empty
      if (!remedy) {
        const meds: string[] = Array.isArray(prof.medications)
          ? prof.medications
          : (typeof prof.medications === "string" ? prof.medications.split(/[,\n]/).map((s:string)=>s.trim()).filter(Boolean) : [])
        if (meds.length) setRemedy((r) => r || meds[0])
      }
      // Prefill condition if profile conditions include a known option
      const conds: string[] = Array.isArray(prof.conditions)
        ? prof.conditions
        : (typeof prof.conditions === "string" ? prof.conditions.split(/[,\n]/).map((s:string)=>s.trim()).filter(Boolean) : [])
      const map: Record<string, GastroLog["condition"]> = {
        gastritis: "gastritis",
        gerd: "GERD",
        ibs: "IBS",
        dyspepsia: "dyspepsia",
        "food sensitivity": "food_sensitivity",
        foodsensitivity: "food_sensitivity",
      }
      for (const c of conds) {
        const k = String(c).toLowerCase().replace(/[^a-z]/g, "")
        if (map[k as keyof typeof map]) { setCondition(map[k as keyof typeof map]); break }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // exports
  function escapeCSV(v: string) { return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v }
  function triggerDownload(url: string, filename: string) { const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) }
  function exportCSVLocal() {
    const headers = [
      "datetime","meal","pain","stress","remedy","condition","mealSize","mealTiming","sleepQuality","exercise","weather","symptoms","notes"
    ]
    const rows = logs.map(l => [
      l.datetime,
      escapeCSV(l.meal || ""),
      String(l.pain),
      String(l.stress),
      escapeCSV(l.remedy || ""),
      l.condition || "",
      l.mealSize || "",
      l.mealTiming || "",
      l.sleepQuality ?? "",
      l.exercise ?? "",
      l.weather || "",
      escapeCSV(Object.entries(l.symptoms).filter(([,v])=>v).map(([k])=>k).join("; ")),
      escapeCSV(l.notes || ""),
    ])
    const csv = [headers.join(","), ...rows.map(r=>r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, `gastro-${new Date().toISOString().slice(0,10)}.csv`)
  }
  async function exportPDFLocal() {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 14
    doc.setFontSize(16); doc.text("GastroGuard Report", pageWidth/2, y, { align: "center" }); y += 10
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y); y += 8

    doc.setFont("helvetica", "bold"); doc.text("Top Remedies", 14, y); doc.setFont("helvetica", "normal"); y += 6
    const tops = effectivenessByRemedy(logs)
    if (tops.length === 0) { doc.text("No remedy data yet.", 14, y); y += 8 } else {
      for (const r of tops) { doc.text(`${r.remedy}: ${(r.effectiveness*100).toFixed(0)}% (${r.uses} uses)`, 14, y); y += 6 }
    }

    doc.setFont("helvetica", "bold"); y += 4; doc.text("Recent Logs", 14, y); doc.setFont("helvetica", "normal"); y += 6
    const recent = logs.slice().sort((a,b)=>a.datetime.localeCompare(b.datetime)).slice(-12)
    for (const l of recent) {
      if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 14 }
      const line = `${l.datetime.replace('T',' ')} • pain ${l.pain}/10 • stress ${l.stress}/10 • ${l.meal || ''}`
      const wrapped = doc.splitTextToSize(line, pageWidth - 28)
      doc.text(wrapped, 14, y); y += wrapped.length * 6
    }

    doc.save(`gastro-report-${new Date().toISOString().slice(0,10)}.pdf`)
  }

  function saveLog() {
    const id = `${datetime}-${meal || "meal"}`
    const rec: GastroLog = {
      id,
      datetime,
      meal,
      pain: Math.max(0, Math.min(10, Number(pain))),
      stress: Math.max(0, Math.min(10, Number(stress))),
      remedy: noRemedy ? undefined : (remedy || undefined),
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
    toast.success("Gastro log saved")
  }

  // Derived filtered logs
  const filteredLogs = React.useMemo(() => {
    if (range === "all") return logs
    const now = new Date()
    let start: Date | null = null
    if (range === "last7") start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    if (range === "last30") start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
    if (range === "custom") {
      const s = startDate ? new Date(startDate) : null
      const e = endDate ? new Date(endDate) : null
      return logs.filter((l) => {
        const d = new Date(l.datetime)
        if (s && d < s) return false
        if (e && d > new Date(e.getTime() + 24*60*60*1000 - 1)) return false
        return true
      })
    }
    return logs.filter((l) => new Date(l.datetime) >= new Date(start!.getFullYear(), start!.getMonth(), start!.getDate()))
  }, [logs, range, startDate, endDate])

  const series = React.useMemo(() => {
    return filteredLogs
      .slice()
      .sort((a, b) => a.datetime.localeCompare(b.datetime))
      .map((l) => ({ time: l.datetime.slice(0, 16).replace("T", " "), pain: l.pain, stress: l.stress }))
  }, [filteredLogs])

  const topRemedies = React.useMemo(() => effectivenessByRemedy(filteredLogs), [filteredLogs])

  // Meal timing frequency (bar data)
  const mealTimingCounts = React.useMemo(() => {
    const keys: Array<NonNullable<GastroLog["mealTiming"]>> = ["Breakfast", "Lunch", "Dinner", "Snack"]
    const map = new Map<string, number>()
    keys.forEach(k => map.set(k, 0))
    filteredLogs.forEach(l => { if (l.mealTiming) map.set(l.mealTiming, (map.get(l.mealTiming) || 0) + 1) })
    return keys.map(k => ({ timing: k, count: map.get(k) || 0 }))
  }, [filteredLogs])

  // Smart suggestions (lightweight rules)
  const suggestions = React.useMemo(() => {
    const out: string[] = []
    if (filteredLogs.length === 0) return out
    const avgPain = filteredLogs.reduce((s, x) => s + x.pain, 0) / filteredLogs.length
    const avgStress = filteredLogs.reduce((s, x) => s + x.stress, 0) / filteredLogs.length
    if (avgPain >= 6) out.push("High average pain detected — consider smaller meals and avoid late-night eating.")
    if (avgStress >= 6) out.push("Elevated stress correlates with pain for many — try brief breathing exercises before meals.")
    const commonMeal = (() => {
      const map = new Map<string, number>()
      filteredLogs.forEach((l) => { const key = (l.meal || "").toLowerCase().trim(); if (!key) return; map.set(key, (map.get(key) || 0)+1) })
      let best = ""; let cnt = 0
      map.forEach((v,k)=>{ if(v>cnt){cnt=v;best=k} })
      return best
    })()
    if (commonMeal) out.push(`Frequently logged food: "${commonMeal}" — watch for trigger patterns.`)
    const conds = new Set(filteredLogs.map(l => l.condition).filter(Boolean) as string[])
    if (conds.size) out.push(`Condition context: ${Array.from(conds).join(", ")}. Tailor remedies to your condition.`)
    const timeOfDay = (() => {
      const hour = new Date().getHours()
      if (hour < 12) return "morning"
      if (hour < 18) return "afternoon"
      return "evening"
    })()
    if (timeOfDay === "evening") out.push("Evening tip: avoid large meals within 3 hours of sleep, elevate head if prone to reflux.")
    return out
  }, [filteredLogs])

  const { series: simSeries, finalSeverity } = React.useMemo(
    () => simulateGastritisSeries(Math.max(0, Math.min(10, simStress)), Math.max(0, Math.min(24, simLastMealHrs))),
    [simStress, simLastMealHrs]
  )

  function onSendChat() {
    const q = chatInput.trim()
    if (!q) return
    const base: ChatMessage[] = [...chat, { role: "user", text: q, time: new Date().toISOString() }]
    const placeholder: ChatMessage = { role: "assistant", text: "", time: new Date().toISOString() }
    setChat([...base, placeholder])
    setChatInput("")

    ;(async () => {
      try {
        const res = await fetch("/api/chat/gastro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: base.map(m => ({ role: m.role, content: m.text })),
            model: undefined,
            provider: undefined,
          }),
        })
        if (!res.ok || !res.body) throw new Error("no-stream")
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          setChat(prev => {
            const copy = [...prev]
            copy[copy.length - 1] = { ...copy[copy.length - 1], text: copy[copy.length - 1].text + decoder.decode(value, { stream: true }) }
            return copy
          })
        }
      } catch {
        // fallback to local responder
        const reply = generateGastroResponse(q)
        setChat(prev => [...base, { role: "assistant" as const, text: reply, time: new Date().toISOString() }])
      }
    })()
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">GastroGuard Enhanced</h1>
          <p className="text-muted-foreground">Meal logging, symptoms, and remedy insights</p>
        </div>
        <div className="flex gap-2">
          <ProfileMenu />
          <Button variant="outline" className="border-pink-300 text-pink-700 hover:bg-pink-50" onClick={exportCSVLocal}>Export CSV</Button>
          <Button className="bg-pink-200 text-pink-900 hover:bg-pink-300" onClick={exportPDFLocal}>Export PDF</Button>
          <Button className="bg-pink-100 text-pink-700 hover:bg-pink-200" onClick={saveLog}>Save Log</Button>
        </div>
      </header>

      {/* Mobile: Accordion for form sections */}
      <div className="md:hidden space-y-4">
        <Accordion type="multiple" defaultValue={["filters","basic","enhanced"]}>
          <AccordionItem value="filters">
            <AccordionTrigger>Time Filters</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label>Range</Label>
                  <Select value={range} onValueChange={(v) => setRange(v as any)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select range" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="last7">Last 7 Days</SelectItem>
                      <SelectItem value="last30">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {range === "custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1"><Label>Start</Label><Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} /></div>
                    <div className="space-y-1"><Label>End</Label><Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} /></div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="basic">
            <AccordionTrigger>Basic Logging</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label>Date & time</Label>
                  <Input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Meal/Food</Label>
                  <Input value={meal} onChange={(e) => setMeal(e.target.value)} placeholder="e.g., pasta, spicy curry" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>Pain (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(pain as any) ? "" : pain} onChange={(e) => setPain(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(pain as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
                  <div className="space-y-1"><Label>Stress (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(stress as any) ? "" : stress} onChange={(e) => setStress(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(stress as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label>Remedy used</Label>
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={noRemedy} onCheckedChange={(c)=>{ setNoRemedy(c); if(c) setRemedy("") }} />
                      No remedy used
                    </label>
                  </div>
                  <Input value={remedy} onChange={(e) => { setRemedy(e.target.value); if(noRemedy && e.target.value) setNoRemedy(false) }} placeholder="e.g., antacid, ginger tea" disabled={noRemedy} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="enhanced">
            <AccordionTrigger>Enhanced Tracking</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label>Condition</Label>
                  <Select value={condition} onValueChange={(v) => setCondition(v as GastroLog["condition"]) }>
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
                    <Select value={mealSize} onValueChange={(v) => setMealSize(v as GastroLog["mealSize"]) }>
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
                    <Select value={mealTiming} onValueChange={(v) => setMealTiming(v as GastroLog["mealTiming"]) }>
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
                  <div className="space-y-1"><Label>Sleep quality (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(sleepQuality as any) ? "" : sleepQuality} onChange={(e) => setSleepQuality(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(sleepQuality as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
                  <div className="space-y-1"><Label>Exercise (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(exercise as any) ? "" : exercise} onChange={(e) => setExercise(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(exercise as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
                </div>
                <div className="space-y-1">
                  <Label>Weather</Label>
                  <Select value={weather} onValueChange={(v) => setWeather(v as GastroLog["weather"]) }>
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
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sim">
            <AccordionTrigger>Gastritis Simulator</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Stress (0-10)</Label>
                    <Input type="number" min={0} max={10} step={1} value={simStress} onChange={(e)=>setSimStress(Math.max(0, Math.min(10, Number(e.target.value))))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Hours since last meal</Label>
                    <Input type="number" min={0} max={24} step={0.5} value={simLastMealHrs} onChange={(e)=>setSimLastMealHrs(Math.max(0, Math.min(24, Number(e.target.value))))} />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Mobile: Charts in Tabs */}
        <Tabs defaultValue="timeline" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="meals">Meals</TabsTrigger>
            <TabsTrigger value="remedies">Remedies</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline">
            <Card>
              <CardHeader><CardTitle className="text-base">Pain & Stress Timeline</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[220px]" config={{ pain: { label: "Pain", color: "var(--chart-1)" }, stress: { label: "Stress", color: "var(--chart-4)" } }}>
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
          </TabsContent>
          <TabsContent value="meals">
            <Card>
              <CardHeader><CardTitle className="text-base">Meal Timing Frequency</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[220px]" config={{ count: { label: "Count", color: "var(--chart-3)" } }}>
                  <BarChart data={mealTimingCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timing" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-mood)" radius={[6,6,0,0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="remedies">
            <Card>
              <CardHeader><CardTitle className="text-base">Remedy Effectiveness</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[220px]" config={{ effectiveness: { label: "Effectiveness %", color: "var(--chart-5)" } }}>
                  <BarChart data={topRemedies.map(r => ({ remedy: r.remedy, effectiveness: Math.round(r.effectiveness * 100) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="remedy" tick={{ fontSize: 12 }} interval={0} angle={-20} height={50} textAnchor="end" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="effectiveness" fill="var(--color-skin)" radius={[6,6,0,0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop grid: forms + charts */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Time Filters</CardTitle>
            <CardDescription>Refine analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Range</Label>
              <Select value={range} onValueChange={(v) => setRange(v as any)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="last7">Last 7 Days</SelectItem>
                  <SelectItem value="last30">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {range === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label>Start</Label><Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} /></div>
                <div className="space-y-1"><Label>End</Label><Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} /></div>
              </div>
            )}
          </CardContent>
        </Card>

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
              <div className="space-y-1"><Label>Pain (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(pain as any) ? "" : pain} onChange={(e) => setPain(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(pain as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
              <div className="space-y-1"><Label>Stress (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(stress as any) ? "" : stress} onChange={(e) => setStress(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(stress as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Remedy used</Label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={noRemedy} onCheckedChange={(c)=>{ setNoRemedy(c); if(c) setRemedy("") }} />
                  No remedy used
                </label>
              </div>
              <Input value={remedy} onChange={(e) => { setRemedy(e.target.value); if(noRemedy && e.target.value) setNoRemedy(false) }} placeholder="e.g., antacid, ginger tea" disabled={noRemedy} />
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
              <Select value={condition} onValueChange={(v) => setCondition(v as GastroLog["condition"]) }>
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
                <Select value={mealTiming} onValueChange={(v) => setMealTiming(v as GastroLog["mealTiming"]) }>
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
              <div className="space-y-1"><Label>Sleep quality (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(sleepQuality as any) ? "" : sleepQuality} onChange={(e) => setSleepQuality(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(sleepQuality as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
              <div className="space-y-1"><Label>Exercise (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(exercise as any) ? "" : exercise} onChange={(e) => setExercise(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(exercise as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
            </div>
            <div className="space-y-1">
              <Label>Weather</Label>
              <Select value={weather} onValueChange={(v) => setWeather(v as GastroLog["weather"]) }>
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

        {/* Gastritis Simulator */}
        <Card>
          <CardHeader>
            <CardTitle>Gastritis Simulator (48h)</CardTitle>
            <CardDescription>Based on stress and time since last meal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Stress (0-10)</Label>
                <Input type="number" min={0} max={10} step={1} value={simStress} onChange={(e)=>setSimStress(Math.max(0, Math.min(10, Number(e.target.value))))} />
              </div>
              <div className="space-y-1">
                <Label>Hours since last meal</Label>
                <Input type="number" min={0} max={24} step={0.5} value={simLastMealHrs} onChange={(e)=>setSimLastMealHrs(Math.max(0, Math.min(24, Number(e.target.value))))} />
              </div>
            </div>
            <ChartContainer className="w-full h-[220px]" config={{ severity: { label: "Severity (0–1)", color: "var(--chart-2)" } }}>
              <LineChart data={simSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tick={{ fontSize: 12 }} label={{ value: "hours", position: "insideBottomRight", offset: -4 }} />
                <YAxis domain={[0,1]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="S" stroke="var(--color-skin)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
            <p className="text-sm text-muted-foreground">Final predicted severity: <span className="font-medium text-foreground">{finalSeverity.toFixed(2)}</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Smart Suggestions</CardTitle>
            <CardDescription>Based on filtered data</CardDescription>
          </CardHeader>
          <CardContent>
            {suggestions.length === 0 ? (
              <p className="text-muted-foreground text-sm">Add logs to see tailored suggestions.</p>
            ) : (
              <ul className="text-sm space-y-1 list-disc pl-4">
                {suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* New: Meal Timing Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Meal Timing Frequency</CardTitle>
            <CardDescription>Distribution across filtered logs</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[220px]" config={{ count: { label: "Count", color: "var(--chart-3)" } }}>
              <BarChart data={mealTimingCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timing" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-mood)" radius={[6,6,0,0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* New: Remedy Effectiveness */}
        <Card>
          <CardHeader>
            <CardTitle>Remedy Effectiveness</CardTitle>
            <CardDescription>Top remedies by estimated effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[220px]" config={{ effectiveness: { label: "Effectiveness %", color: "var(--chart-5)" } }}>
              <BarChart data={topRemedies.map(r => ({ remedy: r.remedy, effectiveness: Math.round(r.effectiveness * 100) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="remedy" tick={{ fontSize: 12 }} interval={0} angle={-20} height={50} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="effectiveness" fill="var(--color-skin)" radius={[6,6,0,0]} />
              </BarChart>
            </ChartContainer>
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

        <ChatPanel
          title="GastroGuard AI Assistant"
          description="Ask about food triggers, pain, stress, or medications"
          messages={chat}
          input={chatInput}
          setInput={setChatInput}
          onSend={onSendChat}
          actions={
            <div className="flex flex-wrap gap-2 text-xs">
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => { setChatInput("Analyze my recent food intake and suggest improvements"); }}>🍽️ Food Analysis</Button>
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => { setChatInput("Help me with medication timing and side effects"); }}>💊 Medication Help</Button>
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => { setChatInput("Analyze my symptom patterns and suggest triggers"); }}>📊 Symptom Patterns</Button>
            </div>
          }
        />
      </div>
    </div>
  )
}