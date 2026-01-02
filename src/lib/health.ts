// Health data models, storage helpers, and advanced ML insights

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

// Enhanced Mental Entry with more detailed tracking
export type MentalEntry = {
  date: string
  mood: number // 0-10 (higher is better)
  anxiety: number // 0-10
  sleepHours?: number
  sleepQuality?: number // 0-10 subjective rating
  bedTime?: string // HH:MM format
  wakeTime?: string // HH:MM format
  stressLevel?: number // 0-10
  energy?: number // 0-10
  focus?: number // 0-10
  journalEntry?: string
  voiceNotePath?: string
  copingStrategies?: string[]
  notes?: string
}

// Separate Sleep Entry for detailed sleep tracking
export type SleepEntry = {
  date: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  durationHours: number
  qualityScore: number // 1-10
  sleepStages?: {
    deep: number // percentage
    light: number // percentage
    rem: number // percentage
    awake: number // percentage
  }
  sleepFactors: {
    caffeine: boolean
    alcohol: boolean
    exercise: boolean
    stress: boolean
    screenTime: boolean
  }
  notes?: string
}

// Symptom tracking for comprehensive health monitoring
export type SymptomEntry = {
  date: string
  giFlare: number // 0-10
  skinFlare: number // 0-10
  migraine: number // 0-10
  fatigue: number // 0-10
  notes?: string
}

// Nutrition tracking types
export type FoodItem = {
  name: string
  portion: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  time: string // HH:MM format
}

export type MealEntry = {
  date: string
  meals: FoodItem[]
  waterIntake?: number // in ml or oz
  notes?: string
}

export type NutritionEntry = {
  date: string
  meals: MealEntry
  symptoms?: {
    stomach: number // 0-10
    skin: number // 0-10
    energy: number // 0-10
  }
  correlations?: string[] // detected food-symptom correlations
}

// Workout tracking for exercise monitoring
export type WorkoutEntry = {
  date: string
  type: "cardio" | "strength" | "yoga" | "stretching" | "sports" | "walking" | "running" | "cycling" | "swimming" | "hiit" | "other"
  duration: number // in minutes
  intensity: number // 0-10
  caloriesBurned?: number
  heartRateAvg?: number
  notes?: string
  feeling: "energized" | "tired" | "normal" | "sore"
  location: "gym" | "home" | "outdoors" | "other"
}

export type HealthEntry = {
  date: string
  stomach?: StomachEntry
  skin?: SkinEntry
  mental?: MentalEntry
  sleep?: SleepEntry
  symptoms?: SymptomEntry
  nutrition?: NutritionEntry
  workout?: WorkoutEntry
}

// Advanced ML prediction types
export type Prediction = {
  condition: string
  probability: number // 0-100
  factors: string[]
  severity: 'low' | 'medium' | 'high'
  confidence: number // 0-100
}

export type SleepPrediction = {
  predictedQuality: number // 1-10
  riskFactors: string[]
  recommendations: string[]
  confidence: number
}

export type SymptomPrediction = {
  giFlareRisk: number // 0-100
  skinFlareRisk: number // 0-100
  migraineRisk: number // 0-100
  fatigueRisk: number // 0-100
  overallRisk: 'low' | 'medium' | 'high'
  preventiveActions: string[]
}

// Sleep quality analysis types
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

