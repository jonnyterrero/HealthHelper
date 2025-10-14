/**
 * GastroGuard AI Chat Assistant
 * Specialized responses for digestive health queries
 */

export function generateGastroResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();

  // Food and diet related queries
  if (
    promptLower.includes("food") ||
    promptLower.includes("eat") ||
    promptLower.includes("meal") ||
    promptLower.includes("diet") ||
    promptLower.includes("nutrition")
  ) {
    if (promptLower.includes("trigger") || promptLower.includes("avoid")) {
      return `🍽️ **Food Trigger Analysis**

Based on your symptom patterns, here are common trigger foods to consider:

**High-Risk Foods:**
• Spicy foods (peppers, hot sauces)
• Acidic foods (citrus, tomatoes, vinegar)
• Fatty/fried foods
• Caffeine and alcohol
• Carbonated beverages

**Recommendations:**
• Keep a detailed food diary for 2 weeks
• Try elimination diet (remove suspected triggers for 2 weeks)
• Eat smaller, more frequent meals
• Avoid eating 3 hours before bedtime

Would you like me to analyze your recent food logs for specific patterns?`;
    } else if (promptLower.includes("recommend") || promptLower.includes("suggest")) {
      return `🥗 **Digestive-Friendly Food Recommendations**

**Gentle Foods for Sensitive Stomachs:**
• Oatmeal and rice
• Bananas and applesauce
• Boiled vegetables
• Lean proteins (chicken, fish)
• Probiotic foods (yogurt, kefir)

**Meal Timing Tips:**
• Eat every 3-4 hours
• Smaller portions, more frequently
• Chew slowly and thoroughly
• Stay hydrated between meals

**Food Preparation:**
• Steam or boil instead of frying
• Use mild seasonings
• Avoid very hot or very cold foods

Track your meals in the app to see which foods work best for you!`;
    } else {
      return `🍎 **Food & Digestive Health**

I can help you with:
• Identifying food triggers
• Meal planning for digestive health
• Nutritional recommendations
• Food timing and portion advice

What specific aspect of your diet would you like to discuss?`;
    }
  }

  // Pain and symptom related queries
  else if (
    promptLower.includes("pain") ||
    promptLower.includes("hurt") ||
    promptLower.includes("ache") ||
    promptLower.includes("discomfort") ||
    promptLower.includes("cramp")
  ) {
    if (promptLower.includes("stomach") || promptLower.includes("abdominal")) {
      return `🤕 **Stomach Pain Management**

**Immediate Relief:**
• Apply gentle heat (warm compress)
• Try deep breathing exercises
• Sip warm water or herbal tea
• Avoid lying flat - prop yourself up

**When to Seek Medical Help:**
• Severe, persistent pain
• Pain with fever or vomiting
• Blood in stool or vomit
• Sudden, sharp pain

**Prevention Strategies:**
• Track pain patterns with food intake
• Manage stress levels
• Maintain regular meal times
• Stay hydrated

Use the app to log your pain levels and identify triggers!`;
    } else {
      return `💊 **Pain Management**

I can help you with:
• Pain tracking and patterns
• Relief strategies
• When to seek medical attention
• Medication timing

What type of pain are you experiencing?`;
    }
  }

  // Medication related queries
  else if (
    promptLower.includes("medication") ||
    promptLower.includes("medicine") ||
    promptLower.includes("drug") ||
    promptLower.includes("pill") ||
    promptLower.includes("prescription")
  ) {
    return `💊 **Medication Management**

**Timing Tips:**
• Take medications with food unless directed otherwise
• Set phone reminders for consistency
• Keep a medication log in the app
• Don't skip doses without consulting your doctor

**Common Gastrointestinal Medications:**
• Antacids: Take 1 hour after meals
• Proton pump inhibitors: Take 30 minutes before breakfast
• H2 blockers: Take with or without food
• Probiotics: Take with meals

**Side Effect Management:**
• Nausea: Take with food, try ginger tea
• Diarrhea: Stay hydrated, eat bland foods
• Constipation: Increase fiber gradually, stay active

Always consult your healthcare provider about medication concerns!`;
  }

  // Stress and lifestyle queries
  else if (
    promptLower.includes("stress") ||
    promptLower.includes("anxiety") ||
    promptLower.includes("worry") ||
    promptLower.includes("nervous")
  ) {
    return `🧘 **Stress & Digestive Health**

**The Gut-Brain Connection:**
Stress directly affects your digestive system through the gut-brain axis.

**Stress Management Techniques:**
• Deep breathing exercises (4-7-8 technique)
• Progressive muscle relaxation
• Regular exercise (even gentle walking)
• Adequate sleep (7-9 hours)
• Mindfulness meditation

**Digestive Benefits:**
• Reduces inflammation
• Improves gut motility
• Enhances nutrient absorption
• Supports healthy gut bacteria

**Quick Stress Relief:**
• 5-minute breathing exercise
• Gentle abdominal massage
• Warm herbal tea
• Short walk outdoors

Track your stress levels in the app to see correlations with symptoms!`;
  }

  // General health queries
  else if (
    promptLower.includes("symptom") ||
    promptLower.includes("pattern") ||
    promptLower.includes("trend") ||
    promptLower.includes("analysis")
  ) {
    return `📊 **Symptom Pattern Analysis**

**What I Can Help Analyze:**
• Food-symptom correlations
• Pain timing patterns
• Stress-symptom relationships
• Medication effectiveness
• Lifestyle factor impacts

**Key Metrics to Track:**
• Pain levels (0-10 scale)
• Meal times and content
• Stress levels
• Sleep quality
• Medication adherence

**Pattern Recognition:**
• Peak symptom times
• Trigger food identification
• Effective remedy tracking
• Seasonal or cyclical patterns

Use the app's tracking features to build a comprehensive picture of your digestive health!`;
  }

  // Default response
  else {
    return `🤖 **GastroGuard AI Assistant**

Thank you for your question about "${prompt}". I'm specialized in digestive health and can help you with:

• **Food Analysis**: Identifying triggers and making dietary recommendations
• **Symptom Tracking**: Understanding patterns and correlations
• **Medication Management**: Timing, side effects, and adherence
• **Lifestyle Factors**: Stress, sleep, and exercise impacts
• **Pain Management**: Relief strategies and when to seek help

What specific aspect of your digestive health would you like to explore? I can analyze your logged data to provide personalized insights.`;
  }
}