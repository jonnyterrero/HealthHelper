/**
 * SkinTrack AI Dermatology Chat Assistant
 * Specialized responses for skin health and lesion tracking
 */

export function generateSkinResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();

  // Photo and lesion tracking queries
  if (
    promptLower.includes("photo") ||
    promptLower.includes("picture") ||
    promptLower.includes("image") ||
    promptLower.includes("lesion") ||
    promptLower.includes("mole")
  ) {
    return `📸 **Lesion Photo Tracking**

Regular photo documentation is crucial for monitoring skin changes over time.

**Photography Best Practices:**
• Use natural lighting when possible
• Take photos from the same angle each time
• Include a ruler or coin for size reference
• Take close-up and overview shots
• Document the same lesion weekly or monthly

**What to Monitor (ABCDE Rule):**
• **A**symmetry: One half doesn't match the other
• **B**order: Irregular, scalloped, or poorly defined edges
• **C**olor: Varied colors (brown, black, tan, red, white, blue)
• **D**iameter: Larger than 6mm (pencil eraser size)
• **E**volving: Changes in size, shape, color, or symptoms

**When to See a Dermatologist:**
• New mole after age 30
• Mole that looks different from others
• Mole that bleeds, itches, or doesn't heal
• Any rapid changes in appearance

**Digital Tracking Benefits:**
• Compare photos side-by-side
• Track growth patterns over time
• Share documentation with doctors
• Peace of mind from regular monitoring

Use the app to upload and date your lesion photos for comprehensive tracking!`;
  }

  // Trend and pattern analysis
  else if (
    promptLower.includes("trend") ||
    promptLower.includes("pattern") ||
    promptLower.includes("change") ||
    promptLower.includes("analysis")
  ) {
    return `📊 **Skin Trend Analysis**

Understanding your skin patterns helps identify triggers and track treatment effectiveness.

**Key Metrics to Track:**
• Lesion size and appearance
• Flare-up frequency and severity
• Environmental triggers (weather, stress)
• Product reactions
• Treatment responses

**Common Pattern Insights:**
• Seasonal flare-ups (winter dryness, summer sun exposure)
• Stress-related breakouts
• Hormonal cycle impacts
• Food or allergen triggers
• Product sensitivities

**Tracking Benefits:**
• Identify what works and what doesn't
• Predict and prevent flare-ups
• Optimize treatment timing
• Share data with dermatologist

**AI-Powered Insights:**
• Correlation between triggers and symptoms
• Effectiveness of different treatments
• Optimal skincare routine adjustments
• Warning signs of concerning changes

Review your logged data regularly to spot patterns and discuss findings with your healthcare provider!`;
  }

  // Treatment and skincare queries
  else if (
    promptLower.includes("treatment") ||
    promptLower.includes("cream") ||
    promptLower.includes("medication") ||
    promptLower.includes("skincare") ||
    promptLower.includes("routine")
  ) {
    return `💊 **Skincare & Treatment Management**

Consistent skincare and proper treatment application are key to managing skin conditions.

**General Skincare Routine:**
1. **Morning:**
   • Gentle cleanser
   • Treatment products (as prescribed)
   • Moisturizer
   • Broad-spectrum SPF 30+

2. **Evening:**
   • Remove makeup/sunscreen
   • Gentle cleanser
   • Treatment products
   • Moisturizer

**Treatment Application Tips:**
• Apply to clean, dry skin
• Use the right amount (pea-sized for face)
• Wait 5-10 minutes before next product
• Be consistent - results take 6-12 weeks
• Track application in the app

**Common Treatments:**
• **Retinoids**: Start slow, use at night
• **Benzoyl Peroxide**: Can bleach fabrics
• **Salicylic Acid**: Exfoliates and unclogs pores
• **Hydrocortisone**: Short-term use only
• **Moisturizers**: Apply to damp skin

**When to Contact Dermatologist:**
• No improvement after 12 weeks
• Worsening symptoms
• Severe side effects
• New concerning lesions

Always patch test new products and introduce one at a time to identify sensitivities!`;
  }

  // Triggers and flare-ups
  else if (
    promptLower.includes("trigger") ||
    promptLower.includes("flare") ||
    promptLower.includes("breakout") ||
    promptLower.includes("worse")
  ) {
    return `⚠️ **Trigger Identification & Flare-Up Management**

Understanding your triggers helps prevent and manage flare-ups.

**Common Skin Triggers:**
• **Environmental**: Sun, cold, wind, humidity changes
• **Products**: Fragrances, dyes, harsh chemicals
• **Lifestyle**: Stress, lack of sleep, poor diet
• **Physical**: Sweat, friction, tight clothing
• **Allergens**: Pollen, dust, pet dander
• **Foods**: Dairy, sugar, processed foods (varies by person)

**Flare-Up First Aid:**
• Stop using all new products
• Return to basic routine (gentle cleanser + moisturizer)
• Cool compress for inflammation
• Avoid scratching or picking
• Stay hydrated
• Get adequate sleep

**Prevention Strategies:**
• Keep a trigger diary
• Patch test new products
• Maintain consistent routine
• Manage stress levels
• Protect from environmental extremes
• Use fragrance-free products

**Emergency Signs:**
• Severe swelling or pain
• Signs of infection (pus, fever)
• Widespread rash
• Difficulty breathing

Track your flare-ups and potential triggers in the app to identify patterns over time!`;
  }

  // Skin conditions (eczema, psoriasis, acne, etc.)
  else if (
    promptLower.includes("eczema") ||
    promptLower.includes("psoriasis") ||
    promptLower.includes("acne") ||
    promptLower.includes("rosacea") ||
    promptLower.includes("dermatitis")
  ) {
    return `🩺 **Skin Condition Management**

Managing chronic skin conditions requires a comprehensive approach.

**General Management Principles:**
• Consistent skincare routine
• Identify and avoid triggers
• Use prescribed medications as directed
• Moisturize regularly (especially after bathing)
• Protect from sun exposure
• Manage stress
• Maintain healthy lifestyle

**Condition-Specific Tips:**

**Eczema/Dermatitis:**
• Moisturize 2-3x daily
• Use lukewarm water (not hot)
• Wear soft, breathable fabrics
• Identify food triggers

**Psoriasis:**
• Keep skin moisturized
• Consider UV therapy
• Avoid skin injuries
• Manage stress

**Acne:**
• Don't over-wash (2x daily max)
• Avoid picking or squeezing
• Use non-comedogenic products
• Change pillowcases regularly

**Rosacea:**
• Avoid triggers (spicy food, alcohol, hot drinks)
• Use gentle, fragrance-free products
• Protect from sun and wind
• Consider trigger diary

**When to See a Specialist:**
• Home treatments aren't working
• Condition worsening
• Affecting quality of life
• Possible infection

Use the app to track flare-ups, treatments, and triggers to optimize your management plan!`;
  }

  // Sun protection and prevention
  else if (
    promptLower.includes("sun") ||
    promptLower.includes("spf") ||
    promptLower.includes("sunscreen") ||
    promptLower.includes("uv")
  ) {
    return `☀️ **Sun Protection & Skin Cancer Prevention**

Sun protection is the #1 preventive measure for skin health and cancer prevention.

**Daily Sun Protection:**
• Apply SPF 30+ broad-spectrum sunscreen daily
• Reapply every 2 hours (more if swimming/sweating)
• Use 1 ounce (shot glass) for full body
• Apply 15 minutes before sun exposure
• Don't forget: ears, neck, hands, feet

**Additional Protection:**
• Wear protective clothing (UPF 50+)
• Wide-brimmed hat (3-inch brim)
• UV-blocking sunglasses
• Seek shade between 10 AM - 4 PM
• Avoid tanning beds completely

**Skin Cancer Prevention:**
• Monthly self-exams (ABCDE rule)
• Annual dermatologist screening
• Document new or changing moles
• Know your skin type and risk factors
• Report any concerning changes immediately

**Sunscreen Selection:**
• Mineral (zinc oxide, titanium dioxide) or chemical
• Water-resistant for activities
• Fragrance-free for sensitive skin
• Check expiration dates

**Risk Factors for Skin Cancer:**
• Fair skin that burns easily
• History of sunburns
• Many moles (50+)
• Family history
• Weakened immune system

Make sunscreen a daily habit, even on cloudy days - UV rays penetrate clouds!`;
  }

  // Default response
  else {
    return `🔬 **SkinTrack AI Dermatology Assistant**

Thank you for your question about "${prompt}". I'm specialized in dermatological health and can help you with:

**Core Features:**
• **Photo Tracking**: Document and monitor lesions over time
• **Trend Analysis**: Identify patterns in flare-ups and triggers
• **Treatment Tracking**: Monitor effectiveness of skincare routines
• **Trigger Identification**: Discover what causes your skin issues
• **Skin Cancer Screening**: Learn ABCDE warning signs

**I Can Help With:**
• Acne, eczema, psoriasis, rosacea management
• Sun protection and skin cancer prevention
• Skincare routine optimization
• Product recommendations
• When to see a dermatologist

**Important Reminders:**
• Perform monthly self-exams
• See a dermatologist annually
• Use sunscreen daily (SPF 30+)
• Document any changes in moles or lesions

What aspect of your skin health would you like to discuss? I can provide information and tracking tools, but always consult a dermatologist for medical diagnosis and treatment.`;
  }
}