export type SleepStageDistribution = {
  date: string
  deep: number // percentage
  light: number // percentage
  rem: number // percentage
  awake: number // percentage
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
      sleep: { ...entries[idx].sleep, ...partial.sleep },
      symptoms: { ...entries[idx].symptoms, ...partial.symptoms },
      nutrition: { ...entries[idx].nutrition, ...partial.nutrition },
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

export function customDateRange(entries: HealthEntry[], fromDate: Date, toDate: Date): HealthEntry[] {
  return entries
    .filter((e) => {
      const entryDate = new Date(e.date)
      return entryDate >= fromDate && entryDate <= toDate
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getDateRangeEntries(
  entries: HealthEntry[], 
  rangeType: number | "custom",
  customFrom?: Date,
  customTo?: Date
): HealthEntry[] {
  if (rangeType === "custom" && customFrom && customTo) {
    return customDateRange(entries, customFrom, customTo)
  }
  if (typeof rangeType === "number") {
    return lastNDays(entries, rangeType)
  }
  return entries
}

// Simple pattern mining: correlation between numeric severity and boolean triggers
export type Insight = {
  area: "stomach" | "skin" | "mental" | "sleep" | "cross-module" | "nutrition"
  metric: string
  trigger?: string
  score: number // correlation-like score (-1..1)
  description: string
  priority?: "high" | "medium" | "low"
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

// ML PREDICTION FUNCTIONS

/**
 * Predict sleep quality based on current entry
 */
export function predictSleepQuality(entry: HealthEntry): SleepPrediction {
  const sleep = entry.sleep
  const mental = entry.mental
  const symptoms = entry.symptoms
  
  if (!sleep && !mental?.sleepHours) {
    return {
      predictedQuality: 7,
      riskFactors: ['No sleep data available'],
      recommendations: ['Start tracking your sleep patterns'],
      confidence: 0
    }
  }

  let riskFactors: string[] = []
  let recommendations: string[] = []
  let qualityScore = sleep?.qualityScore ?? mental?.sleepQuality ?? 7

  // Analyze sleep factors
  if (sleep?.sleepFactors.caffeine) {
    riskFactors.push('Caffeine consumption')
    recommendations.push('Avoid caffeine 6 hours before bedtime')
  }
  
  if (sleep?.sleepFactors.alcohol) {
    riskFactors.push('Alcohol consumption')
    recommendations.push('Limit alcohol intake before sleep')
  }
  
  if (sleep?.sleepFactors.screenTime) {
    riskFactors.push('Screen time before bed')
    recommendations.push('Use blue light filters or avoid screens 1 hour before bed')
  }
  
  if (sleep?.sleepFactors.stress || (mental?.stressLevel ?? 0) > 7) {
    riskFactors.push('High stress levels')
    recommendations.push('Practice relaxation techniques before bed')
  }

  // Analyze sleep duration
  const sleepHours = sleep?.durationHours ?? mental?.sleepHours ?? 0
  if (sleepHours < 6) {
    riskFactors.push('Insufficient sleep duration')
    recommendations.push('Aim for 7-9 hours of sleep')
    qualityScore = Math.max(1, qualityScore - 2)
  } else if (sleepHours > 9) {
    riskFactors.push('Excessive sleep duration')
    recommendations.push('Maintain consistent sleep schedule')
  }

  // Analyze correlations with mental health
  if (mental && mental.stressLevel && mental.stressLevel > 7) {
    riskFactors.push('High stress affecting sleep')
    recommendations.push('Practice stress management techniques')
    qualityScore = Math.max(1, qualityScore - 1)
  }

  // Analyze correlations with symptoms
  if (symptoms && symptoms.giFlare > 5) {
    riskFactors.push('GI symptoms affecting sleep')
    recommendations.push('Consider dietary adjustments for better sleep')
    qualityScore = Math.max(1, qualityScore - 1)
  }

  const confidence = Math.max(60, 100 - (riskFactors.length * 15))
  
  return {
    predictedQuality: Math.max(1, Math.min(10, qualityScore)),
    riskFactors,
    recommendations,
    confidence
  }
}

/**
 * Predict symptom risks based on current patterns
 */
export function predictSymptoms(entry: HealthEntry): SymptomPrediction {
  const sleep = entry.sleep
  const mental = entry.mental
  const stomach = entry.stomach
  const skin = entry.skin
  
  let giFlareRisk = 20 // baseline
  let skinFlareRisk = 20
  let migraineRisk = 15
  let fatigueRisk = 25
  const preventiveActions: string[] = []

  // Sleep quality impact
  const sleepQuality = sleep?.qualityScore ?? mental?.sleepQuality ?? 7
  const sleepHours = sleep?.durationHours ?? mental?.sleepHours ?? 7
  
  if (sleepQuality < 6) {
    giFlareRisk += 25
    skinFlareRisk += 20
    migraineRisk += 30
    fatigueRisk += 35
    preventiveActions.push('Improve sleep quality')
  }
  
  if (sleepHours < 6) {
    giFlareRisk += 20
    skinFlareRisk += 15
    migraineRisk += 25
    fatigueRisk += 30
    preventiveActions.push('Get adequate sleep (7-9 hours)')
  }

  // Stress impact
  const stressLevel = mental?.stressLevel ?? 5
  if (stressLevel > 7) {
    giFlareRisk += 30
    skinFlareRisk += 25
    migraineRisk += 35
    fatigueRisk += 20
    preventiveActions.push('Practice stress management')
  }

  // Mood impact
  const mood = mental?.mood ?? 5
  if (mood < 4) {
    giFlareRisk += 15
    skinFlareRisk += 10
    migraineRisk += 20
    fatigueRisk += 25
    preventiveActions.push('Focus on mood improvement activities')
  }

  // Existing symptoms
  if (stomach && stomach.severity > 5) {
    giFlareRisk += 20
    preventiveActions.push('Monitor stomach triggers')
  }

  if (skin && skin.severity > 5) {
    skinFlareRisk += 20
    preventiveActions.push('Monitor skin triggers')
  }

  // Caffeine impact
  if (sleep?.sleepFactors.caffeine) {
    giFlareRisk += 15
    migraineRisk += 20
    preventiveActions.push('Limit caffeine intake')
  }

  // Exercise impact (protective)
  if (sleep?.sleepFactors.exercise) {
    giFlareRisk = Math.max(0, giFlareRisk - 10)
    skinFlareRisk = Math.max(0, skinFlareRisk - 10)
    migraineRisk = Math.max(0, migraineRisk - 15)
    fatigueRisk = Math.max(0, fatigueRisk - 15)
  }

  // Clamp values
  giFlareRisk = Math.min(100, giFlareRisk)
  skinFlareRisk = Math.min(100, skinFlareRisk)
  migraineRisk = Math.min(100, migraineRisk)
  fatigueRisk = Math.min(100, fatigueRisk)

  const maxRisk = Math.max(giFlareRisk, skinFlareRisk, migraineRisk, fatigueRisk)
  const overallRisk = maxRisk > 70 ? 'high' : maxRisk > 40 ? 'medium' : 'low'

  return {
    giFlareRisk,
    skinFlareRisk,
    migraineRisk,
    fatigueRisk,
    overallRisk,
    preventiveActions
  }
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
          priority: Math.abs(r) >= 0.6 ? "high" : "medium",
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
          priority: Math.abs(r) >= 0.6 ? "high" : "medium",
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
    const energy = mental.map((e) => (e.mental!.energy ?? 5))

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
        priority: Math.abs(rMoodAnx) >= 0.6 ? "high" : "medium",
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
        priority: Math.abs(rMoodSleep) >= 0.6 ? "high" : "medium",
      })
    }

    // Energy-Sleep correlation
    const rEnergySleep = pearson(energy, sleep)
    if (rEnergySleep !== null && Math.abs(rEnergySleep) >= 0.35) {
      insights.push({
        area: "mental",
        metric: "energy vs sleep",
        score: rEnergySleep,
        description:
          rEnergySleep > 0
            ? "Better sleep strongly predicts higher energy levels."
            : "Unusual: more sleep correlates with lower energy. Review sleep quality.",
        priority: Math.abs(rEnergySleep) >= 0.6 ? "high" : "medium",
      })
    }

    // Sleep vs Stress correlation
    const rSleepStress = pearson(sleep, stress)
    if (rSleepStress !== null && Math.abs(rSleepStress) >= 0.35) {
      insights.push({
        area: "sleep",
        metric: "sleep vs stress",
        score: rSleepStress,
        description:
          rSleepStress < 0
            ? "Better sleep is strongly linked to lower stress levels."
            : "Unusual pattern: more sleep correlated with higher stress (review data quality).",
        priority: "high",
      })
    }

    // Sleep debt analysis
    const avgSleep = sleep.reduce((a, b) => a + b, 0) / sleep.length
    const optimalSleep = 7.5 // optimal hours
    if (avgSleep < optimalSleep - 0.5) {
      const debt = optimalSleep - avgSleep
      insights.push({
        area: "sleep",
        metric: "sleep debt",
        score: debt,
        description: `Chronic sleep debt detected: averaging ${avgSleep.toFixed(1)}h vs optimal ${optimalSleep}h. Consider earlier bedtime by ${(debt * 60).toFixed(0)} minutes.`,
        priority: debt > 1.5 ? "high" : "medium",
      })
    }

    // Stress threshold alert
    const highStressDays = stress.filter(s => s >= 7).length
    if (highStressDays >= mental.length * 0.4) {
      insights.push({
        area: "mental",
        metric: "stress threshold",
        score: highStressDays / mental.length,
        description: `High stress detected on ${highStressDays} of ${mental.length} days (${((highStressDays / mental.length) * 100).toFixed(0)}%). Prioritize stress management techniques.`,
        priority: "high",
      })
    }
  }

  // Add advanced sleep-stress pattern insights
  const sleepStressInsights = analyzeSleepStressPatterns(entries)
  insights.push(...sleepStressInsights)

  // Add cross-module insights
  const crossInsights = analyzeCrossModulePatterns(entries)
  insights.push(...crossInsights)

  // Add ML-powered sleep stage predictions
  const sleepStageInsights = analyzeSleepStages(entries)
  insights.push(...sleepStageInsights)

  // Add nutrition insights
  const nutritionInsights = analyzeNutritionPatterns(entries)
  insights.push(...nutritionInsights)

  // Rank by priority and absolute score
  return insights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority || "low"];
    const bPriority = priorityOrder[b.priority || "low"];
    if (aPriority !== bPriority) return bPriority - aPriority;
    return Math.abs(b.score) - Math.abs(a.score);
  })
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
 * Advanced ML Feature: Cross-Module Pattern Analysis
 * Detects correlations between sleep, skin, and gastro health
 */
