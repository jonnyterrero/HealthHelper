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
  const data14 = toTimeSeries(lastNDays(entries, 30))
  const insights = React.useMemo(() => generateInsights(entries), [entries])

  React.useEffect(() => {
    const handler = () => setEntries(loadEntries())
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

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