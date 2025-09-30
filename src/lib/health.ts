// Health data models, storage helpers, and simple ML insights

export type StomachEntry = {
  date: string // ISO date (yyyy-mm-dd)
  severity: number // 0-10
  painLocation?: string
  bowelChanges?: string
  triggers: {
    dairy: boolean
    gluten: boolean
    spicy: boolean
    alcohol: boolean
    caffeine: boolean
  }
  notes?: string
}

export type SkinEntry = {
  date: string
  severity: number // 0-10
  area?: string
  rash?: boolean
  itch?: boolean
  triggers: {
    cosmetics: boolean
    detergent: boolean
    weather: boolean
    sweat: boolean
    dietSugar: boolean
  }
  notes?: string
}

export type MentalEntry = {
  date: string
  mood: number // 0-10 (higher is better)
  anxiety: number // 0-10
  sleepHours?: number
  stressLevel?: number // 0-10
  notes?: string
}

export type HealthEntry = {
  date: string
  stomach?: StomachEntry
  skin?: SkinEntry
  mental?: MentalEntry
}

// Add new sleep quality analysis types
export type SleepQualityMetrics = {
  date: string
  sleepHours: number
  sleepQuality?: number // 0-10 subjective rating
  stressLevel: number
  mood: number
  sleepDebt?: number // cumulative hours below optimal
  efficiency?: number // percentage of optimal sleep
}

const STORAGE_KEY = "orchids.health.entries.v1"