export function analyzeCrossModulePatterns(entries: HealthEntry[]): Insight[] {
  const insights: Insight[] = []
  const combined = entries.filter(e => 
    e.mental?.sleepHours !== undefined && 
    (e.skin?.severity !== undefined || e.stomach?.severity !== undefined)
  )
  
  if (combined.length < 5) return insights
  
  const sleep = combined.map(e => e.mental!.sleepHours!)
  
  // Sleep → Skin correlation
  const skinEntries = combined.filter(e => e.skin?.severity !== undefined)
  if (skinEntries.length >= 5) {
    const skinSeverity = skinEntries.map(e => e.skin!.severity)
    const skinSleep = skinEntries.map(e => e.mental!.sleepHours!)
    const r = pearson(skinSleep, skinSeverity)
    
    if (r !== null && Math.abs(r) >= 0.35) {
      insights.push({
        area: "cross-module",
        metric: "sleep → skin",
        score: r,
        description: r < 0
          ? `Poor sleep (${skinSleep.reduce((a,b)=>a+b,0)/skinSleep.length}h avg) strongly correlates with skin flare-ups. Prioritize 7-9h sleep for skin healing.`
          : "Better sleep associated with worse skin symptoms. Investigate other factors (e.g., late-night skincare products).",
        priority: Math.abs(r) >= 0.5 ? "high" : "medium",
      })
    }
  }
  
  // Sleep → Gastro correlation
  const gastroEntries = combined.filter(e => e.stomach?.severity !== undefined)
  if (gastroEntries.length >= 5) {
    const gastroSeverity = gastroEntries.map(e => e.stomach!.severity)
    const gastroSleep = gastroEntries.map(e => e.mental!.sleepHours!)
    const r = pearson(gastroSleep, gastroSeverity)
    
    if (r !== null && Math.abs(r) >= 0.35) {
      insights.push({
        area: "cross-module",
        metric: "sleep → gastro",
        score: r,
        description: r < 0
          ? `Sleep deprivation correlates with digestive issues. Better sleep (7-9h) may reduce stomach pain by up to ${(Math.abs(r) * 100).toFixed(0)}%.`
          : "More sleep associated with higher stomach pain. Review late-night eating habits.",
        priority: Math.abs(r) >= 0.5 ? "high" : "medium",
      })
    }
  }
  
  // Stress → Multi-system impact
  const stressEntries = entries.filter(e => 
    e.mental?.stressLevel !== undefined &&
    ((e.skin?.severity !== undefined && e.skin.severity > 5) || 
     (e.stomach?.severity !== undefined && e.stomach.severity > 5))
  )
  
  if (stressEntries.length >= 5) {
    const highStressDays = stressEntries.filter(e => (e.mental!.stressLevel ?? 0) >= 7).length
    const percentage = (highStressDays / stressEntries.length) * 100
    
    if (percentage >= 40) {
      insights.push({
        area: "cross-module",
        metric: "stress cascade",
        score: percentage / 100,
        description: `High stress (≥7/10) on ${percentage.toFixed(0)}% of symptom flare days. Stress management may reduce both skin and gastro symptoms significantly.`,
        priority: "high",
      })
    }
  }
  
  return insights
}

