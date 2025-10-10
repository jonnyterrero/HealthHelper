"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { loadEntries, lastNDays } from "@/lib/health";
import { ArrowLeft, Sparkles, Heart, Leaf, Activity, Coffee, Moon, AlertCircle } from "lucide-react";

type Remedy = {
  name: string;
  category: "herbal" | "dietary" | "lifestyle" | "supplement" | "therapy";
  description: string;
  effectiveness: "high" | "medium" | "low";
  symptoms: string[];
  instructions: string;
  precautions?: string;
};

const REMEDIES_DATABASE: Remedy[] = [
  // Digestive/GI Remedies
  {
    name: "Ginger Tea",
    category: "herbal",
    description: "Natural anti-inflammatory that soothes digestive discomfort",
    effectiveness: "high",
    symptoms: ["gi_flare", "nausea", "stomach_pain"],
    instructions: "Steep fresh ginger slices in hot water for 10 minutes. Drink 2-3 times daily.",
    precautions: "May interact with blood thinners. Consult doctor if pregnant."
  },
  {
    name: "Peppermint Oil",
    category: "herbal",
    description: "Relieves IBS symptoms and intestinal cramping",
    effectiveness: "high",
    symptoms: ["gi_flare", "bloating", "stomach_pain"],
    instructions: "Take enteric-coated capsules (0.2-0.4ml) 30 minutes before meals.",
    precautions: "Avoid if you have GERD or heartburn."
  },
  {
    name: "Low-FODMAP Diet",
    category: "dietary",
    description: "Reduces fermentable carbs that trigger digestive symptoms",
    effectiveness: "high",
    symptoms: ["gi_flare", "bloating", "bowel_changes"],
    instructions: "Eliminate high-FODMAP foods for 2-6 weeks, then reintroduce gradually.",
    precautions: "Work with a dietitian for proper implementation."
  },
  {
    name: "Probiotics",
    category: "supplement",
    description: "Restores gut microbiome balance",
    effectiveness: "medium",
    symptoms: ["gi_flare", "bloating", "bowel_changes"],
    instructions: "Take daily probiotic supplement with at least 10 billion CFU.",
    precautions: "Choose multi-strain formulas. May take 4-8 weeks to see results."
  },
  {
    name: "Stress Reduction Techniques",
    category: "therapy",
    description: "Gut-brain axis connection: managing stress improves digestion",
    effectiveness: "high",
    symptoms: ["gi_flare", "anxiety", "stress"],
    instructions: "Practice deep breathing, meditation, or yoga for 15-20 minutes daily.",
    precautions: "Consider working with a therapist for chronic stress."
  },

  // Skin Remedies
  {
    name: "Colloidal Oatmeal Bath",
    category: "herbal",
    description: "Soothes inflamed, itchy skin and eczema flares",
    effectiveness: "high",
    symptoms: ["skin_flare", "itch", "rash"],
    instructions: "Add 1 cup colloidal oatmeal to lukewarm bath. Soak for 15-20 minutes.",
    precautions: "Pat skin dry gently. Apply moisturizer immediately after."
  },
  {
    name: "Coconut Oil",
    category: "herbal",
    description: "Natural moisturizer with antimicrobial properties",
    effectiveness: "medium",
    symptoms: ["skin_flare", "dryness", "itch"],
    instructions: "Apply virgin coconut oil to affected areas 2-3 times daily.",
    precautions: "Do patch test first. May not suit oily/acne-prone skin."
  },
  {
    name: "Anti-Inflammatory Diet",
    category: "dietary",
    description: "Reduces systemic inflammation that triggers skin issues",
    effectiveness: "high",
    symptoms: ["skin_flare", "inflammation"],
    instructions: "Focus on omega-3s, leafy greens, berries. Avoid processed foods, sugar, dairy.",
    precautions: "Track food-symptom correlations in your nutrition log."
  },
  {
    name: "Vitamin D Supplementation",
    category: "supplement",
    description: "Supports immune function and skin barrier repair",
    effectiveness: "medium",
    symptoms: ["skin_flare", "immune_issues"],
    instructions: "Take 1000-2000 IU daily. Get levels tested before megadosing.",
    precautions: "Excessive vitamin D can be harmful. Consult doctor."
  },
  {
    name: "Cool Compress",
    category: "lifestyle",
    description: "Immediate relief for itching and inflammation",
    effectiveness: "medium",
    symptoms: ["skin_flare", "itch", "inflammation"],
    instructions: "Apply clean, cool, damp cloth to affected area for 10-15 minutes.",
    precautions: "Don't use ice directly. Pat dry gently after."
  },

  // Mental Health & Sleep Remedies
  {
    name: "Chamomile Tea",
    category: "herbal",
    description: "Mild sedative that promotes relaxation and sleep",
    effectiveness: "medium",
    symptoms: ["anxiety", "sleep_issues", "stress"],
    instructions: "Drink 1 cup 30-60 minutes before bedtime.",
    precautions: "May interact with blood thinners. Avoid if allergic to ragweed."
  },
  {
    name: "Magnesium Glycinate",
    category: "supplement",
    description: "Supports nervous system relaxation and sleep quality",
    effectiveness: "high",
    symptoms: ["anxiety", "sleep_issues", "muscle_tension"],
    instructions: "Take 200-400mg 1-2 hours before bed.",
    precautions: "May cause diarrhea if dose too high. Start with low dose."
  },
  {
    name: "Sleep Hygiene Protocol",
    category: "lifestyle",
    description: "Optimizes sleep environment and routine",
    effectiveness: "high",
    symptoms: ["sleep_issues", "fatigue"],
    instructions: "Dark room, cool temp (65-68°F), no screens 1hr before bed, consistent schedule.",
    precautions: "Be patient - may take 2-4 weeks to see improvements."
  },
  {
    name: "Cognitive Behavioral Therapy (CBT)",
    category: "therapy",
    description: "Evidence-based treatment for anxiety and depression",
    effectiveness: "high",
    symptoms: ["anxiety", "depression", "stress"],
    instructions: "Work with licensed therapist for 8-16 weekly sessions.",
    precautions: "Most effective with consistent attendance and homework."
  },
  {
    name: "Morning Sunlight Exposure",
    category: "lifestyle",
    description: "Regulates circadian rhythm and boosts mood",
    effectiveness: "medium",
    symptoms: ["sleep_issues", "depression", "fatigue"],
    instructions: "Get 10-30 minutes of natural sunlight within 1 hour of waking.",
    precautions: "Don't stare directly at sun. Use sunscreen if prolonged exposure."
  },

  // Migraine Remedies
  {
    name: "Feverfew",
    category: "herbal",
    description: "Traditional migraine prevention herb",
    effectiveness: "medium",
    symptoms: ["migraine", "headache"],
    instructions: "Take 50-150mg daily extract or fresh leaves.",
    precautions: "Takes 4-6 weeks for effect. May cause mouth sores."
  },
  {
    name: "Riboflavin (Vitamin B2)",
    category: "supplement",
    description: "Reduces migraine frequency",
    effectiveness: "high",
    symptoms: ["migraine", "headache"],
    instructions: "Take 400mg daily for at least 3 months.",
    precautions: "May cause bright yellow urine (harmless). Take with food."
  },
  {
    name: "Caffeine Management",
    category: "dietary",
    description: "Consistent intake prevents rebound headaches",
    effectiveness: "medium",
    symptoms: ["migraine", "headache"],
    instructions: "Maintain consistent daily caffeine intake. Avoid sudden changes.",
    precautions: "Gradual reduction if trying to quit. Cold turkey can trigger migraines."
  },

  // Fatigue Remedies
  {
    name: "B-Complex Vitamins",
    category: "supplement",
    description: "Supports energy metabolism",
    effectiveness: "medium",
    symptoms: ["fatigue", "low_energy"],
    instructions: "Take B-complex daily with breakfast.",
    precautions: "May cause nausea on empty stomach. Choose methylated forms."
  },
  {
    name: "Regular Exercise",
    category: "lifestyle",
    description: "Paradoxically increases energy levels over time",
    effectiveness: "high",
    symptoms: ["fatigue", "low_energy", "depression"],
    instructions: "Start with 10-15 min daily walks. Gradually increase intensity.",
    precautions: "Don't overdo it. Rest is equally important."
  },
  {
    name: "Hydration Protocol",
    category: "lifestyle",
    description: "Dehydration is a common cause of fatigue",
    effectiveness: "medium",
    symptoms: ["fatigue", "headache", "brain_fog"],
    instructions: "Drink at least 8 cups water daily. More if exercising.",
    precautions: "Distribute throughout day. Don't chug large amounts at once."
  }
];

