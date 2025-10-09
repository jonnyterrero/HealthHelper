import { type HealthEntry, saveEntries, todayISO } from "./health";

/**
 * Generate sample health data for the past 30 days
 * Includes realistic patterns and correlations for ML insights
 */
export function generateSampleData(): HealthEntry[] {
  const entries: HealthEntry[] = [];
  const today = new Date();
  
  // Generate 30 days of sample data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    
    // Simulate patterns and correlations
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Base values with some randomness
    const stressLevel = isWeekend ? 
      Math.floor(Math.random() * 4) + 2 : // Weekend: 2-5
      Math.floor(Math.random() * 5) + 5;  // Weekday: 5-9
    
    const sleepHours = isWeekend ?
      7.5 + Math.random() * 2 :     // Weekend: 7.5-9.5h
      5.5 + Math.random() * 2;      // Weekday: 5.5-7.5h
    
    // Sleep quality correlates inversely with stress
    const sleepQuality = Math.max(1, Math.min(10, 
      Math.floor(10 - (stressLevel * 0.6) + (sleepHours - 5) * 0.8 + Math.random() * 2)
    ));
    
    // Mood inversely correlates with stress and positively with sleep
    const mood = Math.max(0, Math.min(10,
      Math.floor(8 - (stressLevel * 0.5) + (sleepHours - 6) * 0.7 + Math.random() * 2)
    ));
    
    const anxiety = Math.max(0, Math.min(10,
      Math.floor(stressLevel * 0.8 + Math.random() * 3)
    ));
    
    const energy = Math.max(0, Math.min(10,
      Math.floor(mood * 0.7 + (sleepHours - 5) * 0.5 + Math.random() * 2)
    ));
    
    // Stomach issues correlate with stress and certain food triggers
    const hadDairy = Math.random() > 0.7;
    const hadGluten = Math.random() > 0.6;
    const hadSpicy = Math.random() > 0.8;
    const hadAlcohol = isWeekend && Math.random() > 0.6;
    const hadCaffeine = !isWeekend && Math.random() > 0.3;
    
    const stomachSeverity = Math.max(0, Math.min(10, Math.floor(
      (stressLevel * 0.4) +
      (hadDairy ? 2 : 0) +
      (hadGluten ? 1.5 : 0) +
      (hadSpicy ? 2 : 0) +
      (hadAlcohol ? 1 : 0) +
      (sleepHours < 6 ? 2 : 0) +
      Math.random() * 2
    )));
    
    // Skin issues correlate with stress, sleep, and environmental factors
    const weatherTrigger = Math.random() > 0.7;
    const cosmeticsTrigger = Math.random() > 0.85;
    const sweatTrigger = Math.random() > 0.8;
    const dietSugarTrigger = Math.random() > 0.7;
    
    const skinSeverity = Math.max(0, Math.min(10, Math.floor(
      (stressLevel * 0.3) +
      (sleepHours < 6 ? 2 : 0) +
      (weatherTrigger ? 2 : 0) +
      (cosmeticsTrigger ? 3 : 0) +
      (sweatTrigger ? 1 : 0) +
      (dietSugarTrigger ? 1.5 : 0) +
      Math.random() * 2
    )));
    
    // Symptoms correlate with overall health
    const giFlare = Math.max(0, Math.min(10, Math.floor(
      stomachSeverity * 0.7 + (stressLevel * 0.3) + Math.random() * 2
    )));
    
    const skinFlare = Math.max(0, Math.min(10, Math.floor(
      skinSeverity * 0.8 + Math.random() * 2
    )));
    
    const migraine = Math.max(0, Math.min(10, Math.floor(
      (stressLevel * 0.5) +
      (sleepHours < 6 ? 3 : 0) +
      (hadCaffeine && sleepHours < 6 ? 2 : 0) +
      Math.random() * 2
    )));
    
    const fatigue = Math.max(0, Math.min(10, Math.floor(
      10 - energy + (stressLevel * 0.2) + Math.random() * 2
    )));
    
    // Random meal timing for late-night eating pattern
    const lateMeal = Math.random() > 0.8;
    const mealTime = lateMeal ? "21:30" : "18:30";
    
    entries.push({
      date: dateStr,
      stomach: {
        date: dateStr,
        severity: stomachSeverity,
        painLocation: stomachSeverity > 5 ? 
          ["upper-abdomen", "lower-abdomen", "generalized"][Math.floor(Math.random() * 3)] : 
          undefined,
        bowelChanges: stomachSeverity > 4 ?
          ["none", "constipation", "diarrhea", "alternating"][Math.floor(Math.random() * 4)] :
          "none",
        triggers: {
          dairy: hadDairy,
          gluten: hadGluten,
          spicy: hadSpicy,
          alcohol: hadAlcohol,
          caffeine: hadCaffeine,
        },
        notes: stomachSeverity > 6 ? "Noticeable discomfort after meals" : undefined,
      },
      skin: {
        date: dateStr,
        severity: skinSeverity,
        area: skinSeverity > 4 ?
          ["face", "scalp", "arms", "torso", "legs"][Math.floor(Math.random() * 5)] :
          undefined,
        rash: skinSeverity > 6 && Math.random() > 0.5,
        itch: skinSeverity > 5 && Math.random() > 0.4,
        triggers: {
          cosmetics: cosmeticsTrigger,
          detergent: Math.random() > 0.9,
          weather: weatherTrigger,
          sweat: sweatTrigger,
          dietSugar: dietSugarTrigger,
        },
        notes: skinSeverity > 7 ? "Increased inflammation" : undefined,
      },
      mental: {
        date: dateStr,
        mood,
        anxiety,
        sleepHours,
        sleepQuality,
        bedTime: isWeekend ? "23:30" : "22:45",
        wakeTime: isWeekend ? "08:30" : "06:30",
        stressLevel,
        energy,
        focus: Math.max(0, Math.min(10, energy - Math.floor(Math.random() * 2))),
        notes: stressLevel > 7 ? "High workload today" : undefined,
      },
      symptoms: {
        date: dateStr,
        giFlare,
        skinFlare,
        migraine,
        fatigue,
        notes: (giFlare > 7 || skinFlare > 7 || migraine > 7) ? 
          "Multiple symptoms flaring today" : undefined,
      },
      nutrition: {
        date: dateStr,
        meals: {
          date: dateStr,
          meals: [
            {
              name: "Oatmeal with berries",
              portion: "1 bowl",
              calories: 300,
              protein: 8,
              carbs: 54,
              fat: 6,
              time: "07:30",
            },
            {
              name: hadDairy ? "Grilled cheese sandwich" : "Chicken salad",
              portion: "1 serving",
              calories: hadDairy ? 450 : 320,
              protein: hadDairy ? 18 : 35,
              carbs: hadDairy ? 35 : 12,
              fat: hadDairy ? 24 : 15,
              time: "12:30",
            },
            {
              name: hadSpicy ? "Spicy curry" : hadGluten ? "Pasta with tomato sauce" : "Grilled salmon with vegetables",
              portion: "1 plate",
              calories: hadSpicy ? 550 : hadGluten ? 480 : 420,
              protein: hadSpicy ? 25 : hadGluten ? 15 : 38,
              carbs: hadSpicy ? 65 : hadGluten ? 72 : 18,
              fat: hadSpicy ? 18 : hadGluten ? 12 : 22,
              time: mealTime,
            },
          ],
          waterIntake: Math.floor(1500 + Math.random() * 1500), // 1.5-3L
          notes: lateMeal ? "Ate late tonight" : undefined,
        },
        symptoms: {
          stomach: stomachSeverity,
          skin: skinSeverity,
          energy: energy,
        },
        correlations: [
          ...(hadDairy && stomachSeverity > 5 ? ["dairy → stomach discomfort"] : []),
          ...(hadGluten && stomachSeverity > 4 ? ["gluten → bloating"] : []),
          ...(hadSpicy && stomachSeverity > 6 ? ["spicy food → gastro pain"] : []),
          ...(dietSugarTrigger && skinSeverity > 5 ? ["sugar → skin inflammation"] : []),
          ...(lateMeal && stomachSeverity > 5 ? ["late meals → poor digestion"] : []),
        ],
      },
    });
  }
  
  return entries;
}