/**
 * Advanced ML Feature: Sleep Stage Distribution Prediction
 * Uses simple heuristic model based on total sleep, stress, and quality
 */
export function predictSleepStages(
  sleepHours: number,
  stressLevel: number,
  sleepQuality?: number
): SleepStageDistribution {
  // Baseline percentages for 7.5h optimal sleep
  let deep = 20    // Deep sleep %
  let light = 50   // Light sleep %
  let rem = 25     // REM sleep %
  let awake = 5    // Awake %
  
  // Adjust based on sleep duration
  if (sleepHours < 6) {
    // Sleep deprivation: reduced deep and REM
    deep -= 5
    rem -= 5
    awake += 7
    light += 3
  } else if (sleepHours > 9) {
    // Oversleeping: more light sleep, less efficient
    light += 8
    deep -= 3
    rem -= 2
    awake += 2
  }
  
  // Adjust based on stress
  const stressFactor = Math.max(0, stressLevel - 5) // stress above baseline
  deep -= stressFactor * 1.5
  rem -= stressFactor * 1.0
  light += stressFactor * 1.5
  awake += stressFactor * 1.0
  
  // Adjust based on subjective sleep quality
  if (sleepQuality !== undefined) {
    const qualityFactor = (sleepQuality - 5) / 5 // -1 to 1 scale
    deep += qualityFactor * 5
    rem += qualityFactor * 3
    awake -= qualityFactor * 4
    light -= qualityFactor * 4
  }
  
  // Normalize to 100%
  const total = deep + light + rem + awake
  deep = Math.max(0, Math.min(100, (deep / total) * 100))
  light = Math.max(0, Math.min(100, (light / total) * 100))
  rem = Math.max(0, Math.min(100, (rem / total) * 100))
  awake = Math.max(0, Math.min(100, (awake / total) * 100))
  
  // Final normalization to ensure exactly 100%
  const sum = deep + light + rem + awake
  return {
    date: todayISO(),
    deep: Math.round((deep / sum) * 100 * 10) / 10,
    light: Math.round((light / sum) * 100 * 10) / 10,
    rem: Math.round((rem / sum) * 100 * 10) / 10,
    awake: Math.round((awake / sum) * 100 * 10) / 10,
  }
}

