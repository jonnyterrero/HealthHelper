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
  sleepQuality?: number // 0-10 subjective rating
  bedTime?: string // HH:MM format
  wakeTime?: string // HH:MM format
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
  bedTime?: string
  wakeTime?: string
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

  // Add advanced sleep-stress pattern insights
  const sleepStressInsights = analyzeSleepStressPatterns(entries)
  insights.push(...sleepStressInsights)

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
    sleep: sorted
      .filter((e) => e.mental?.sleepHours !== undefined)
      .map((e) => ({ 
        date: e.date, 
        hours: e.mental!.sleepHours!, 
        quality: e.mental!.sleepQuality,
        stress: e.mental!.stressLevel ?? 0
      })),
  }
}

// Advanced Sleep Analysis Functions

/**
 * Calculate sleep quality score based on duration, stress, and mood
 * Returns 0-100 score
 */
export function calculateSleepQualityScore(entry: MentalEntry): number {
  const hours = entry.sleepHours ?? 0
  const stress = entry.stressLevel ?? 5
  const mood = entry.mood ?? 5
  
  // Optimal sleep range: 7-9 hours
  let durationScore = 100
  if (hours < 7) {
    durationScore = Math.max(0, (hours / 7) * 100)
  } else if (hours > 9) {
    durationScore = Math.max(0, 100 - ((hours - 9) * 15))
  }
  
  // Lower stress improves sleep quality
  const stressScore = Math.max(0, 100 - (stress * 10))
  
  // Better mood indicates better rest
  const moodScore = (mood / 10) * 100
  
  // Weighted average: duration 50%, stress 30%, mood 20%
  return Math.round((durationScore * 0.5) + (stressScore * 0.3) + (moodScore * 0.2))
}

/**
 * Analyze circadian rhythm consistency
 * Returns consistency score (0-100) and recommendations
 */