export function loadEntries(): HealthEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function saveEntries(entries: HealthEntry[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function upsertEntry(partial: Partial<HealthEntry> & { date: string }): HealthEntry[] {
  const entries = loadEntries()
  const idx = entries.findIndex((e) => e.date === partial.date)
  if (idx >= 0) {
    entries[idx] = {
      ...entries[idx],
      ...partial,
      stomach: { ...entries[idx].stomach, ...partial.stomach },
      skin: { ...entries[idx].skin, ...partial.skin },
      mental: { ...entries[idx].mental, ...partial.mental },
    }
  } else {
    entries.push({ date: partial.date, ...partial })
  }
  saveEntries(entries)
  return entries
}

export function todayISO(): string {
  const d = new Date()
  const iso = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  return iso.toISOString().slice(0, 10)
}

export function lastNDays(entries: HealthEntry[], days = 14): HealthEntry[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (days - 1))
  return entries
    .filter((e) => new Date(e.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Simple pattern mining: correlation between numeric severity and boolean triggers
export type Insight = {
  area: "stomach" | "skin" | "mental"
  metric: string
  trigger?: string
  score: number // correlation-like score (-1..1)
  description: string
}

function pearson(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length)
  if (n < 3) return null
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0
  for (let i = 0; i < n; i++) {
    const xi = x[i]
    const yi = y[i]
    sx += xi
    sy += yi
    sxx += xi * xi
    syy += yi * yi
    sxy += xi * yi
  }
  const cov = sxy - (sx * sy) / n
  const vx = sxx - (sx * sx) / n
  const vy = syy - (sy * sy) / n
  if (vx <= 0 || vy <= 0) return null
  const r = cov / Math.sqrt(vx * vy)
  if (!isFinite(r)) return null
  return Math.max(-1, Math.min(1, r))
}

export function generateInsights(entries: HealthEntry[]): Insight[] {
  const insights: Insight[] = []

  // Stomach
  const stomach = entries.filter((e) => e.stomach)
  if (stomach.length >= 3) {
    const sev = stomach.map((e) => e.stomach!.severity)
    const triggers = [
      ["dairy", stomach.map((e) => (e.stomach!.triggers.dairy ? 1 : 0))],
      ["gluten", stomach.map((e) => (e.stomach!.triggers.gluten ? 1 : 0))],
      ["spicy", stomach.map((e) => (e.stomach!.triggers.spicy ? 1 : 0))],
      ["alcohol", stomach.map((e) => (e.stomach!.triggers.alcohol ? 1 : 0))],
      ["caffeine", stomach.map((e) => (e.stomach!.triggers.caffeine ? 1 : 0))],
    ] as const
    for (const [key, arr] of triggers) {
      const r = pearson(sev, arr)
      if (r !== null && Math.abs(r) >= 0.35) {
        insights.push({
          area: "stomach",
          metric: "severity",
          trigger: key,
          score: r,
          description:
            r > 0
              ? `Stomach severity tends to be higher on days with ${key}.`
              : `Stomach severity tends to be lower on days with ${key}.`,
        })
      }
    }
  }

  // Skin
  const skin = entries.filter((e) => e.skin)
  if (skin.length >= 3) {
    const sev = skin.map((e) => e.skin!.severity)
    const triggers = [
      ["cosmetics", skin.map((e) => (e.skin!.triggers.cosmetics ? 1 : 0))],
      ["detergent", skin.map((e) => (e.skin!.triggers.detergent ? 1 : 0))],
      ["weather", skin.map((e) => (e.skin!.triggers.weather ? 1 : 0))],
      ["sweat", skin.map((e) => (e.skin!.triggers.sweat ? 1 : 0))],
      ["diet sugar", skin.map((e) => (e.skin!.triggers.dietSugar ? 1 : 0))],
    ] as const
    for (const [key, arr] of triggers) {
      const r = pearson(sev, arr)
      if (r !== null && Math.abs(r) >= 0.35) {
        insights.push({
          area: "skin",
          metric: "severity",
          trigger: key,
          score: r,
          description:
            r > 0
              ? `Skin severity tends to be higher on days with ${key}.`
              : `Skin severity tends to be lower on days with ${key}.`,
        })
      }
    }
  }

  // Mental: relate mood vs anxiety, sleep
  const mental = entries.filter((e) => e.mental)
  if (mental.length >= 3) {
    const mood = mental.map((e) => e.mental!.mood)
    const anxiety = mental.map((e) => e.mental!.anxiety)
    const sleep = mental.map((e) => (e.mental!.sleepHours ?? 0))
    const stress = mental.map((e) => (e.mental!.stressLevel ?? 0))

    const rMoodAnx = pearson(mood, anxiety)
    if (rMoodAnx !== null && Math.abs(rMoodAnx) >= 0.35) {
      insights.push({
        area: "mental",
        metric: "mood vs anxiety",
        score: rMoodAnx,
        description:
          rMoodAnx < 0
            ? "Better mood is associated with lower anxiety."
            : "Higher mood appears associated with higher anxiety (recheck inputs).",
      })
    }

    const rMoodSleep = pearson(mood, sleep)
    if (rMoodSleep !== null && Math.abs(rMoodSleep) >= 0.35) {
      insights.push({
        area: "mental",
        metric: "mood vs sleep",
        score: rMoodSleep,
        description:
          rMoodSleep > 0
            ? "More sleep tends to correlate with better mood."
            : "More sleep tends to correlate with worse mood.",
      })
    }

    // New: Sleep vs Stress correlation
    const rSleepStress = pearson(sleep, stress)
    if (rSleepStress !== null && Math.abs(rSleepStress) >= 0.35) {
      insights.push({
        area: "mental",
        metric: "sleep vs stress",
        score: rSleepStress,
        description:
          rSleepStress < 0
            ? "Better sleep is strongly linked to lower stress levels."
            : "Unusual pattern: more sleep correlated with higher stress (review data quality).",
      })
    }

    // New: Sleep debt analysis
    const avgSleep = sleep.reduce((a, b) => a + b, 0) / sleep.length
    const optimalSleep = 7.5 // optimal hours
    if (avgSleep < optimalSleep - 0.5) {
      const debt = optimalSleep - avgSleep
      insights.push({
        area: "mental",
        metric: "sleep debt",
        score: debt,
        description: `Chronic sleep debt detected: averaging ${avgSleep.toFixed(1)}h vs optimal ${optimalSleep}h. Consider earlier bedtime by ${(debt * 60).toFixed(0)} minutes.`,
      })
    }

    // New: Stress threshold alert
    const highStressDays = stress.filter(s => s >= 7).length
    if (highStressDays >= mental.length * 0.4) {
      insights.push({
        area: "mental",
        metric: "stress threshold",
        score: highStressDays / mental.length,
        description: `High stress detected on ${highStressDays} of ${mental.length} days (${((highStressDays / mental.length) * 100).toFixed(0)}%). Prioritize stress management techniques.`,
      })
    }
  }

  // Rank by absolute score
  return insights.sort((a, b) => Math.abs(b.score) - Math.abs(a.score))
}

export function toTimeSeries(entries: HealthEntry[]) {
  // Prepare arrays useful for charts
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  return {
    stomach: sorted
      .filter((e) => e.stomach)
      .map((e) => ({ date: e.date, severity: e.stomach!.severity })),
    skin: sorted
      .filter((e) => e.skin)
      .map((e) => ({ date: e.date, severity: e.skin!.severity })),
    mentalMood: sorted
      .filter((e) => e.mental)
      .map((e) => ({ date: e.date, mood: e.mental!.mood, anxiety: e.mental!.anxiety })),
  }
}