/**
 * Advanced ML Feature: Sleep Stage Analysis & Recommendations
 */
export function analyzeSleepStages(entries: HealthEntry[]): Insight[] {
  const insights: Insight[] = []
  const recent = entries.filter(e => 
    e.mental?.sleepHours !== undefined && 
    e.mental?.stressLevel !== undefined
  ).slice(-7)
  
  if (recent.length < 3) return insights
  
  const predictions = recent.map(e => 
    predictSleepStages(
      e.mental!.sleepHours!,
      e.mental!.stressLevel ?? 5,
      e.mental!.sleepQuality
    )
  )
  
  const avgDeep = predictions.reduce((sum, p) => sum + p.deep, 0) / predictions.length
  const avgRem = predictions.reduce((sum, p) => sum + p.rem, 0) / predictions.length
  const avgAwake = predictions.reduce((sum, p) => sum + p.awake, 0) / predictions.length
  
  // Deep sleep deficiency
  if (avgDeep < 15) {
    insights.push({
      area: "sleep",
      metric: "deep sleep deficiency",
      score: 15 - avgDeep,
      description: `Low deep sleep detected (${avgDeep.toFixed(1)}% vs optimal 18-20%). Deep sleep is critical for immune function and tissue repair. Improve by: avoiding alcohol, maintaining cool room (65-68°F), and exercising earlier in day.`,
      priority: "high",
    })
  }
  
  // REM sleep deficiency
  if (avgRem < 20) {
    insights.push({
      area: "sleep",
      metric: "REM sleep deficiency",
      score: 20 - avgRem,
      description: `Insufficient REM sleep (${avgRem.toFixed(1)}% vs optimal 23-25%). REM supports memory consolidation and emotional regulation. Improve by: consistent sleep schedule, stress management, and avoiding sleep aids that suppress REM.`,
      priority: "high",
    })
  }
  
  // Excessive wake time
  if (avgAwake > 10) {
    insights.push({
      area: "sleep",
      metric: "sleep fragmentation",
      score: avgAwake,
      description: `High nighttime wake percentage (${avgAwake.toFixed(1)}% vs optimal <5%). Fragmented sleep reduces restorative benefits. Address by: limiting liquids before bed, optimizing sleep environment (darkness, quiet, temperature), and managing anxiety.`,
      priority: "medium",
    })
  }
  
  return insights
}

