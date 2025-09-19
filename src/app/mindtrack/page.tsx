"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ProfileMenu } from "@/components/profile-menu"
import { toast } from "sonner"

// MindTrack - local storage + lightweight analytics
const PROFILE_KEY = "orchids.profile.v1"
const ENTRIES_KEY = "orchids.mindtrack.entries.v1"
const CHAT_KEY = "orchids.mindtrack.chat.v1"

// Types
type Profile = {
  name?: string
  age?: number
  gender?: "male" | "female" | "non-binary" | "other"
  emergencyContact?: string
  conditions: string[]
  recurring: string[]
  allergies?: string
}

type Entry = {
  date: string // yyyy-mm-dd
  dateTime?: string // ISO local datetime (retroactive)
  mood: number // 0-10
  energy: number // 0-10
  stress: number // 0-10
  sleepHours: number // 0-24
  body?: {
    region: string
    symptom: string
    intensity: number
    duration: string
    notes?: string
  }
}

type ChatMessage = { role: "user" | "assistant"; text: string; time: string }

function loadProfile(): Profile {
  if (typeof window === "undefined") return { conditions: [], recurring: [] }
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : { conditions: [], recurring: [] }
  } catch {
    return { conditions: [], recurring: [] }
  }
}

function saveProfile(p: Profile) {
  if (typeof window === "undefined") return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
}

function loadEntries(): Entry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveEntries(list: Entry[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(list))
}