/**
 * Load sample data into localStorage
 * Returns the generated entries
 */
export function loadSampleData(): HealthEntry[] {
  const sampleData = generateSampleData();
  saveEntries(sampleData);
  return sampleData;
}

/**
 * Generate a quick demo entry for today
 * Useful for first-time users to see immediate results
 */
export function generateTodayDemo(): HealthEntry {
  const dateStr = todayISO();
  
  return {
    date: dateStr,
    stomach: {
      date: dateStr,
      severity: 6,
      painLocation: "upper-abdomen",
      bowelChanges: "none",
      triggers: {
        dairy: true,
        gluten: false,
        spicy: true,
        alcohol: false,
        caffeine: true,
      },
      notes: "Had cheese pizza for lunch, feeling uncomfortable",
    },
    skin: {
      date: dateStr,
      severity: 4,
      area: "face",
      rash: false,
      itch: true,
      triggers: {
        cosmetics: false,
        detergent: false,
        weather: true,
        sweat: false,
        dietSugar: true,
      },
      notes: "Slight dryness from weather change",
    },
    mental: {
      date: dateStr,
      mood: 6,
      anxiety: 7,
      sleepHours: 6.5,
      sleepQuality: 5,
      bedTime: "23:30",
      wakeTime: "06:00",
      stressLevel: 7,
      energy: 5,
      focus: 6,
      notes: "Busy day at work, feeling somewhat stressed",
    },
    symptoms: {
      date: dateStr,
      giFlare: 6,
      skinFlare: 4,
      migraine: 3,
      fatigue: 6,
      notes: "Moderate symptoms, manageable with rest",
    },
    nutrition: {
      date: dateStr,
      meals: {
        date: dateStr,
        meals: [
          {
            name: "Coffee and bagel",
            portion: "1 bagel, 1 coffee",
            calories: 350,
            protein: 12,
            carbs: 58,
            fat: 8,
            time: "07:30",
          },
          {
            name: "Cheese pizza (2 slices)",
            portion: "2 slices",
            calories: 570,
            protein: 24,
            carbs: 68,
            fat: 22,
            time: "12:30",
          },
          {
            name: "Grilled chicken with rice and broccoli",
            portion: "1 plate",
            calories: 520,
            protein: 42,
            carbs: 58,
            fat: 12,
            time: "19:00",
          },
        ],
        waterIntake: 2200,
        notes: "Good hydration today",
      },
      symptoms: {
        stomach: 6,
        skin: 4,
        energy: 5,
      },
      correlations: [
        "dairy → stomach discomfort",
        "caffeine → increased anxiety",
      ],
    },
  };
}