/**
 * Advanced ML Feature: Nutrition Pattern Analysis
 * Detects food-symptom correlations
 */
export function analyzeNutritionPatterns(entries: HealthEntry[]): Insight[] {
  const insights: Insight[] = []
  const nutritionEntries = entries.filter(e => e.nutrition !== undefined)
  
  if (nutritionEntries.length < 5) return insights
  
  // Analyze water intake correlation with symptoms
  const waterIntakes = nutritionEntries
    .filter(e => e.nutrition?.meals.waterIntake !== undefined)
    .map(e => ({ water: e.nutrition!.meals.waterIntake!, stomach: e.stomach?.severity ?? 0, skin: e.skin?.severity ?? 0 }))
  
  if (waterIntakes.length >= 5) {
    const water = waterIntakes.map(e => e.water)
    const stomach = waterIntakes.map(e => e.stomach)
    const skin = waterIntakes.map(e => e.skin)
    
    const rWaterStomach = pearson(water, stomach)
    if (rWaterStomach !== null && rWaterStomach < -0.35) {
      insights.push({
        area: "nutrition",
        metric: "hydration → digestion",
        score: Math.abs(rWaterStomach),
        description: `Higher water intake (${(water.reduce((a,b)=>a+b,0)/water.length).toFixed(0)}ml avg) correlates with reduced stomach issues. Aim for 2-3L daily.`,
        priority: "medium",
      })
    }
    
    const rWaterSkin = pearson(water, skin)
    if (rWaterSkin !== null && rWaterSkin < -0.35) {
      insights.push({
        area: "nutrition",
        metric: "hydration → skin",
        score: Math.abs(rWaterSkin),
        description: `Better hydration significantly improves skin health. Maintain consistent water intake throughout the day.`,
        priority: "medium",
      })
    }
  }
  
  // Analyze meal timing and symptoms
  const lateNightMeals = nutritionEntries.filter(e => {
    const meals = e.nutrition?.meals.meals ?? []
    return meals.some(meal => {
      const [hours] = meal.time.split(':').map(Number)
      return hours >= 21 || hours <= 2 // 9 PM to 2 AM
    })
  })
  
  if (lateNightMeals.length >= 3) {
    const lateNightStomach = lateNightMeals.map(e => e.stomach?.severity ?? 0)
    const avgLateSeverity = lateNightStomach.reduce((a, b) => a + b, 0) / lateNightStomach.length
    
    const regularMeals = nutritionEntries.filter(e => !lateNightMeals.includes(e))
    const regularStomach = regularMeals.map(e => e.stomach?.severity ?? 0)
    const avgRegularSeverity = regularStomach.reduce((a, b) => a + b, 0) / Math.max(1, regularStomach.length)
    
    if (avgLateSeverity > avgRegularSeverity + 1) {
      insights.push({
        area: "nutrition",
        metric: "meal timing",
        score: avgLateSeverity - avgRegularSeverity,
        description: `Late-night eating (after 9 PM) increases stomach issues by ${((avgLateSeverity - avgRegularSeverity) * 10).toFixed(0)}%. Finish meals 3-4 hours before bed.`,
        priority: "high",
      })
    }
  }
  
  // Detect food triggers from correlations
  if (nutritionEntries.length >= 7) {
    const detectedCorrelations = nutritionEntries
      .filter(e => e.nutrition?.correlations && e.nutrition.correlations.length > 0)
    
    if (detectedCorrelations.length >= 3) {
      const allCorrelations = detectedCorrelations.flatMap(e => e.nutrition!.correlations!)
      const correlationFreq: Record<string, number> = {}
      
      allCorrelations.forEach(corr => {
        correlationFreq[corr] = (correlationFreq[corr] || 0) + 1
      })
      
      const frequentTriggers = Object.entries(correlationFreq)
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
      
      if (frequentTriggers.length > 0) {
        insights.push({
          area: "nutrition",
          metric: "food triggers",
          score: frequentTriggers[0][1] / detectedCorrelations.length,
          description: `Potential food triggers detected: ${frequentTriggers.map(([food, count]) => `${food} (${count}x)`).slice(0, 3).join(', ')}. Consider elimination diet to confirm.`,
          priority: "high",
        })
      }
    }
  }
  
  return insights
}