export function analyzeCircadianRhythm(entries: HealthEntry[]): {
  score: number
  avgBedTime: string | null
  avgWakeTime: string | null
  variance: number
  recommendations: string[]
} {
  const mentalEntries = entries.filter(e => e.mental?.bedTime && e.mental?.wakeTime)
  
  if (mentalEntries.length < 3) {
    return {
      score: 0,
      avgBedTime: null,
      avgWakeTime: null,
      variance: 0,
      recommendations: ["Track bedtime and wake time for at least 3 days to analyze circadian rhythm."]
    }
  }
  
  // Convert time strings to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  const bedTimes = mentalEntries.map(e => timeToMinutes(e.mental!.bedTime!))
  const wakeTimes = mentalEntries.map(e => timeToMinutes(e.mental!.wakeTime!))
  
  // Calculate average
  const avgBed = bedTimes.reduce((a, b) => a + b, 0) / bedTimes.length
  const avgWake = wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length
  
  // Calculate variance (standard deviation)
  const bedVariance = Math.sqrt(bedTimes.reduce((sum, t) => sum + Math.pow(t - avgBed, 2), 0) / bedTimes.length)
  const wakeVariance = Math.sqrt(wakeTimes.reduce((sum, t) => sum + Math.pow(t - avgWake, 2), 0) / wakeTimes.length)
  const avgVariance = (bedVariance + wakeVariance) / 2
  
  // Score: lower variance = higher score
  // Variance under 30 minutes = excellent (90-100)
  // Variance 30-60 minutes = good (70-89)
  // Variance 60-120 minutes = fair (50-69)
  // Variance >120 minutes = poor (<50)
  let score = 100
  if (avgVariance > 30) score = Math.max(50, 100 - ((avgVariance - 30) * 0.5))
  if (avgVariance > 120) score = Math.max(0, 50 - ((avgVariance - 120) * 0.25))
  
  // Convert minutes back to HH:MM format
  const minutesToTime = (mins: number): string => {
    const h = Math.floor(mins / 60) % 24
    const m = Math.round(mins % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  
  const recommendations: string[] = []
  if (avgVariance > 60) {
    recommendations.push("Your sleep schedule varies significantly. Try going to bed and waking up at the same time daily, even on weekends.")
  }
  if (avgBed > 23 * 60) { // After 11 PM
    recommendations.push("Consider moving your bedtime earlier to align with natural circadian rhythms. Aim for 10-11 PM.")
  }
  if (avgWake > 8 * 60) { // After 8 AM
    recommendations.push("Late wake times can disrupt your circadian rhythm. Try waking earlier to get morning sunlight exposure.")
  }
  if (recommendations.length === 0) {
    recommendations.push("Your sleep schedule is consistent! Maintain this rhythm for optimal health.")
  }
  
  return {
    score: Math.round(score),
    avgBedTime: minutesToTime(avgBed),
    avgWakeTime: minutesToTime(avgWake),
    variance: Math.round(avgVariance),
    recommendations
  }
}

/**
 * Detect sleep-stress patterns and provide actionable insights
 */
export function analyzeSleepStressPatterns(entries: HealthEntry[]): Insight[] {
  const insights: Insight[] = []
  const mental = entries.filter(e => e.mental?.sleepHours !== undefined && e.mental?.stressLevel !== undefined)
  
  if (mental.length < 5) return insights
  
  const sleep = mental.map(e => e.mental!.sleepHours!)
  const stress = mental.map(e => e.mental!.stressLevel!)
  const mood = mental.map(e => e.mental!.mood)
  
  // Pattern 1: Consecutive high-stress with low-sleep days
  let consecutiveStressedDays = 0
  let maxConsecutiveStressed = 0
  for (let i = 0; i < mental.length; i++) {
    if (stress[i] >= 7 && sleep[i] < 6) {
      consecutiveStressedDays++
      maxConsecutiveStressed = Math.max(maxConsecutiveStressed, consecutiveStressedDays)
    } else {
      consecutiveStressedDays = 0
    }
  }
  
  if (maxConsecutiveStressed >= 3) {
    insights.push({
      area: "mental",
      metric: "sleep-stress cycle",
      score: maxConsecutiveStressed,
      description: `Detected ${maxConsecutiveStressed} consecutive days of high stress (≥7/10) with inadequate sleep (<6h). This cycle can worsen both conditions. Prioritize sleep to break the pattern.`
    })
  }
  
  // Pattern 2: Weekend sleep compensation (social jet lag)
  const weekdaySleep: number[] = []
  const weekendSleep: number[] = []
  
  mental.forEach(e => {
    const date = new Date(e.date)
    const day = date.getDay()
    const sleepHrs = e.mental!.sleepHours!
    if (day === 0 || day === 6) {
      weekendSleep.push(sleepHrs)
    } else {
      weekdaySleep.push(sleepHrs)
    }
  })
  
  if (weekdaySleep.length >= 3 && weekendSleep.length >= 2) {
    const avgWeekday = weekdaySleep.reduce((a, b) => a + b, 0) / weekdaySleep.length
    const avgWeekend = weekendSleep.reduce((a, b) => a + b, 0) / weekendSleep.length
    const difference = avgWeekend - avgWeekday
    
    if (difference > 1.5) {
      insights.push({
        area: "mental",
        metric: "social jet lag",
        score: difference,
        description: `You sleep ${difference.toFixed(1)} hours more on weekends vs weekdays (${avgWeekday.toFixed(1)}h → ${avgWeekend.toFixed(1)}h). This "social jet lag" can disrupt your circadian rhythm. Aim for consistent sleep duration.`
      })
    }
  }
  
  // Pattern 3: Sleep quality vs quantity mismatch
  const qualityEntries = mental.filter(e => e.mental!.sleepQuality !== undefined)
  if (qualityEntries.length >= 5) {
    const lowQualityHighDuration = qualityEntries.filter(e => 
      (e.mental!.sleepHours ?? 0) >= 7.5 && (e.mental!.sleepQuality ?? 0) < 5
    ).length
    
    if (lowQualityHighDuration >= 3) {
      insights.push({
        area: "mental",
        metric: "sleep efficiency",
        score: lowQualityHighDuration / qualityEntries.length,
        description: `Despite adequate sleep duration (≥7.5h), you reported poor sleep quality on ${lowQualityHighDuration} days. Consider sleep environment factors: noise, light, temperature, or sleep disorders.`
      })
    }
  }
  
  // Pattern 4: Stress predicts next-day sleep
  for (let i = 0; i < mental.length - 1; i++) {
    const todayStress = stress[i]
    const tomorrowSleep = sleep[i + 1]
    
    if (todayStress >= 8 && tomorrowSleep < 6) {
      insights.push({
        area: "mental",
        metric: "stress impact on sleep",
        score: todayStress,
        description: `High stress (${todayStress}/10) on ${mental[i].date} preceded poor sleep (${tomorrowSleep}h) on ${mental[i+1].date}. Practice evening relaxation techniques: meditation, journaling, or breathing exercises.`
      })
      break // Only report first instance to avoid spam
    }
  }
  
  return insights
}

/**
 * Generate comprehensive sleep report
 */
export function generateSleepReport(entries: HealthEntry[]): {
  averageSleep: number
  sleepDebt: number
  qualityScore: number
  circadianScore: number
  recommendations: string[]
} {
  const mental = entries.filter(e => e.mental?.sleepHours !== undefined)
  
  if (mental.length === 0) {
    return {
      averageSleep: 0,
      sleepDebt: 0,
      qualityScore: 0,
      circadianScore: 0,
      recommendations: ["Start tracking your sleep to receive personalized insights."]
    }
  }
  
  const avgSleep = mental.reduce((sum, e) => sum + (e.mental!.sleepHours ?? 0), 0) / mental.length
  const optimalSleep = 7.5
  const sleepDebt = Math.max(0, (optimalSleep - avgSleep) * mental.length)
  
  // Calculate average quality score
  const qualityScores = mental.map(e => calculateSleepQualityScore(e.mental!))
  const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
  
  // Get circadian rhythm score
  const circadian = analyzeCircadianRhythm(entries)
  
  const recommendations: string[] = []
  
  if (avgSleep < 7) {
    recommendations.push(`⚠️ You're averaging ${avgSleep.toFixed(1)}h per night. Aim for 7-9 hours to reduce your accumulated sleep debt of ${sleepDebt.toFixed(1)} hours.`)
  }
  
  if (avgQuality < 70) {
    recommendations.push(`🛌 Your sleep quality score is ${avgQuality.toFixed(0)}/100. Improve by maintaining consistent sleep times and optimizing your sleep environment.`)
  }
  
  if (circadian.score < 70) {
    recommendations.push(...circadian.recommendations)
  }
  
  // Add stress-specific recommendations
  const recentStress = mental.slice(-7).reduce((sum, e) => sum + (e.mental!.stressLevel ?? 0), 0) / Math.min(7, mental.length)
  if (recentStress > 6) {
    recommendations.push(`😰 Recent stress levels are high (${recentStress.toFixed(1)}/10). Practice stress-reduction techniques before bed: 4-7-8 breathing, progressive muscle relaxation, or guided meditation.`)
  }
  
  if (recommendations.length === 0) {
    recommendations.push("✅ Your sleep metrics are excellent! Continue maintaining these healthy habits.")
  }
  
  return {
    averageSleep: Math.round(avgSleep * 10) / 10,
    sleepDebt: Math.round(sleepDebt * 10) / 10,
    qualityScore: Math.round(avgQuality),
    circadianScore: circadian.score,
    recommendations
  }
}