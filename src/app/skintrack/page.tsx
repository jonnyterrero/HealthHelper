"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

// Simple local storage helpers for SkinTrack+
const STORAGE_KEY = "orchids.skintrack.lesions.v1"

type LesionRecord = {
  id: string
  label: string
  condition: string
  date: string // ISO date
  metrics?: {
    area?: number
    redness?: number
    borderIrregularity?: number
    asymmetry?: number
    deltaE?: number
  }
  imageDataUrl?: string
  notes?: string
}

function loadLesions(): LesionRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveLesions(list: LesionRecord[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function simulateArea(
  startArea: number,
  days: number,
  baseDecay: number,
  medPotency: number,
  adherence: number,
  stressLevel: number,
  sleepHours: number,
  triggerLoad: number
) {
  const out: { day: number; area: number }[] = []
  let area = Math.max(0, startArea)
  for (let t = 0; t <= days; t++) {
    out.push({ day: t, area: Number(area.toFixed(3)) })
    // area_{t+1} = area_t * (1 - base_decay - med_potency*adherence + 0.005*(stress-3) + 0.006*(7-sleep) + 0.01*trigger)
    const delta = 1 - baseDecay - medPotency * adherence + 0.005 * (stressLevel - 3) + 0.006 * (7 - sleepHours) + 0.01 * triggerLoad
    area = Math.max(0, area * delta)
  }
  return out
}

export default function SkinTrackPage() {
  const [lesions, setLesions] = React.useState<LesionRecord[]>([])
  const [today, setToday] = React.useState(() => new Date().toISOString().slice(0, 10))

  // Lesion management
  const [label, setLabel] = React.useState("left forearm A")
  const [condition, setCondition] = React.useState<string>("eczema")

  // Image inputs (placeholders; no CV processing here)
  const [useAruco, setUseAruco] = React.useState(false)
  const [markerCm, setMarkerCm] = React.useState(2.0)
  const [imageDataUrl, setImageDataUrl] = React.useState<string | undefined>()

  // Symptoms
  const [itch, setItch] = React.useState(0)
  const [pain, setPain] = React.useState(0)
  const [sleepHours, setSleepHours] = React.useState(7)
  const [stress, setStress] = React.useState(5)
  const [adherenceToday, setAdherenceToday] = React.useState(false)
  const [triggers, setTriggers] = React.useState({
    stress: false,
    exercise: false,
    fragrance: false,
    detergent: false,
    cosmetics: false,
    weather: false,
    pollen: false,
    dustMites: false,
    petDander: false,
    newProducts: false,
  })
  const [newProductsUsed, setNewProductsUsed] = React.useState("")
  const [medsTaken, setMedsTaken] = React.useState("")
  const [notes, setNotes] = React.useState("")

  // Medication schedule
  const [medName, setMedName] = React.useState("triamcinolone 0.1%")
  const [dose, setDose] = React.useState("thin layer BID")
  const [timing, setTiming] = React.useState({ morning: true, afternoon: false, evening: true })

  // Simulation params
  const [days, setDays] = React.useState(30)
  const [baseDecay, setBaseDecay] = React.useState(0.01)
  const [medPotency, setMedPotency] = React.useState(0.03)
  const [adherence, setAdherence] = React.useState(0.8)
  const [triggerLoad, setTriggerLoad] = React.useState(3)
  const [startArea, setStartArea] = React.useState(6.0)

  React.useEffect(() => {
    setLesions(loadLesions())
  }, [])

  const simSeries = React.useMemo(
    () =>
      simulateArea(
        startArea,
        Math.max(1, Math.min(90, days)),
        Math.max(0, Math.min(0.05, baseDecay)),
        Math.max(0, Math.min(0.1, medPotency)),
        Math.max(0, Math.min(1, adherence)),
        Math.max(0, Math.min(10, stress)),
        Math.max(0, Math.min(12, sleepHours)),
        Math.max(0, Math.min(10, triggerLoad))
      ),
    [startArea, days, baseDecay, medPotency, adherence, stress, sleepHours, triggerLoad]
  )

  function saveRecord() {
    const rec: LesionRecord = {
      id: `${today}-${label}`,
      label,
      condition,
      date: today,
      imageDataUrl,
      notes,
      metrics: {
        area: startArea,
        redness: undefined,
        borderIrregularity: undefined,
        asymmetry: undefined,
        deltaE: undefined,
      },
    }
    const next = [rec, ...lesions.filter((l) => l.id !== rec.id)].slice(0, 200)
    setLesions(next)
    saveLesions(next)
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const recent = lesions
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">SkinTrack+ (Lesion & Imaging)</h1>
          <p className="text-muted-foreground">Capture images, track symptoms, and simulate healing</p>
        </div>
        <Button onClick={saveRecord}>Save Record</Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Lesion</CardTitle>
            <CardDescription>Label and condition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={today} onChange={(e) => setToday(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="left forearm A" />
            </div>
            <div className="space-y-1">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="eczema">Eczema</SelectItem>
                  <SelectItem value="psoriasis">Psoriasis</SelectItem>
                  <SelectItem value="guttate_psoriasis">Guttate Psoriasis</SelectItem>
                  <SelectItem value="keratosis_pilaris">Keratosis Pilaris</SelectItem>
                  <SelectItem value="cystic_acne">Cystic/Hormonal Acne</SelectItem>
                  <SelectItem value="melanoma">Melanoma</SelectItem>
                  <SelectItem value="vitiligo">Vitiligo</SelectItem>
                  <SelectItem value="contact_dermatitis">Contact Dermatitis</SelectItem>
                  <SelectItem value="cold_sores">Cold Sores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image</CardTitle>
            <CardDescription>Upload photo (JPG/PNG)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Photo</Label>
              <Input type="file" accept="image/*" onChange={onImageChange} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={useAruco} onCheckedChange={setUseAruco} />
              <span>ArUco marker (DICT_4X4_50)</span>
            </div>
            <div className="space-y-1">
              <Label>Marker side length (cm)</Label>
              <Input type="number" min={0.5} max={10} step={0.1} value={markerCm} onChange={(e) => setMarkerCm(Number(e.target.value))} />
            </div>
            {imageDataUrl && (
              <div className="rounded border overflow-hidden">
                {/* Preview only */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="Lesion" className="w-full h-48 object-cover" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Symptoms & Notes</CardTitle>
            <CardDescription>Daily context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Itch (0-10)</Label><Input type="number" min={0} max={10} value={itch} onChange={(e) => setItch(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Pain (0-10)</Label><Input type="number" min={0} max={10} value={pain} onChange={(e) => setPain(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Sleep (hrs)</Label><Input type="number" min={0} max={12} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Stress (0-10)</Label><Input type="number" min={0} max={10} value={stress} onChange={(e) => setStress(Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(triggers).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <Switch checked={v} onCheckedChange={(c) => setTriggers((t) => ({ ...t, [k]: c }))} />
                  {k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                </label>
              ))}
            </div>
            <Input placeholder="New products used" value={newProductsUsed} onChange={(e) => setNewProductsUsed(e.target.value)} />
            <Input placeholder="Medications taken" value={medsTaken} onChange={(e) => setMedsTaken(e.target.value)} />
            <label className="flex items-center gap-2 text-sm"><Switch checked={adherenceToday} onCheckedChange={setAdherenceToday} />Took meds as planned today</label>
            <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Medication Schedule</CardTitle>
            <CardDescription>Name, dose, timing</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Name</Label><Input value={medName} onChange={(e) => setMedName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Dose</Label><Input value={dose} onChange={(e) => setDose(e.target.value)} /></div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm"><Switch checked={timing.morning} onCheckedChange={(c) => setTiming((t) => ({ ...t, morning: c }))} />Morning</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={timing.afternoon} onCheckedChange={(c) => setTiming((t) => ({ ...t, afternoon: c }))} />Afternoon</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={timing.evening} onCheckedChange={(c) => setTiming((t) => ({ ...t, evening: c }))} />Evening</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simulation</CardTitle>
            <CardDescription>Discrete-time lesion area response</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Start area (cm²)</Label><Input type="number" min={0} step={0.1} value={startArea} onChange={(e) => setStartArea(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Days</Label><Input type="number" min={7} max={90} value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Natural healing rate</Label><Input type="number" min={0} max={0.05} step={0.001} value={baseDecay} onChange={(e) => setBaseDecay(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Medication potency</Label><Input type="number" min={0} max={0.1} step={0.001} value={medPotency} onChange={(e) => setMedPotency(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Adherence (0-1)</Label><Input type="number" min={0} max={1} step={0.05} value={adherence} onChange={(e) => setAdherence(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Trigger load (0-10)</Label><Input type="number" min={0} max={10} value={triggerLoad} onChange={(e) => setTriggerLoad(Number(e.target.value))} /></div>
            </div>
            <ChartContainer className="w-full h-[220px]" config={{ area: { label: "Area (cm²)", color: "var(--chart-5)" }}}>
              <LineChart data={simSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="area" stroke="var(--color-area)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Photos</CardTitle>
          <CardDescription>Last 5 saved records</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground">No records yet. Upload an image and Save Record.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {recent.map((r) => (
                <div key={r.id} className="rounded border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {r.imageDataUrl ? (
                    <img src={r.imageDataUrl} alt={r.label} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="h-28 flex items-center justify-center text-xs text-muted-foreground">No image</div>
                  )}
                  <div className="px-2 py-1 text-xs">
                    <div className="font-medium truncate">{r.label}</div>
                    <div className="text-muted-foreground">{r.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}