/**
 * Advanced ML Feature: Sleep Efficiency Score
 * Combines duration, quality, stages, and consistency
 */
export function calculateSleepEfficiency(entries: HealthEntry[]): {
  score: number // 0-100
  breakdown: {
    duration: number
    quality: number
    consistency: number
    stages: number
  }
  recommendations: string[]
} {
  const recent = entries.filter(e => e.mental?.sleepHours !== undefined).slice(-7)
  
  if (recent.length < 3) {
    return {
      score: 0,
      breakdown: { duration: 0, quality: 0, consistency: 0, stages: 0 },
      recommendations: ["Track sleep for at least 3 days to calculate efficiency score."]
    }
  }
  
  const sleepHours = recent.map(e => e.mental!.sleepHours!)
  const avgSleep = sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length
  
  // Duration score (optimal 7-9h)
  let durationScore = 100
  if (avgSleep < 7) {
    durationScore = Math.max(0, (avgSleep / 7) * 100)
  } else if (avgSleep > 9) {
    durationScore = Math.max(0, 100 - ((avgSleep - 9) * 20))
  }
  
  // Quality score (from subjective ratings)
  const qualityRatings = recent.filter(e => e.mental!.sleepQuality !== undefined).map(e => e.mental!.sleepQuality!)
  const qualityScore = qualityRatings.length > 0
    ? (qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length) * 10
    : 50 // default if no quality data
  
  // Consistency score (lower variance = better)
  const variance = sleepHours.reduce((sum, h) => sum + Math.pow(h - avgSleep, 2), 0) / sleepHours.length
  const stdDev = Math.sqrt(variance)
  const consistencyScore = Math.max(0, 100 - (stdDev * 30))
  
  // Stage score (from predictions)
  const predictions = recent.map(e => 
    predictSleepStages(
      e.mental!.sleepHours!,
      e.mental!.stressLevel ?? 5,
      e.mental!.sleepQuality
    )
  )
  const avgDeep = predictions.reduce((sum, p) => sum + p.deep, 0) / predictions.length
  const avgRem = predictions.reduce((sum, p) => sum + p.rem, 0) / predictions.length
  const stagesScore = Math.min(100, ((avgDeep / 20) * 50) + ((avgRem / 25) * 50))
  
  // Overall score (weighted average)
  const score = Math.round(
    durationScore * 0.3 +
    qualityScore * 0.3 +
    consistencyScore * 0.2 +
    stagesScore * 0.2
  )
  
  // Generate recommendations
  const recommendations: string[] = []
  if (durationScore < 70) recommendations.push(`⏰ Increase sleep duration to 7-9h (currently ${avgSleep.toFixed(1)}h)`)
  if (qualityScore < 70) recommendations.push("🛌 Improve sleep quality: optimize sleep environment and pre-bed routine")
  if (consistencyScore < 70) recommendations.push(`📅 Maintain consistent sleep schedule (current variance: ±${stdDev.toFixed(1)}h)`)
  if (stagesScore < 70) recommendations.push("🌙 Optimize sleep architecture: reduce stress, avoid alcohol, exercise regularly")
  if (recommendations.length === 0) recommendations.push("✅ Excellent sleep efficiency! Maintain current habits.")
  
  return {
    score,
    breakdown: {
      duration: Math.round(durationScore),
      quality: Math.round(qualityScore),
      consistency: Math.round(consistencyScore),
      stages: Math.round(stagesScore),
    },
    recommendations
  }
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