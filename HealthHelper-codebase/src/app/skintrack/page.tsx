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
import { CanvasRoi } from "@/components/canvas-rois"
import { ProfileMenu } from "@/components/profile-menu"
import { toast } from "sonner"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChatPanel, ChatMessage } from "@/components/chat/chat-panel"
import { generateSkinResponse } from "@/lib/chat/skin-chat"

// Simple local storage helpers for SkinTrack+
const STORAGE_KEY = "orchids.skintrack.lesions.v1"

type LesionRecord = {
  id: string
  label: string
  condition: string
  date: string // ISO date
  dateTime?: string // retroactive precise time
  metrics?: {
    area?: number // cm^2 if calibrated
    areaPx?: number
    redness?: number // R/G mean
    borderIrregularity?: number // perimeter^2/(4πA)
    asymmetry?: number // |A_left - A_right| / A_total
    deltaE?: number // CIEDE2000 lesion vs background
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
  const [dateTime, setDateTime] = React.useState<string>(() => {
    const d = new Date(); const pad=(n:number)=>String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [chat, setChat] = React.useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = React.useState("")

  // Lesion management
  const [label, setLabel] = React.useState("left forearm A")
  const [condition, setCondition] = React.useState<string>("eczema")

  // Image inputs (placeholders; no CV processing here)
  const [useAruco, setUseAruco] = React.useState(false)
  const [markerCm, setMarkerCm] = React.useState(2.0)
  const [pixelsPerCm, setPixelsPerCm] = React.useState<number | undefined>(undefined)
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
  // Segmentation (stubs)
  const [segMethod, setSegMethod] = React.useState<"kmeans" | "grabcut" | "unet">("kmeans")
  const [segResult, setSegResult] = React.useState<string>("")
  const [segMetrics, setSegMetrics] = React.useState<LesionRecord["metrics"] | undefined>(undefined)

  React.useEffect(() => {
    setLesions(loadLesions())
  }, [])

  // Prefill from shared profile
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("orchids.profile.v1")
      if (!raw) return
      const prof = JSON.parse(raw || "{}") || {}
      // condition from profile.conditions
      const conds: string[] = Array.isArray(prof.conditions)
        ? prof.conditions
        : (typeof prof.conditions === "string" ? prof.conditions.split(/[\,\n]/).map((s:string)=>s.trim()).filter(Boolean) : [])
      const map: Record<string, string> = {
        eczema: "eczema",
        psoriasis: "psoriasis",
        guttatepsoriasis: "guttate_psoriasis",
        keratosispilaris: "keratosis_pilaris",
        acne: "cystic_acne",
        cysticacne: "cystic_acne",
        melanoma: "melanoma",
        vitiligo: "vitiligo",
        dermatitis: "contact_dermatitis",
        contactdermatitis: "contact_dermatitis",
      }
      for (const c of conds) {
        const k = String(c).toLowerCase().replace(/[^a-z]/g, "")
        if (map[k]) { setCondition(map[k]); break }
      }
      // medication name
      const meds: string[] = Array.isArray(prof.medications)
        ? prof.medications
        : (typeof prof.medications === "string" ? prof.medications.split(/[\,\n]/).map((s:string)=>s.trim()).filter(Boolean) : [])
      if (meds.length) {
        setMedName((v) => v || meds[0])
        setMedsTaken((v) => v || meds[0])
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // exports
  function exportCSVLocal() {
    const headers = [
      "id","date","label","condition","area_cm2","area_px","redness","border_irregularity","asymmetry","deltaE","notes"
    ]
    const rows = lesions.map(l => [
      l.id,
      l.date,
      escape(l.label),
      l.condition,
      String(l.metrics?.area ?? ""),
      String(l.metrics?.areaPx ?? ""),
      String(l.metrics?.redness ?? ""),
      String(l.metrics?.borderIrregularity ?? ""),
      String(l.metrics?.asymmetry ?? ""),
      String(l.metrics?.deltaE ?? ""),
      escape(l.notes ?? ""),
    ])
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, `skintrack-${new Date().toISOString().slice(0,10)}.csv`)
  }
  async function exportPDFLocal() {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let y = 14
    doc.setFontSize(16)
    doc.text("SkinTrack+ Report", pageWidth/2, y, { align: "center" }); y += 10
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y); y += 8

    doc.setFont("helvetica", "bold");
    doc.text("Recent Records", 14, y); y += 6; doc.setFont("helvetica", "normal")
    const recent = lesions.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(-10)
    for (const r of recent) {
      if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 14 }
      const line = `${r.date} • ${r.label} • ${r.condition} • area: ${r.metrics?.area ?? "-"} cm²`
      const wrapped = doc.splitTextToSize(line, pageWidth - 28)
      doc.text(wrapped, 14, y); y += wrapped.length * 6
    }
    doc.save(`skintrack-report-${new Date().toISOString().slice(0,10)}.pdf`)
  }
  function escape(v: string) { return /[",\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v }
  function triggerDownload(url: string, filename: string) { const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url) }

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
      id: `${(dateTime || `${today}T00:00`).slice(0,16)}-${label}`,
      label,
      condition,
      date: (dateTime ? dateTime.slice(0,10) : today),
      dateTime: dateTime || undefined,
      imageDataUrl,
      notes,
      metrics: segMetrics ?? {
        area: undefined,
        areaPx: undefined,
        redness: undefined,
        borderIrregularity: undefined,
        asymmetry: undefined,
        deltaE: undefined,
      },
    }
    const next = [rec, ...lesions.filter((l) => l.id !== rec.id)].slice(0, 200)
    setLesions(next)
    saveLesions(next)
    toast.success("Skin record saved")
  }

  function onSendChat() {
    const q = chatInput.trim()
    if (!q) return
    const base: ChatMessage[] = [...chat, { role: "user", text: q, time: new Date().toISOString() }]
    const placeholder: ChatMessage = { role: "assistant", text: "", time: new Date().toISOString() }
    setChat([...base, placeholder])
    setChatInput("")

    ;(async () => {
      try {
        const res = await fetch("/api/chat/skin", {
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
        // Fallback to local rule-based responder
        const reply = generateSkinResponse(q)
        setChat([...base, { role: "assistant" as const, text: reply, time: new Date().toISOString() }])
      }
    })()
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

  // Build per-metric time series from saved lesions (by date)
  const metricSeries = React.useMemo(() => {
    const byDate = new Map<string, { date: string; area?: number; redness?: number; border?: number }>()
    const sorted = lesions.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)))
    for (const r of sorted) {
      const d = String(r.date)
      const prev = byDate.get(d) || { date: d }
      const m = r.metrics || {}
      const areaVal = typeof m.area === "number" ? m.area : (typeof m.areaPx === "number" ? m.areaPx : undefined)
      byDate.set(d, {
        date: d,
        area: areaVal ?? prev.area,
        redness: (typeof m.redness === "number" ? m.redness : prev.redness),
        border: (typeof m.borderIrregularity === "number" ? m.borderIrregularity : prev.border),
      })
    }
    return Array.from(byDate.values())
  }, [lesions])

  // --- Image processing utilities (client-side) ---
  function rgb2xyz(r:number,g:number,b:number){
    // sRGB to XYZ (D65)
    r/=255; g/=255; b/=255
    r = r<=0.04045? r/12.92 : Math.pow((r+0.055)/1.055,2.4)
    g = g<=0.04045? g/12.92 : Math.pow((g+0.055)/1.055,2.4)
    b = b<=0.04045? b/12.92 : Math.pow((b+0.055)/1.055,2.4)
    const x = r*0.4124 + g*0.3576 + b*0.1805
    const y = r*0.2126 + g*0.7152 + b*0.0722
    const z = r*0.0193 + g*0.1192 + b*0.9505
    return [x,y,z]
  }
  function xyz2lab(x:number,y:number,z:number){
    const Xn=0.95047, Yn=1, Zn=1.08883
    let fx = x/Xn, fy = y/Yn, fz = z/Zn
    const f=(t:number)=> t>Math.pow(6/29,3)? Math.cbrt(t) : (t/(3*Math.pow(6/29,2)) + 4/29)
    fx=f(fx); fy=f(fy); fz=f(fz)
    const L = 116*fy - 16
    const a = 500*(fx - fy)
    const b = 200*(fy - fz)
    return [L,a,b]
  }
  function rgb2lab(r:number,g:number,b:number){ const [x,y,z]=rgb2xyz(r,g,b); return xyz2lab(x,y,z) }
  function deltaE2000(lab1:number[], lab2:number[]){
    // Simplified CIEDE2000 (enough for relative contrast). Source: Sharma et al. 2005
    const [L1,a1,b1]=lab1,[L2,a2,b2]=lab2
    const avgLp=(L1+L2)/2
    const C1=Math.hypot(a1,b1), C2=Math.hypot(a2,b2), avgC=(C1+C2)/2
    const G=0.5*(1-Math.sqrt(Math.pow(avgC,7)/(Math.pow(avgC,7)+Math.pow(25,7))))
    const a1p=(1+G)*a1, a2p=(1+G)*a2
    const C1p=Math.hypot(a1p,b1), C2p=Math.hypot(a2p,b2)
    const avgCp=(C1p+C2p)/2
    const h1p=(Math.atan2(b1,a1p)+2*Math.PI)%(2*Math.PI)
    const h2p=(Math.atan2(b2,a2p)+2*Math.PI)%(2*Math.PI)
    const dLp=L2-L1
    const dCp=C2p-C1p
    let dhp=h2p-h1p; if(dhp>Math.PI) dhp-=2*Math.PI; if(dhp<-Math.PI) dhp+=2*Math.PI
    const dHp=2*Math.sqrt(C1p*C2p)*Math.sin(dhp/2)
    let avgHp=h1p+h2p; if(Math.abs(h1p-h2p)>Math.PI) avgHp += 2*Math.PI; avgHp/=2
    const T=1-0.17*Math.cos(avgHp- Math.PI/6)+0.24*Math.cos(2*avgHp)+0.32*Math.cos(3*avgHp+Math.PI/30)-0.20*Math.cos(4*avgHp-21*Math.PI/60)
    const Sl=1+0.015*Math.pow(avgLp-50,2)/Math.sqrt(20+Math.pow(avgLp-50,2))
    const Sc=1+0.045*avgCp
    const Sh=1+0.015*avgCp*T
    const Rt = -2*Math.sqrt(Math.pow(avgCp,7)/(Math.pow(avgCp,7)+Math.pow(25,7))) * Math.sin((60*Math.PI/180)*Math.exp(-Math.pow((avgHp*180/Math.PI-275)/25,2)))
    return Math.sqrt(Math.pow(dLp/Sl,2)+Math.pow(dCp/Sc,2)+Math.pow(dHp/Sh,2)+Rt*(dCp/Sc)*(dHp/Sh))
  }

  async function runSegmentation() {
    if (!imageDataUrl) { setSegResult("Upload an image first."); return }
    setSegResult("Processing...")

    const img = new Image()
    img.src = imageDataUrl
    await img.decode()

    const canvas = document.createElement('canvas')
    const w = (canvas.width = img.naturalWidth)
    const h = (canvas.height = img.naturalHeight)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, w, h)
    const px = data.data

    // Define center-circle ROI and surrounding ring for background
    const cx = Math.floor(w/2), cy = Math.floor(h/2)
    const r = Math.floor(Math.min(w,h)*0.3)
    const ringIn = Math.floor(r*1.15), ringOut = Math.floor(r*1.45)

    // Collect samples inside circle for KMeans
    const samples:number[] = [] // flattened RGB
    const coords:number[] = [] // x,y pairs for mask later
    for(let y=cy-r; y<=cy+r; y++){
      if(y<0||y>=h) continue
      for(let x=cx-r; x<=cx+r; x++){
        if(x<0||x>=w) continue
        const dx=x-cx, dy=y-cy
        if(dx*dx+dy*dy<=r*r){
          const i=(y*w+x)*4
          samples.push(px[i], px[i+1], px[i+2])
          coords.push(x,y)
        }
      }
    }
    if (samples.length<300) { setSegResult("Image too small; center ROI has insufficient pixels."); return }

    // KMeans (K=3) on RGB
    const K=3
    // init means by simple picks
    const means:number[][]=[]
    for(let k=0;k<K;k++){ const idx = Math.floor((k+1)*samples.length/(K*3))*3; means.push([samples[idx]||0,samples[idx+1]||0,samples[idx+2]||0]) }
    const assign = new Array(samples.length/3).fill(0)
    for(let iter=0; iter<8; iter++){
      // assign
      for(let i=0;i<samples.length;i+=3){
        let best=0, bestd=Infinity
        for(let k=0;k<K;k++){
          const dr=samples[i]-means[k][0], dg=samples[i+1]-means[k][1], db=samples[i+2]-means[k][2]
          const d=dr*dr+dg*dg+db*db
          if(d<bestd){bestd=d;best=k}
        }
        assign[i/3]=best
      }
      // update
      const sum = Array.from({length:K},()=>[0,0,0,0])
      for(let i=0, j=0;i<samples.length;i+=3, j++){
        const a=assign[j]; sum[a][0]+=samples[i]; sum[a][1]+=samples[i+1]; sum[a][2]+=samples[i+2]; sum[a][3]++
      }
      for(let k=0;k<K;k++){
        if(sum[k][3]>0){ means[k][0]=sum[k][0]/sum[k][3]; means[k][1]=sum[k][1]/sum[k][3]; means[k][2]=sum[k][2]/sum[k][3] }
      }
    }
    // choose lesion cluster by redness & darkness score
    const labMeans = means.map(m=>rgb2lab(m[0],m[1],m[2]))
    const scores = means.map((m,idx)=>{
      const R=m[0], G=m[1]; const rg = G>1? (R/G): 0
      const L = labMeans[idx][0]
      return 0.6*rg + 0.4*(1 - Math.min(100,Math.max(0,L))/100)
    })
    let lesionK=0, bestScore=-Infinity
    for(let k=0;k<K;k++){ if(scores[k]>bestScore){bestScore=scores[k]; lesionK=k} }

    // Build binary mask in circle
    const mask = new Uint8Array(coords.length/2)
    let mcount=0
    for(let i=0, j=0; i<samples.length; i+=3, j++){
      if(assign[i/3]===lesionK){ mask[j]=1; mcount++ } else { mask[j]=0 }
    }

    // Compute area (pixels) and perimeter via 4-neighborhood
    let perimeter=0
    const offsetIndex = (x:number,y:number)=> ( (y-(cy-r))*(2*r+1) + (x-(cx-r)) )
    for(let y=cy-r; y<=cy+r; y++){
      if(y<0||y>=h) continue
      for(let x=cx-r; x<=cx+r; x++){
        const dx=x-cx, dy=y-cy; if(dx*dx+dy*dy>r*r) continue
        const iMask = offsetIndex(x,y)
        if(mask[iMask]){
          // neighbor check
          const nbs=[[1,0],[-1,0],[0,1],[0,-1]]
          for(const [dxn,dyn] of nbs){
            const xn=x+dxn, yn=y+dyn
            if(xn<cx-r||xn>cx+r||yn<cy-r||yn>cy+r || ( (xn-cx)*(xn-cx)+(yn-cy)*(yn-cy) > r*r)) { perimeter++; continue }
            const jMask = offsetIndex(xn,yn)
            if(!mask[jMask]) perimeter++
          }
        }
      }
    }

    // Asymmetry by vertical split at center within circle
    let left=0,right=0
    for(let y=cy-r; y<=cy+r; y++){
      if(y<0||y>=h) continue
      for(let x=cx-r; x<=cx+r; x++){
        const dx=x-cx, dy=y-cy; if(dx*dx+dy*dy>r*r) continue
        const iMask = offsetIndex(x,y)
        if(mask[iMask]){ if(x<cx) left++; else right++; }
      }
    }
    const asym = mcount>0? Math.abs(left-right)/mcount : 0

    // Redness: mean R/G over mask (clip to [0,3])
    let sumRG=0, cntRG=0
    for(let t=0; t<coords.length; t+=2){
      const x=coords[t], y=coords[t+1]
      const iMask = (y-(cy-r))*(2*r+1) + (x-(cx-r))
      if(!mask[iMask]) continue
      const idx=(y*w+x)*4
      const R=px[idx], G=px[idx+1]
      if(G>0){ sumRG += R/G; cntRG++ }
    }
    const redness = cntRG? Math.min(3, sumRG/cntRG) : 0

    // Background Lab from ring annulus
    const bgLabs:number[] = []
    for(let y0=Math.max(0,cy-ringOut); y0<=Math.min(h-1,cy+ringOut); y0++){
      for(let x0=Math.max(0,cx-ringOut); x0<=Math.min(w-1,cx+ringOut); x0++){
        const dx=x0-cx, dy=y0-cy; const d2=dx*dx+dy*dy
        if(d2>=ringIn*ringIn && d2<=ringOut*ringOut){
          const ii=(y0*w+x0)*4; const R=px[ii], G=px[ii+1], B=px[ii+2]
          const lab=rgb2lab(R,G,B); bgLabs.push(lab[0],lab[1],lab[2])
        }
      }
    }
    const mean = (arr:number[], step:number, k:number)=>{
      let s=0,c=0; for(let i=k;i<arr.length;i+=step){ s+=arr[i]; c++ } return c? s/c : 0
    }
    const lesionLab = labMeans[lesionK]
    const bgLab:[number,number,number] = [ mean(bgLabs,3,0), mean(bgLabs,3,1), mean(bgLabs,3,2) ]
    const dE = deltaE2000(lesionLab, bgLab)

    // Border irregularity: perimeter^2/(4πA) >=1
    const irregularity = mcount>0? (perimeter*perimeter)/(4*Math.PI*mcount) : 0

    // Area in cm^2 if calibrated
    const areaPx = mcount
    const areaCm2 = pixelsPerCm && pixelsPerCm>0? (areaPx / (pixelsPerCm*pixelsPerCm)) : undefined

    const metrics: LesionRecord["metrics"] = {
      area: areaCm2,
      areaPx,
      redness: Number(redness.toFixed(3)),
      borderIrregularity: Number(irregularity.toFixed(3)),
      asymmetry: Number(asym.toFixed(3)),
      deltaE: Number(dE.toFixed(2)),
    }

    setSegMetrics(metrics)
    setSegResult(`K-Means done • area ${areaCm2? areaCm2.toFixed(2)+" cm²" : areaPx+" px"}, R/G ${metrics.redness}, border ${metrics.borderIrregularity}, asym ${metrics.asymmetry}, ΔE ${metrics.deltaE}`)
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">SkinTrack+ (Lesion & Imaging)</h1>
          <p className="text-muted-foreground">Capture images, track symptoms, and simulate healing</p>
        </div>
        <div className="flex gap-2">
          <ProfileMenu />
          <Button variant="outline" className="border-pink-300 text-pink-700 hover:bg-pink-50" onClick={exportCSVLocal}>Export CSV</Button>
          <Button className="bg-pink-200 text-pink-900 hover:bg-pink-300" onClick={exportPDFLocal}>Export PDF</Button>
          <Button className="bg-pink-100 text-pink-700 hover:bg-pink-200" onClick={saveRecord}>Save Record</Button>
        </div>
      </header>

      {/* Mobile: Accordion for form sections */}
      <div className="md:hidden space-y-4">
        <Accordion type="multiple" defaultValue={["lesion","image","canvas","meds","seg","sim"]}>
          <AccordionItem value="lesion">
            <AccordionTrigger>Lesion</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label>Date & time</Label>
                  <Input type="datetime-local" value={dateTime} onChange={(e)=>{ setDateTime(e.target.value); setToday(e.target.value.slice(0,10)) }} />
                </div>
                <div className="space-y-1"><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="left forearm A" /></div>
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
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="image">
            <AccordionTrigger>Image</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1"><Label>Photo</Label><Input type="file" accept="image/*" onChange={onImageChange} /></div>
                <div className="flex items-center gap-2 text-sm"><Switch checked={useAruco} onCheckedChange={setUseAruco} /><span>ArUco marker (DICT_4X4_50)</span></div>
                <div className="space-y-1"><Label>Marker side length (cm)</Label><Input type="number" min={0.5} max={10} step={0.1} value={markerCm} onChange={(e) => setMarkerCm(Math.max(0.5, Math.min(10, Number(e.target.value))))} /></div>
                <div className="space-y-1"><Label>Pixels per cm (optional)</Label><Input type="number" min={1} step={1} value={pixelsPerCm ?? ""} onChange={(e)=> setPixelsPerCm(e.target.value? Math.max(1, Number(e.target.value)) : undefined)} placeholder="e.g. 100" /></div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="canvas">
            <AccordionTrigger>Canvas (ROI tools)</AccordionTrigger>
            <AccordionContent>
              {imageDataUrl ? (
                <CanvasRoi imageDataUrl={imageDataUrl} onApplyCalibrated={(url)=>setImageDataUrl(url)} />
              ) : (
                <p className="text-sm text-muted-foreground">Upload an image to enable canvas tools.</p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="meds">
            <AccordionTrigger>Medication Schedule</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1"><Label>Name</Label><Input value={medName} onChange={(e) => setMedName(e.target.value)} /></div>
                <div className="space-y-1"><Label>Dose</Label><Input value={dose} onChange={(e) => setDose(e.target.value)} /></div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={timing.morning} onCheckedChange={(c) => setTiming((t) => ({ ...t, morning: c }))} />Morning</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={timing.afternoon} onCheckedChange={(c) => setTiming((t) => ({ ...t, afternoon: c }))} />Afternoon</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={timing.evening} onCheckedChange={(c) => setTiming((t) => ({ ...t, evening: c }))} />Evening</label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="seg">
            <AccordionTrigger>Segmentation</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label>Method</Label>
                  <Select value={segMethod} onValueChange={(v) => setSegMethod(v as any)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kmeans">K-Means (auto)</SelectItem>
                      <SelectItem value="grabcut">GrabCut (from box)</SelectItem>
                      <SelectItem value="unet">U-Net (if available)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={runSegmentation} disabled={!imageDataUrl || segMethod!=="kmeans"}>Run Segmentation</Button>
                {segResult && (<p className="text-sm text-muted-foreground">{segResult}</p>)}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sim">
            <AccordionTrigger>Simulation</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label>Start area (cm²)</Label><Input type="number" min={0} step={0.1} value={Number.isNaN(startArea as any) ? "" : startArea} onChange={(e) => setStartArea(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Number(e.target.value)))} />{Number.isNaN(startArea as any) && (<p className="text-xs text-muted-foreground">Please enter a number.</p>)}</div>
                  <div className="space-y-1"><Label>Days</Label><Input type="number" min={7} max={90} step={1} value={Number.isNaN(days as any) ? "" : days} onChange={(e) => setDays(e.target.value === "" ? (NaN as unknown as number) : Math.max(7, Math.min(90, Number(e.target.value))))} />{Number.isNaN(days as any) && (<p className="text-xs text-muted-foreground">Please enter a number.</p>)}</div>
                  <div className="space-y-1"><Label>Natural healing rate</Label><Input type="number" min={0} max={0.05} step={0.001} value={Number.isNaN(baseDecay as any) ? "" : baseDecay} onChange={(e) => setBaseDecay(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(0.05, Number(e.target.value))))} /></div>
                  <div className="space-y-1"><Label>Medication potency</Label><Input type="number" min={0} max={0.1} step={0.001} value={Number.isNaN(medPotency as any) ? "" : medPotency} onChange={(e) => setMedPotency(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(0.1, Number(e.target.value))))} /></div>
                  <div className="space-y-1"><Label>Adherence (0-1)</Label><Input type="number" min={0} max={1} step={0.05} value={Number.isNaN(adherence as any) ? "" : adherence} onChange={(e) => setAdherence(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(1, Number(e.target.value))))} /></div>
                  <div className="space-y-1"><Label>Trigger load (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(triggerLoad as any) ? "" : triggerLoad} onChange={(e) => setTriggerLoad(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(triggerLoad as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Mobile: Charts in Tabs */}
        <Tabs defaultValue="all" className="mt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="area">Area</TabsTrigger>
            <TabsTrigger value="redness">Redness</TabsTrigger>
            <TabsTrigger value="border">Border</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Lesion Area Trend</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[200px]" config={{ area: { label: "Area", color: "var(--chart-5)" } }}>
                  <LineChart data={metricSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="area" stroke="var(--color-area)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Redness Trend</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[200px]" config={{ redness: { label: "Redness (R/G)", color: "var(--chart-2)" } }}>
                  <LineChart data={metricSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="redness" stroke="var(--color-skin)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Border Irregularity Trend</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[200px]" config={{ border: { label: "Border", color: "var(--chart-1)" } }}>
                  <LineChart data={metricSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="border" stroke="var(--color-stomach)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="area">
            <Card>
              <CardHeader><CardTitle className="text-base">Lesion Area Trend</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[220px]" config={{ area: { label: "Area", color: "var(--chart-5)" } }}>
                  <LineChart data={metricSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="area" stroke="var(--color-area)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="redness">
            <Card>
              <CardHeader><CardTitle className="text-base">Redness Trend</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[220px]" config={{ redness: { label: "Redness (R/G)", color: "var(--chart-2)" } }}>
                  <LineChart data={metricSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="redness" stroke="var(--color-skin)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="border">
            <Card>
              <CardHeader><CardTitle className="text-base">Border Irregularity Trend</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer className="w-full h-[220px]" config={{ border: { label: "Border", color: "var(--chart-1)" } }}>
                  <LineChart data={metricSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="border" stroke="var(--color-stomach)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop grid remains as-is */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Lesion</CardTitle>
            <CardDescription>Label and condition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={dateTime} onChange={(e)=>{ setDateTime(e.target.value); setToday(e.target.value.slice(0,10)) }} />
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
              <Input type="number" min={0.5} max={10} step={0.1} value={markerCm} onChange={(e) => setMarkerCm(Math.max(0.5, Math.min(10, Number(e.target.value))))} />
            </div>
            <div className="space-y-1">
              <Label>Pixels per cm (optional)</Label>
              <Input type="number" min={1} step={1} value={pixelsPerCm ?? ""} onChange={(e)=> setPixelsPerCm(e.target.value? Math.max(1, Number(e.target.value)) : undefined)} placeholder="e.g. 100" />
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

        {/* Canvas ROI tools (color calibration / segmentation box) */}
        <Card>
          <CardHeader>
            <CardTitle>Canvas (ROI tools)</CardTitle>
            <CardDescription>Draw a rectangle on the image preview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* lightweight canvas impl */}
            {imageDataUrl ? (
              <CanvasRoi imageDataUrl={imageDataUrl} onApplyCalibrated={(url)=>setImageDataUrl(url)} />
            ) : (
              <p className="text-sm text-muted-foreground">Upload an image to enable canvas tools.</p>
            )}
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
            <CardTitle>Segmentation</CardTitle>
            <CardDescription>K-Means + ring background (centered ROI)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Method</Label>
              <Select value={segMethod} onValueChange={(v) => setSegMethod(v as any)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kmeans">K-Means (auto)</SelectItem>
                  <SelectItem value="grabcut">GrabCut (from box)</SelectItem>
                  <SelectItem value="unet">U-Net (if available)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runSegmentation} disabled={!imageDataUrl || segMethod!=="kmeans"}>Run Segmentation</Button>
            {segResult && (
              <p className="text-sm text-muted-foreground">{segResult}</p>
            )}
            {segMetrics && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Area: {segMetrics.area ? `${segMetrics.area.toFixed(2)} cm²` : `${segMetrics.areaPx} px`}</div>
                <div>Redness (R/G): {segMetrics.redness}</div>
                <div>Border irregularity: {segMetrics.borderIrregularity}</div>
                <div>Asymmetry: {segMetrics.asymmetry}</div>
                <div>ΔE (CIEDE2000): {segMetrics.deltaE}</div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Center-circle ROI with surrounding ring as background. For accurate cm², provide pixels per cm or use a ruler/marker for manual calibration. Advanced methods (GrabCut/U‑Net/ArUco) are deferred.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Simulation</CardTitle>
            <CardDescription>Discrete-time lesion area response</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label>Start area (cm²)</Label><Input type="number" min={0} step={0.1} value={Number.isNaN(startArea as any) ? "" : startArea} onChange={(e) => setStartArea(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Number(e.target.value)))} />{Number.isNaN(startArea as any) && (<p className="text-xs text-muted-foreground">Please enter a number.</p>)}</div>
              <div className="space-y-1"><Label>Days</Label><Input type="number" min={7} max={90} step={1} value={Number.isNaN(days as any) ? "" : days} onChange={(e) => setDays(e.target.value === "" ? (NaN as unknown as number) : Math.max(7, Math.min(90, Number(e.target.value))))} />{Number.isNaN(days as any) && (<p className="text-xs text-muted-foreground">Please enter a number.</p>)}</div>
              <div className="space-y-1"><Label>Natural healing rate</Label><Input type="number" min={0} max={0.05} step={0.001} value={Number.isNaN(baseDecay as any) ? "" : baseDecay} onChange={(e) => setBaseDecay(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(0.05, Number(e.target.value))))} /></div>
              <div className="space-y-1"><Label>Medication potency</Label><Input type="number" min={0} max={0.1} step={0.001} value={Number.isNaN(medPotency as any) ? "" : medPotency} onChange={(e) => setMedPotency(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(0.1, Number(e.target.value))))} /></div>
              <div className="space-y-1"><Label>Adherence (0-1)</Label><Input type="number" min={0} max={1} step={0.05} value={Number.isNaN(adherence as any) ? "" : adherence} onChange={(e) => setAdherence(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(1, Number(e.target.value))))} /></div>
              <div className="space-y-1"><Label>Trigger load (0-10)</Label><Input type="number" min={0} max={10} step={1} value={Number.isNaN(triggerLoad as any) ? "" : triggerLoad} onChange={(e) => setTriggerLoad(e.target.value === "" ? (NaN as unknown as number) : Math.max(0, Math.min(10, Number(e.target.value))))} />{Number.isNaN(triggerLoad as any) && (<p className="text-xs text-muted-foreground">Please enter 0–10.</p>)}</div>
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

        {/* New: Per-metric Trends from Saved Records */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Lesion Area Trend</CardTitle>
            <CardDescription>Area (cm² or pixels) over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[220px]" config={{ area: { label: "Area", color: "var(--chart-5)" } }}>
              <LineChart data={metricSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="area" stroke="var(--color-area)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redness Trend</CardTitle>
            <CardDescription>Mean R/G contrast over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[220px]" config={{ redness: { label: "Redness (R/G)", color: "var(--chart-2)" } }}>
              <LineChart data={metricSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="redness" stroke="var(--color-skin)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Border Irregularity Trend</CardTitle>
            <CardDescription>Perimeter²/(4πA) (≥1)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer className="w-full h-[220px]" config={{ border: { label: "Border", color: "var(--chart-1)" } }}>
              <LineChart data={metricSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="border" stroke="var(--color-stomach)" strokeWidth={2} dot={false} />
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

      <ChatPanel
        title="SkinTrack AI Assistant"
        description="Ask about lesions, redness, treatments, routines, or triggers"
        messages={chat}
        input={chatInput}
        setInput={setChatInput}
        onSend={onSendChat}
        actions={
          <div className="flex flex-wrap gap-2 text-xs">
            <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => { setChatInput("Analyze my latest lesion photos for changes"); }}>📸 Photo Analysis</Button>
            <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => { setChatInput("Show me trends in redness and border irregularity"); }}>📊 Trend Analysis</Button>
            <Button variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100" onClick={() => { setChatInput("Help me with treatment schedule and adherence"); }}>💊 Treatment Help</Button>
          </div>
        }
      />
    </div>
  )
}