export default function RemediesPage() {
  const [entries] = React.useState(() => loadEntries());
  const [selectedSymptoms, setSelectedSymptoms] = React.useState<string[]>([]);
  const [activeCategory, setActiveCategory] = React.useState<string>("all");

  // Analyze user's recent symptoms from their data
  const userSymptoms = React.useMemo(() => {
    const recent = lastNDays(entries, 7);
    const symptoms = new Set<string>();

    recent.forEach((entry) => {
      if (entry.stomach && entry.stomach.severity > 5) symptoms.add("gi_flare");
      if (entry.skin && entry.skin.severity > 5) symptoms.add("skin_flare");
      if (entry.symptoms) {
        if (entry.symptoms.giFlare > 5) symptoms.add("gi_flare");
        if (entry.symptoms.skinFlare > 5) symptoms.add("skin_flare");
        if (entry.symptoms.migraine > 5) symptoms.add("migraine");
        if (entry.symptoms.fatigue > 5) symptoms.add("fatigue");
      }
      if (entry.mental) {
        if (entry.mental.anxiety > 7) symptoms.add("anxiety");
        if (entry.mental.sleepHours !== undefined && entry.mental.sleepHours < 6) symptoms.add("sleep_issues");
        if (entry.mental.stressLevel > 7) symptoms.add("stress");
      }
    });

    return Array.from(symptoms);
  }, [entries]);

  // Get remedy recommendations based on symptoms
  const recommendations = React.useMemo(() => {
    const symptomsToMatch = selectedSymptoms.length > 0 ? selectedSymptoms : userSymptoms;
    
    if (symptomsToMatch.length === 0) return [];

    return REMEDIES_DATABASE
      .map((remedy) => {
        const matchCount = remedy.symptoms.filter((s) => symptomsToMatch.includes(s)).length;
        return { remedy, matchCount, matchPercentage: (matchCount / symptomsToMatch.length) * 100 };
      })
      .filter((r) => r.matchCount > 0)
      .sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        const effectivenessOrder = { high: 3, medium: 2, low: 1 };
        return effectivenessOrder[b.remedy.effectiveness] - effectivenessOrder[a.remedy.effectiveness];
      });
  }, [selectedSymptoms, userSymptoms]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const symptomOptions = [
    { id: "gi_flare", label: "GI Flare/IBS", icon: "🔥" },
    { id: "stomach_pain", label: "Stomach Pain", icon: "💥" },
    { id: "bloating", label: "Bloating", icon: "🎈" },
    { id: "nausea", label: "Nausea", icon: "🤢" },
    { id: "skin_flare", label: "Skin Flare/Eczema", icon: "🌡️" },
    { id: "itch", label: "Itching", icon: "🔴" },
    { id: "rash", label: "Rash", icon: "🩹" },
    { id: "anxiety", label: "Anxiety", icon: "😰" },
    { id: "depression", label: "Depression", icon: "😔" },
    { id: "sleep_issues", label: "Sleep Issues", icon: "😴" },
    { id: "migraine", label: "Migraine", icon: "🤕" },
    { id: "fatigue", label: "Fatigue", icon: "🥱" },
    { id: "stress", label: "High Stress", icon: "😫" }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "herbal": return <Leaf className="w-4 h-4" />;
      case "dietary": return <Coffee className="w-4 h-4" />;
      case "lifestyle": return <Activity className="w-4 h-4" />;
      case "supplement": return <Heart className="w-4 h-4" />;
      case "therapy": return <Moon className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const filteredRecommendations = activeCategory === "all" 
    ? recommendations 
    : recommendations.filter(r => r.remedy.category === activeCategory);

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Natural Remedies</h1>
            <p className="text-muted-foreground">Evidence-based recommendations for symptom relief</p>
          </div>
        </div>
      </header>

      {/* Auto-detected symptoms alert */}
      {userSymptoms.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/50">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-300 font-semibold">Recent Symptoms Detected</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Based on your last 7 days of tracking, we've detected: {userSymptoms.map(s => s.replace(/_/g, ' ')).join(", ")}
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedSymptoms(userSymptoms)}
                className="text-xs"
              >
                Show Remedies for These Symptoms
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Symptom Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Symptoms</CardTitle>
          <CardDescription>Choose one or more symptoms to get personalized remedy recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map((symptom) => (
              <Badge
                key={symptom.id}
                variant={selectedSymptoms.includes(symptom.id) ? "default" : "outline"}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-accent transition-colors"
                onClick={() => toggleSymptom(symptom.id)}
              >
                <span className="mr-1">{symptom.icon}</span>
                {symptom.label}
              </Badge>
            ))}
          </div>
          {selectedSymptoms.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSymptoms([])}
              className="mt-3"
            >
              Clear All
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Select Symptoms to Get Started</p>
            <p className="text-muted-foreground">
              Choose your current symptoms above to receive personalized remedy recommendations
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Category Filter */}
          <Tabs defaultValue="all" onValueChange={setActiveCategory}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
              <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
              <TabsTrigger value="herbal">
                <Leaf className="w-4 h-4 mr-1" />
                Herbal
              </TabsTrigger>
              <TabsTrigger value="dietary">
                <Coffee className="w-4 h-4 mr-1" />
                Dietary
              </TabsTrigger>
              <TabsTrigger value="lifestyle">
                <Activity className="w-4 h-4 mr-1" />
                Lifestyle
              </TabsTrigger>
              <TabsTrigger value="supplement">
                <Heart className="w-4 h-4 mr-1" />
                Supplement
              </TabsTrigger>
              <TabsTrigger value="therapy">
                <Moon className="w-4 h-4 mr-1" />
                Therapy
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="border-green-200 dark:border-green-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                Recommended Remedies
              </CardTitle>
              <CardDescription>
                {filteredRecommendations.length} remedies matched to your symptoms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredRecommendations.map(({ remedy, matchPercentage }, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="gap-1">
                            {getCategoryIcon(remedy.category)}
                            {remedy.category}
                          </Badge>
                          <span className="font-medium">{remedy.name}</span>
                        </div>
                        <Badge 
                          variant={
                            remedy.effectiveness === "high" 
                              ? "default" 
                              : remedy.effectiveness === "medium" 
                              ? "secondary" 
                              : "outline"
                          }
                        >
                          {matchPercentage.toFixed(0)}% match
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <div>
                          <p className="text-sm text-muted-foreground">{remedy.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={
                            remedy.effectiveness === "high" 
                              ? "default" 
                              : remedy.effectiveness === "medium" 
                              ? "secondary" 
                              : "outline"
                          }>
                            {remedy.effectiveness} effectiveness
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Instructions</Label>
                          <p className="text-sm bg-muted p-3 rounded-lg">{remedy.instructions}</p>
                        </div>

                        {remedy.precautions && (
                          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/50">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="text-sm font-semibold">Precautions</AlertTitle>
                            <AlertDescription className="text-xs">
                              {remedy.precautions}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Helps with:</Label>
                          <div className="flex flex-wrap gap-1">
                            {remedy.symptoms.map((s, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {s.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Medical Disclaimer</AlertTitle>
            <AlertDescription className="text-xs">
              These remedies are for informational purposes only and not medical advice. Always consult with a qualified healthcare provider before starting any new treatment, especially if you have existing medical conditions, are pregnant, or are taking medications. Do not use these remedies as a substitute for professional medical care.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}