function loadChat(): ChatMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveChat(list: ChatMessage[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(CHAT_KEY, JSON.stringify(list))
}

function todayISO() {
  const d = new Date()
  const iso = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  return iso.toISOString().slice(0, 10)
}

export default function MindTrackPage() {
  // Profile
  const [profile, setProfile] = React.useState<Profile>(() => loadProfile())

  // Entry form
  const [date, setDate] = React.useState(todayISO())
  const [dateTime, setDateTime] = React.useState<string>(() => {
    const d = new Date();
    const pad = (n:number)=>String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [mood, setMood] = React.useState(5)
  const [energy, setEnergy] = React.useState(5)
  const [stress, setStress] = React.useState(5)
  const [sleepHours, setSleepHours] = React.useState(7)
  const [region, setRegion] = React.useState("head")
  const [symptom, setSymptom] = React.useState("pain")
  const [intensity, setIntensity] = React.useState(5)
  const [duration, setDuration] = React.useState("few hours")
  const [bodyNotes, setBodyNotes] = React.useState("")

  // Entries + chat
  const [entries, setEntries] = React.useState<Entry[]>([])
  const [chat, setChat] = React.useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = React.useState("")

  React.useEffect(() => {
    setEntries(loadEntries())
    setChat(loadChat())
  }, [])

  // Auto-prefill from shared profile (conditions/recurring symptoms)
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("orchids.profile.v1")
      if (!raw) return
      const prof = JSON.parse(raw || "{}") || {}
      // Prefill symptom from recurring list if current is generic
      const rec: string[] = Array.isArray(prof.recurring)
        ? prof.recurring
        : (typeof prof.recurring === "string" ? prof.recurring.split(/[\,\n]/).map((s:string)=>s.trim()).filter(Boolean) : [])
      if (rec.length && (symptom === "pain" || symptom === "other" || !symptom)) {
        setSymptom(String(rec[0]).toLowerCase())
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // remove separate profile save; Profile is managed via shared ProfileMenu

  function saveEntry() {
    const e: Entry = {
      date: (dateTime ? dateTime.slice(0,10) : date),
      dateTime: dateTime || undefined,
      mood: clamp(mood, 0, 10),
      energy: clamp(energy, 0, 10),
      stress: clamp(stress, 0, 10),
      sleepHours: clamp(sleepHours, 0, 24),
      body: {
        region,
        symptom,
        intensity: clamp(intensity, 1, 10),
        duration,
        notes: bodyNotes || undefined,
      },
    }
    const next = [e, ...entries.filter((x) => !(x.date === e.date))].sort((a, b) => a.date.localeCompare(b.date))
    setEntries(next)
    saveEntries(next)
    toast.success("Mind entry saved")
  }

  function askAssistant() {
    if (!chatInput.trim()) return
    const now = new Date().toISOString()
    const next: ChatMessage[] = [...chat, { role: "user", text: chatInput.trim(), time: now }]
    const reply = respond(chatInput.trim(), profile, entries)
    next.push({ role: "assistant", text: reply, time: new Date().toISOString() })
    setChat(next)
    saveChat(next)
    setChatInput("")
  }

  // exports
  function escapeCSV(v: string) { return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v }
  function triggerDownload(url: string, filename: string) { const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) }
  function exportCSVLocal() {
    const headers = [
      "date","dateTime","mood","energy","stress","sleepHours","region","symptom","intensity","duration","notes"
    ]
    const rows = entries.map(e => [
      e.date,
      e.dateTime || "",
      String(e.mood),
      String(e.energy),
      String(e.stress),
      String(e.sleepHours),
      e.body?.region || "",
      e.body?.symptom || "",
      e.body?.intensity ?? "",
      e.body?.duration || "",
      escapeCSV(e.body?.notes || ""),
    ])
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, `mindtrack-${new Date().toISOString().slice(0,10)}.csv`)
  }
  async function exportPDFLocal() {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 14
    doc.setFontSize(16); doc.text("MindTrack Report", pageWidth/2, y, { align: "center" }); y += 10
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y); y += 8

    doc.setFont(undefined, "bold"); doc.text("Profile", 14, y); doc.setFont(undefined, "normal"); y += 6
    const profileLine = `Name: ${profile.name || '-'} • Age: ${profile.age ?? '-'} • Gender: ${profile.gender || '-'}`
    doc.text(doc.splitTextToSize(profileLine, pageWidth - 28), 14, y); y += 6

    doc.setFont(undefined, "bold"); doc.text("Recent Entries", 14, y); doc.setFont(undefined, "normal"); y += 6
    const recent = entries.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-12)
    for (const e of recent) {
      if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 14 }
      const line = `${e.date} • mood ${e.mood}/10 • energy ${e.energy}/10 • stress ${e.stress}/10 • sleep ${e.sleepHours}h`
      const wrapped = doc.splitTextToSize(line, pageWidth - 28)
      doc.text(wrapped, 14, y); y += wrapped.length * 6
    }

    doc.save(`mindtrack-report-${new Date().toISOString().slice(0,10)}.pdf`)
  }

  const series = React.useMemo(() => {
    return entries
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({ date: e.date, mood: e.mood, energy: e.energy, stress: e.stress, sleep: e.sleepHours }))
  }, [entries])

  const counters = React.useMemo(() => {
    const last7 = entries.filter((e) => new Date(e.date) >= addDays(-6))
    const total = entries.length
    const streak = calcStreak(entries)
    const avgSleep = avg(entries.map((e) => e.sleepHours))
    return { total, last7: last7.length, streak, avgSleep }
  }, [entries])

  const recentSymptoms = React.useMemo(() => entries.slice(-5).reverse(), [entries])

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">MindTrack</h1>
          <p className="text-muted-foreground">Profile, symptoms, routines, and a lightweight chat assistant</p>
        </div>
        <div className="flex gap-2">
          <ProfileMenu />
          <Button variant="outline" className="border-pink-300 text-pink-700 hover:bg-pink-50" onClick={exportCSVLocal}>Export CSV</Button>
          <Button className="bg-pink-200 text-pink-900 hover:bg-pink-300" onClick={exportPDFLocal}>Export PDF</Button>
          <Button className="bg-pink-100 text-pink-700 hover:bg-pink-200" onClick={saveEntry}>Save Entry</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Removed duplicate Profile card; profile is managed via shared ProfileMenu */}
        
        <Card>
          <CardHeader>
            <CardTitle>Interactive Body Map</CardTitle>
            <CardDescription>Tap a region to prefill selection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => setRegion("head")}>Head</Button>
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => setRegion("neck")}>Neck</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => setRegion("shoulders")}>Shoulders</Button>
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => setRegion("arms")}>Arms</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => setRegion("chest")}>Chest</Button>
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => setRegion("stomach")}>Stomach</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => setRegion("back")}>Back</Button>
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => setRegion("legs")}>Legs</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => setRegion("feet")}>Feet</Button>
              <div className="text-muted-foreground self-center">Selected: <span className="font-medium text-foreground">{region}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Body Map Symptom</CardTitle>
            <CardDescription>Region, type, and intensity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Date & time</Label><Input type="datetime-local" value={dateTime} onChange={(e) => { setDateTime(e.target.value); setDate(e.target.value.slice(0,10)) }} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head">Head</SelectItem>
                    <SelectItem value="neck">Neck</SelectItem>
                    <SelectItem value="shoulders">Shoulders</SelectItem>
                    <SelectItem value="arms">Arms</SelectItem>
                    <SelectItem value="chest">Chest</SelectItem>
                    <SelectItem value="stomach">Stomach</SelectItem>
                    <SelectItem value="back">Back</SelectItem>
                    <SelectItem value="legs">Legs</SelectItem>
                    <SelectItem value="feet">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Symptom</Label>
                <Select value={symptom} onValueChange={setSymptom}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pain">Pain</SelectItem>
                    <SelectItem value="headache">Headache</SelectItem>
                    <SelectItem value="nausea">Nausea</SelectItem>
                    <SelectItem value="fatigue">Fatigue</SelectItem>
                    <SelectItem value="dizziness">Dizziness</SelectItem>
                    <SelectItem value="swelling">Swelling</SelectItem>
                    <SelectItem value="itching">Itching</SelectItem>
                    <SelectItem value="burning">Burning</SelectItem>
                    <SelectItem value="numbness">Numbness</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Intensity (1-10)</Label><Input type="number" min={1} max={10} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} /></div>
              <div className="space-y-1">
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select duration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="just started">Just started</SelectItem>
                    <SelectItem value="few minutes">Few minutes</SelectItem>
                    <SelectItem value="few hours">Few hours</SelectItem>
                    <SelectItem value="all day">All day</SelectItem>
                    <SelectItem value="few days">Few days</SelectItem>
                    <SelectItem value="week+">Week+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Input value={bodyNotes} onChange={(e) => setBodyNotes(e.target.value)} placeholder="Context, triggers, relief..." /></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Mood (0-10)</Label><Input type="number" min={0} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Energy (0-10)</Label><Input type="number" min={0} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Stress (0-10)</Label><Input type="number" min={0} max={10} value={stress} onChange={(e) => setStress(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Sleep hours</Label><Input type="number" min={0} max={24} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard Metrics</CardTitle>
            <CardDescription>This week & overall</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3"><div className="text-muted-foreground">Total entries</div><div className="text-xl font-semibold">{counters.total}</div></div>
              <div className="rounded-md border p-3"><div className="text-muted-foreground">This week</div><div className="text-xl font-semibold">{counters.last7}</div></div>
              <div className="rounded-md border p-3"><div className="text-muted-foreground">Current streak</div><div className="text-xl font-semibold">{counters.streak}d</div></div>
              <div className="rounded-md border p-3"><div className="text-muted-foreground">Avg sleep</div><div className="text-xl font-semibold">{counters.avgSleep.toFixed(1)}h</div></div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Mood, energy, stress (last entries)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[240px]" config={{ mood: { label: "Mood", color: "var(--chart-3)" }, energy: { label: "Energy", color: "var(--chart-4)" }, stress: { label: "Stress", color: "var(--chart-5)" } }}>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="mood" stroke="var(--color-mood)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="energy" stroke="var(--color-energy)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stress" stroke="var(--color-stress)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Symptoms</CardTitle>
            <CardDescription>Last 5 entries</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSymptoms.length === 0 ? (
              <p className="text-muted-foreground text-sm">No entries yet. Add one above and Save Entry.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentSymptoms.map((e) => (
                  <li key={e.date} className="rounded border p-2">
                    <div className="flex items-center justify-between"><span className="font-medium">{e.date}</span><span className="text-muted-foreground">mood {e.mood} / stress {e.stress}</span></div>
                    {e.body ? (
                      <div className="text-muted-foreground">{e.body.region} · {e.body.symptom} · {e.body.intensity}/10 {e.body.duration} {e.body.notes ? `· ${e.body.notes}` : ""}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Assistant</CardTitle>
            <CardDescription>Keyword-based guidance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-60 overflow-auto rounded border p-2 text-sm space-y-2 bg-secondary/30">
              {chat.length === 0 ? (
                <p className="text-muted-foreground">Ask about mood, sleep, stress, or medication reminders.</p>
              ) : (
                chat.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                    <span className={m.role === "user" ? "inline-block rounded bg-primary text-primary-foreground px-2 py-1" : "inline-block rounded bg-secondary px-2 py-1"}>{m.text}</span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask a question..." />
              <Button onClick={askAssistant}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helpers
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function splitCsv(s: string) { return s.split(",").map((x) => x.trim()).filter(Boolean) }
function avg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }
function addDays(delta: number) { const d = new Date(); d.setDate(d.getDate() + delta); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
function calcStreak(entries: Entry[]) {
  if (entries.length === 0) return 0
  const days = new Set(entries.map((e) => e.date))
  let streak = 0
  let day = new Date()
  for (;;) {
    const iso = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())).toISOString().slice(0, 10)
    if (days.has(iso)) { streak++; day.setDate(day.getDate() - 1) } else { break }
  }
  return streak
}

function respond(q: string, profile: Profile, entries: Entry[]): string {
  const t = q.toLowerCase()
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
  const lastN = (n: number) => entries.slice(-n)
  const moodAvg7 = avg(lastN(7).map((e) => e.mood))
  const sleepAvg7 = avg(lastN(7).map((e) => e.sleepHours))
  const stressAvg7 = avg(lastN(7).map((e) => e.stress))
  const recent = entries.slice(-2)
  const stressTrend = recent.length === 2 ? recent[1].stress - recent[0].stress : 0

  if (t.includes("sleep")) {
    return `Past week sleep avg: ${sleepAvg7.toFixed(1)}h. Aim for a consistent wind-down, limit caffeine after 2pm, and keep devices out of bed.`
  }
  if (t.includes("stress")) {
    const trendTxt = stressTrend > 0.5 ? "rising" : stressTrend < -0.5 ? "falling" : "stable"
    return `Stress is ${trendTxt}; 7‑day avg: ${stressAvg7.toFixed(1)}/10. Try 4‑7‑8 breathing for 2 minutes and a short walk after meals.`
  }
  if (t.includes("mood")) {
    return `Your 7‑day mood average is ${moodAvg7.toFixed(1)}/10. Improve by aligning sleep (${sleepAvg7.toFixed(1)}h avg) and light exercise on low‑energy days.`
  }
  if (t.includes("medication") || t.includes("reminder")) {
    return "Set reminders aligned to your routine (morning/afternoon/evening). Log any side effects in notes to spot patterns over time.";
  }
  if (profile.conditions.length) {
    return `Consider your profile conditions (${profile.conditions.join(", ")}). Pace activities and prioritize recovery on high‑stress days (${stressAvg7.toFixed(1)}/10 avg).`
  }
  return `Ask about mood, sleep, or stress. Tip: last 7 days — mood ${moodAvg7.toFixed(1)}, sleep ${sleepAvg7.toFixed(1)}h, stress ${stressAvg7.toFixed(1)}/10.`
}