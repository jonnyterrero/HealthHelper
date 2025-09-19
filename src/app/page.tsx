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
import { loadEntries, upsertEntry, todayISO, lastNDays, toTimeSeries, generateInsights } from "@/lib/health";
import { exportCSV, exportPDF } from "@/lib/export";
import { ProfileMenu } from "@/components/profile-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const [date, setDate] = React.useState(todayISO());
  const [entries, setEntries] = React.useState(() => loadEntries());

  // add profile state (local-only)
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profile, setProfile] = React.useState(() => {
    if (typeof window === "undefined") return { conditions: [], medications: [] } as any;
    try { return JSON.parse(localStorage.getItem("orchids.profile.v1") || "null") || { conditions: [], medications: [] } } catch { return { conditions: [], medications: [] } }
  });
  React.useEffect(() => {
    // hydrate profile if not set yet
    try {
      const raw = localStorage.getItem("orchids.profile.v1");
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
  }, []);
  function saveProfileLocal() {
    try { localStorage.setItem("orchids.profile.v1", JSON.stringify(profile)); } catch {}
    setProfileOpen(false);
  }

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
  }, [date]);

  const series14 = toTimeSeries(lastNDays(entries, 14));
  const insights = React.useMemo(() => generateInsights(entries), [entries]);

  function saveAll() {
    const updated = upsertEntry({
      date,
      stomach: { date, severity: Number(stomach.severity), painLocation: stomach.painLocation || undefined, bowelChanges: stomach.bowelChanges || undefined, triggers: stomach.triggers, notes: stomach.notes || undefined },
      skin: { date, severity: Number(skin.severity), area: skin.area || undefined, rash: skin.rash, itch: skin.itch, triggers: skin.triggers, notes: skin.notes || undefined },
      mental: { date, mood: Number(mental.mood), anxiety: Number(mental.anxiety), sleepHours: Number(mental.sleepHours), stressLevel: Number(mental.stressLevel), notes: mental.notes || undefined }
    });
    setEntries(updated);
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Health Dashboard</h1>
          <p className="text-muted-foreground">Daily tracking for stomach, skin, and mental health</p>
        </div>
        <div className="relative">
          <div className="hidden md:flex gap-2">
            <ProfileMenu />
            <Button variant="outline" className="border-pink-300 text-pink-700 hover:bg-pink-50" onClick={() => exportCSV(entries)}>Export CSV</Button>
            <Button className="bg-pink-200 text-pink-900 hover:bg-pink-300" onClick={() => exportPDF(entries, insights)}>Export PDF</Button>
            <Button asChild variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200"><Link href="/analytics">Open Analytics</Link></Button>
            <Button asChild variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200"><Link href="/skintrack">SkinTrack+</Link></Button>
            <Button asChild variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200"><Link href="/gastro">GastroGuard</Link></Button>
            <Button asChild variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200"><Link href="/mindtrack">MindTrack</Link></Button>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <ProfileMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="bg-pink-100 text-pink-700 hover:bg-pink-200">Actions</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => exportCSV(entries)}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportPDF(entries, insights)}>Export PDF</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/analytics">Open Analytics</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/skintrack">SkinTrack+</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/gastro">GastroGuard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mindtrack">MindTrack</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 !text-pink-300">
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
            <Button onClick={saveAll}>Save Today</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stomach</CardTitle>
            <CardDescription>Symptoms and triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Severity (0-10)</Label>
              <Input type="number" min={0} max={10} value={stomach.severity} onChange={(e) => setStomach({ ...stomach, severity: Number(e.target.value) })} />
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

        <Card>
          <CardHeader>
            <CardTitle>Skin</CardTitle>
            <CardDescription>Symptoms and triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Severity (0-10)</Label>
              <Input type="number" min={0} max={10} value={skin.severity} onChange={(e) => setSkin({ ...skin, severity: Number(e.target.value) })} />
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

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Mental Health</CardTitle>
            <CardDescription>Mood, anxiety, sleep, stress</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>Mood (0-10)</Label>
              <Input type="number" min={0} max={10} value={mental.mood} onChange={(e) => setMental({ ...mental, mood: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Anxiety (0-10)</Label>
              <Input type="number" min={0} max={10} value={mental.anxiety} onChange={(e) => setMental({ ...mental, anxiety: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Sleep Hours</Label>
              <Input type="number" min={0} max={24} value={mental.sleepHours} onChange={(e) => setMental({ ...mental, sleepHours: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Stress Level (0-10)</Label>
              <Input type="number" min={0} max={10} value={mental.stressLevel} onChange={(e) => setMental({ ...mental, stressLevel: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-4 space-y-1">
              <Label>Notes</Label>
              <Input value={mental.notes} onChange={(e) => setMental({ ...mental, notes: e.target.value })} placeholder="What influenced your mood?" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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