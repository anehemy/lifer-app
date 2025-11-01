import { invokeLLM } from "../_core/llm";
import type { JournalEntry } from "../../drizzle/schema";

/**
 * Experience Analysis based on psychological research frameworks:
 * - Event Characteristics Questionnaire (ECQ) - 9 dimensions
 * - Life Themes Framework - 6 core human concerns
 * - Pattern Recognition - experience archetypes
 */

export interface ExperienceAnalysisResult {
  // ECQ Dimensions (1-10 scale)
  valence: "positive" | "negative" | "neutral";
  impact: number;
  predictability: number;
  challenge: number;
  emotionalSignificance: number;
  worldviewChange: number;
  
  // Life Themes
  primaryTheme: "Love" | "Value" | "Power" | "Freedom" | "Truth" | "Justice";
  secondaryThemes: string[];
  
  // Pattern Recognition
  experienceArchetype: string;
  keywords: string[];
  emotionalTone: string;
  
  // For semantic similarity (will be used for clustering)
  summary: string;
}

/**
 * Analyze a journal entry to extract psychological dimensions and themes
 */
export async function analyzeExperience(entry: JournalEntry): Promise<ExperienceAnalysisResult> {
  const prompt = `You are a psychological analyst trained in experiential learning theory, transformative learning, and wisdom development. Analyze this life experience and extract key psychological dimensions.

**Journal Entry:**
Question: ${entry.question}
Response: ${entry.response}
${entry.timeContext ? `Time Context: ${entry.timeContext}` : ''}
${entry.placeContext ? `Place Context: ${entry.placeContext}` : ''}
${entry.experienceType ? `Experience Type: ${entry.experienceType}` : ''}
${entry.challengeType ? `Challenge: ${entry.challengeType}` : ''}
${entry.growthTheme ? `Growth Theme: ${entry.growthTheme}` : ''}

**Extract the following dimensions:**

**1. ECQ Dimensions (Event Characteristics Questionnaire):**
- **Valence**: Is this experience positive, negative, or neutral overall?
- **Impact** (1-10): How significantly did this affect their life?
- **Predictability** (1-10): Could they have anticipated this? (1=completely unexpected, 10=fully expected)
- **Challenge** (1-10): How difficult was this to handle? (1=easy, 10=extremely difficult)
- **Emotional Significance** (1-10): Intensity of emotional response (1=mild, 10=overwhelming)
- **Worldview Change** (1-10): Did this alter fundamental beliefs about self, others, or life? (1=no change, 10=complete transformation)

**2. Life Themes (6 core human concerns):**
Choose the PRIMARY theme this experience relates to:
- **Love**: Capacity for loving, being loved, and being lovable
- **Value**: Personal worth and recognition within relationships
- **Power**: Control over self, others, and events; sense of agency
- **Freedom**: Autonomy within appropriate boundaries
- **Truth**: Construction of meaning and authenticity
- **Justice**: Moral and ethical principles in relationships

Also identify any SECONDARY themes present.

**3. Pattern Recognition:**
- **Experience Archetype**: Name this pattern in 2-5 words (e.g., "Loss and Recovery", "Achievement Under Pressure", "Betrayal and Trust Rebuilding", "Self-Discovery Through Challenge")
- **Keywords**: 5-10 key concepts that capture this experience
- **Emotional Tone**: Primary emotional quality (e.g., "bittersweet", "triumphant", "melancholic", "anxious", "peaceful")
- **Summary**: 1-2 sentence summary of the core experience

**Important Guidelines:**
- Focus on EXPLORATORY PROCESSING (analyze complexity) not redemptive processing (seek closure)
- Look for what this teaches about the person, not just how it makes them feel
- Identify patterns that could connect to other experiences
- Be honest about difficulty and negative aspects (growth comes from challenges)

Return ONLY a JSON object with this exact structure:
{
  "valence": "positive" | "negative" | "neutral",
  "impact": number (1-10),
  "predictability": number (1-10),
  "challenge": number (1-10),
  "emotionalSignificance": number (1-10),
  "worldviewChange": number (1-10),
  "primaryTheme": "Love" | "Value" | "Power" | "Freedom" | "Truth" | "Justice",
  "secondaryThemes": string[],
  "experienceArchetype": string,
  "keywords": string[],
  "emotionalTone": string,
  "summary": string
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert psychological analyst. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "experience_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              valence: {
                type: "string",
                enum: ["positive", "negative", "neutral"],
              },
              impact: {
                type: "integer",
                minimum: 1,
                maximum: 10,
              },
              predictability: {
                type: "integer",
                minimum: 1,
                maximum: 10,
              },
              challenge: {
                type: "integer",
                minimum: 1,
                maximum: 10,
              },
              emotionalSignificance: {
                type: "integer",
                minimum: 1,
                maximum: 10,
              },
              worldviewChange: {
                type: "integer",
                minimum: 1,
                maximum: 10,
              },
              primaryTheme: {
                type: "string",
                enum: ["Love", "Value", "Power", "Freedom", "Truth", "Justice"],
              },
              secondaryThemes: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              experienceArchetype: {
                type: "string",
              },
              keywords: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              emotionalTone: {
                type: "string",
              },
              summary: {
                type: "string",
              },
            },
            required: [
              "valence",
              "impact",
              "predictability",
              "challenge",
              "emotionalSignificance",
              "worldviewChange",
              "primaryTheme",
              "secondaryThemes",
              "experienceArchetype",
              "keywords",
              "emotionalTone",
              "summary",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    const analysis: ExperienceAnalysisResult = JSON.parse(content);
    return analysis;
  } catch (error) {
    console.error("[ExperienceAnalyzer] Error analyzing experience:", error);
    
    // Fallback: return basic analysis
    return {
      valence: "neutral",
      impact: 5,
      predictability: 5,
      challenge: 5,
      emotionalSignificance: 5,
      worldviewChange: 3,
      primaryTheme: "Truth",
      secondaryThemes: [],
      experienceArchetype: "Life Experience",
      keywords: ["experience", "reflection"],
      emotionalTone: "reflective",
      summary: entry.response.substring(0, 200),
    };
  }
}

/**
 * Calculate semantic similarity between two experience summaries
 * Uses simple keyword overlap for now (can be enhanced with embeddings later)
 */
export function calculateSimilarity(
  analysis1: ExperienceAnalysisResult,
  analysis2: ExperienceAnalysisResult
): number {
  // Simple keyword overlap similarity
  const keywords1 = new Set(analysis1.keywords.map(k => k.toLowerCase()));
  const keywords2 = new Set(analysis2.keywords.map(k => k.toLowerCase()));
  
  const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
  const union = new Set([...keywords1, ...keywords2]);
  
  const keywordSimilarity = intersection.size / union.size;
  
  // Theme similarity
  const themeSimilarity = analysis1.primaryTheme === analysis2.primaryTheme ? 0.3 : 0;
  
  // Dimension similarity (normalized)
  const dimensionSimilarity = (
    1 - Math.abs(analysis1.impact - analysis2.impact) / 10 +
    1 - Math.abs(analysis1.challenge - analysis2.challenge) / 10 +
    1 - Math.abs(analysis1.emotionalSignificance - analysis2.emotionalSignificance) / 10
  ) / 3 * 0.3;
  
  return keywordSimilarity * 0.4 + themeSimilarity + dimensionSimilarity;
}

