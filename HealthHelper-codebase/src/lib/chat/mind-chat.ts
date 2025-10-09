/**
 * MindTrack AI Chat Assistant
 * Specialized responses for mental health queries
 */

export function generateMindResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();

  // Mood related queries
  if (promptLower.includes("mood")) {
    return `💭 **Mood Tracking & Management**

I notice you're asking about mood. Regular mood tracking can help identify patterns and triggers.

**Benefits of Mood Tracking:**
• Identify emotional patterns over time
• Recognize triggers (people, places, activities)
• Monitor effectiveness of coping strategies
• Share insights with healthcare providers

**Tips for Better Mood:**
• Practice gratitude journaling
• Engage in activities you enjoy
• Connect with supportive people
• Get regular exercise
• Maintain consistent sleep schedule

**When to Seek Help:**
• Persistent low mood for 2+ weeks
• Thoughts of self-harm
• Inability to function daily
• Severe mood swings

Consider tracking your mood daily and noting what activities or events might be affecting it. What specific mood concerns are you experiencing?`;
  }

  // Sleep related queries
  else if (promptLower.includes("sleep")) {
    return `😴 **Sleep & Mental Health**

Sleep is crucial for mental health and overall wellbeing.

**Healthy Sleep Habits:**
• Aim for 7-9 hours per night
• Go to bed and wake up at the same time
• Create a relaxing bedtime routine
• Avoid screens 1 hour before bed
• Keep bedroom cool, dark, and quiet

**Sleep Hygiene Tips:**
• No caffeine after 2 PM
• Avoid heavy meals before bed
• Try meditation or deep breathing
• Limit daytime naps to 20-30 minutes

**Impact on Mental Health:**
• Poor sleep increases anxiety and depression
• Good sleep improves mood and focus
• Sleep regulates emotions and stress

**When to Seek Help:**
• Insomnia lasting 3+ weeks
• Excessive daytime sleepiness
• Sleep disturbances affecting daily life

Use the app's sleep tracker to monitor patterns and identify improvements!`;
  }

  // Stress related queries
  else if (
    promptLower.includes("stress") ||
    promptLower.includes("overwhelm") ||
    promptLower.includes("pressure")
  ) {
    return `🧘 **Stress Management**

Stress management is important for both mental and physical health.

**Immediate Stress Relief:**
• 4-7-8 breathing (inhale 4, hold 7, exhale 8)
• Progressive muscle relaxation
• 5-minute walk or stretching
• Listen to calming music
• Call a supportive friend

**Long-Term Strategies:**
• Regular exercise (30 min, 5x/week)
• Meditation or mindfulness practice
• Time management and prioritization
• Set healthy boundaries
• Practice self-compassion

**Physical Symptoms of Stress:**
• Headaches, muscle tension
• Digestive issues
• Sleep problems
• Fatigue

**When to Seek Help:**
• Chronic stress affecting daily life
• Physical symptoms persist
• Using unhealthy coping mechanisms
• Feeling unable to cope

What specific stressors are you dealing with? I can help you develop a personalized stress management plan.`;
  }

  // Anxiety related queries
  else if (promptLower.includes("anxiety") || promptLower.includes("anxious") || promptLower.includes("worry")) {
    return `😰 **Anxiety Support**

Anxiety is treatable, and there are many effective strategies to manage it.

**Grounding Techniques (5-4-3-2-1):**
• 5 things you can see
• 4 things you can touch
• 3 things you can hear
• 2 things you can smell
• 1 thing you can taste

**Breathing Exercises:**
• Box breathing (4-4-4-4)
• Deep belly breathing
• Alternate nostril breathing

**Cognitive Strategies:**
• Challenge anxious thoughts
• Focus on what you can control
• Practice acceptance
• Use positive affirmations

**Lifestyle Factors:**
• Limit caffeine and alcohol
• Regular exercise
• Adequate sleep
• Balanced diet

**When to Seek Professional Help:**
• Anxiety interfering with daily activities
• Panic attacks
• Avoidance behaviors
• Physical symptoms (chest pain, dizziness)

Track your anxiety levels and triggers in the app to understand patterns better!`;
  }

  // Medication related queries
  else if (
    promptLower.includes("medication") ||
    promptLower.includes("medicine") ||
    promptLower.includes("prescription") ||
    promptLower.includes("pill")
  ) {
    return `💊 **Medication Management**

Medication adherence is key for effectiveness in mental health treatment.

**Adherence Tips:**
• Set daily reminders on your phone
• Use a pill organizer
• Link medication to daily routine (e.g., breakfast)
• Track doses in the app
• Keep medications visible (not hidden)

**Important Considerations:**
• Take medications as prescribed
• Don't stop suddenly without doctor approval
• Report side effects to your provider
• Be patient - many medications take 4-6 weeks to work
• Attend regular follow-up appointments

**Common Side Effects:**
• Initial: Nausea, headache, drowsiness
• Usually improve after 1-2 weeks
• Report severe or persistent side effects

**When to Contact Your Doctor:**
• Severe side effects
• No improvement after 6-8 weeks
• Worsening symptoms
• Thoughts of self-harm

Always consult with your healthcare provider about any medication concerns. Never adjust doses or stop medications without professional guidance.`;
  }

  // Therapy and coping strategies
  else if (
    promptLower.includes("therapy") ||
    promptLower.includes("coping") ||
    promptLower.includes("help") ||
    promptLower.includes("strategy")
  ) {
    return `🛠️ **Coping Strategies & Resources**

Building a toolkit of healthy coping strategies is essential for mental health.

**Healthy Coping Strategies:**
• **Physical**: Exercise, yoga, walking, dancing
• **Creative**: Art, music, writing, cooking
• **Social**: Talk to friends, join groups, volunteer
• **Mindful**: Meditation, deep breathing, journaling
• **Relaxation**: Bath, massage, nature, reading

**Types of Therapy:**
• Cognitive Behavioral Therapy (CBT)
• Dialectical Behavior Therapy (DBT)
• Acceptance and Commitment Therapy (ACT)
• Mindfulness-Based Therapy
• Group Therapy

**Crisis Resources:**
• 988 Suicide & Crisis Lifeline: Call or text 988
• Crisis Text Line: Text HOME to 741741
• NAMI HelpLine: 1-800-950-6264

**Self-Care Activities:**
• Practice daily gratitude
• Maintain regular routine
• Connect with nature
• Limit news/social media
• Engage in hobbies

What specific coping strategies have you found helpful? I can help you build a personalized wellness plan.`;
  }

  // Default response
  else {
    return `🧠 **MindTrack AI Assistant**

Thank you for your question about "${prompt}". I'm here to support your mental health journey.

**I can help you with:**
• **Mood Tracking**: Understanding emotional patterns and triggers
• **Sleep Management**: Improving sleep quality and habits
• **Stress Reduction**: Effective stress management techniques
• **Anxiety Support**: Grounding techniques and coping strategies
• **Medication Support**: Adherence tips and side effect management
• **Coping Skills**: Building healthy coping strategies

**Remember:**
• Mental health is as important as physical health
• It's okay to ask for help
• Recovery is possible with the right support
• Small steps lead to big changes

What aspect of your mental health would you like to focus on today? I'm here to provide information and support, but please consult healthcare professionals for medical advice.`;
  }
}