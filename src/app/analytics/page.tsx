"use client"

import React from "react"
import { loadEntries, toTimeSeries, generateInsights, lastNDays } from "@/lib/health"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { exportCSV, exportPDF } from "@/lib/export"

export default function AnalyticsPage() {
  const [entries, setEntries] = React.useState(() => loadEntries())
  const [gastro, setGastro] = React.useState<any[]>([])
  const [mind, setMind] = React.useState<any[]>([])
  const [lesions, setLesions] = React.useState<any[]>([])

  const data14 = toTimeSeries(lastNDays(entries, 30))
  const insights = React.useMemo(() => generateInsights(entries), [entries])

  React.useEffect(() => {
    const loadExternal = () => {
      try {
        setGastro(JSON.parse(localStorage.getItem("orchids.gastro.logs.v1") || "[]") || [])
      } catch { setGastro([]) }
      try {
        setMind(JSON.parse(localStorage.getItem("orchids.mindtrack.entries.v1") || "[]") || [])
      } catch { setMind([]) }
      try {
        setLesions(JSON.parse(localStorage.getItem("orchids.skintrack.lesions.v1") || "[]") || [])
      } catch { setLesions([]) }
    }

    setEntries(loadEntries())
    loadExternal()

    const handler = () => {
      setEntries(loadEntries())
      loadExternal()
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  // derived series
  const gastroSeries = React.useMemo(() => {
    return gastro
      .slice()
      .sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)))
      .map((l) => ({ time: String(l.datetime).slice(0,16).replace("T"," "), pain: Number(l.pain ?? 0), stress: Number(l.stress ?? 0) }))
  }, [gastro])

  const mindSeries = React.useMemo(() => {
    return mind
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((e) => ({ date: String(e.date), mood: Number(e.mood ?? 0), stress: Number(e.stress ?? 0), sleep: Number(e.sleepHours ?? 0) }))
  }, [mind])

  const skinSeries = React.useMemo(() => {
    // aggregate by date, pick last area per date
    const byDate = new Map<string, number>()
    const sorted = lesions.slice().sort((a,b) => String(a.date).localeCompare(String(b.date)))
    for (const r of sorted) {
      const d = String(r.date)
      const area = Number(r?.metrics?.area ?? NaN)
      if (!isNaN(area)) byDate.set(d, area)
    }
    return Array.from(byDate.entries()).map(([date, area]) => ({ date, area }))
  }, [lesions])

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">Trends, correlations, and exports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV(entries)}>Export CSV</Button>
          <Button onClick={() => exportPDF(entries, insights)}>Export PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Symptom Trends (Last 30 Days)</CardTitle>
          <CardDescription>Track changes across areas</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="w-full h-[320px]" config={{
            stomach: { label: "Stomach", color: "var(--chart-1)" },
            skin: { label: "Skin", color: "var(--chart-2)" },
            mood: { label: "Mood", color: "var(--chart-3)" },
            anxiety: { label: "Anxiety", color: "var(--chart-4)" },
          }}>
            <LineChart data={mergeForMulti(data14)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dot={false} strokeWidth={2} dataKey="stomach" stroke="var(--color-stomach)" />
              <Line type="monotone" dot={false} strokeWidth={2} dataKey="skin" stroke="var(--color-skin)" />
              <Line type="monotone" dot={false} strokeWidth={2} dataKey="mood" stroke="var(--color-mood)" />
              <Line type="monotone" dot={false} strokeWidth={2} dataKey="anxiety" stroke="var(--color-anxiety)" />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastro: Pain & Stress Timeline</CardTitle>
          <CardDescription>From GastroGuard logs</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="w-full h-[280px]" config={{ pain: { label: "Pain", color: "var(--chart-1)" }, stress: { label: "Stress", color: "var(--chart-4)" } }}>
            <LineChart data={gastroSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis domain={[0,10]} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="pain" stroke="var(--color-pain)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="stress" stroke="var(--color-stress)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MindTrack: Mood, Stress, Sleep</CardTitle>
          <CardDescription>From MindTrack entries</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="w-full h-[280px]" config={{ mood: { label: "Mood", color: "var(--chart-3)" }, stress: { label: "Stress", color: "var(--chart-5)" }, sleep: { label: "Sleep (h)", color: "var(--chart-2)" } }}>
            <LineChart data={mindSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" domain={[0,10]} tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0,24]} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line yAxisId="left" type="monotone" dataKey="mood" stroke="var(--color-mood)" strokeWidth={2} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="stress" stroke="var(--color-stress)" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="var(--color-skin)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SkinTrack: Lesion Area Trend</CardTitle>
          <CardDescription>Area (cm²) over saved records</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="w-full h-[280px]" config={{ area: { label: "Area (cm²)", color: "var(--chart-5)" } }}>
            <LineChart data={skinSeries}>
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
          <CardTitle>Insights</CardTitle>
          <CardDescription>Automatic pattern recognition</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-muted-foreground">No strong patterns detected yet. Keep logging!</p>
          ) : (
            <ul className="space-y-2 list-disc pl-5">
              {insights.map((ins, i) => (
                <li key={i} className="leading-relaxed">
                  <span className="font-medium">[{ins.area}]</span> {ins.description} <span className="text-muted-foreground">(score: {ins.score.toFixed(2)})</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function mergeForMulti(ts: ReturnType<typeof toTimeSeries>) {
  const dates = Array.from(new Set([
    ...ts.stomach.map(d => d.date),
    ...ts.skin.map(d => d.date),
    ...ts.mentalMood.map(d => d.date),
  ])).sort()

  return dates.map(date => ({
    date,
    stomach: ts.stomach.find(d => d.date === date)?.severity ?? null,
    skin: ts.skin.find(d => d.date === date)?.severity ?? null,
    mood: ts.mentalMood.find(d => d.date === date)?.mood ?? null,
    anxiety: ts.mentalMood.find(d => d.date === date)?.anxiety ?? null,
  }))
}