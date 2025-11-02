import { invokeLLM } from "../_core/llm";

/**
 * Generates consolidated wisdom from multiple related experiences
 * Uses exploratory processing approach (not just feel-good closure)
 */
export async function generateConsolidatedWisdom(experiences: Array<{
  question: string;
  response: string;
  theme?: string | null;
  archetype?: string | null;
  valence?: string | null;
  impact?: number | null;
  challenge?: number | null;
  worldviewChange?: number | null;
}>): Promise<{
  consolidatedWisdom: string;
  primaryTheme: string;
  archetypes: string[];
  insights: string[];
}> {
  // Build context from all experiences
  const experiencesSummary = experiences.map((exp, idx) => `
**Experience ${idx + 1}:**
Question: ${exp.question}
Response: ${exp.response}
${exp.theme ? `Theme: ${exp.theme}` : ''}
${exp.archetype ? `Archetype: ${exp.archetype}` : ''}
${exp.impact ? `Impact: ${exp.impact}/10` : ''}
${exp.challenge ? `Challenge: ${exp.challenge}/10` : ''}
  `).join('\n---\n');

  const prompt = `You are analyzing multiple related life experiences to extract consolidated wisdom. Use EXPLORATORY PROCESSING - focus on learning, growth, and deeper understanding, not just feeling better.

${experiencesSummary}

Generate a comprehensive analysis with:

1. **Consolidated Wisdom** (3-4 sentences): What deeper truth emerges when viewing these experiences together? What pattern of growth or learning is revealed? Focus on EXPLORATION and UNDERSTANDING, not closure or comfort.

2. **Primary Life Theme**: Which of these 6 themes best captures the essence of this pattern?
   - Love (connection, relationships, belonging)
   - Value (worth, contribution, meaning)
   - Power (agency, control, influence)
   - Freedom (autonomy, choice, liberation)
   - Truth (authenticity, honesty, self-knowledge)
   - Justice (fairness, balance, integrity)

3. **Common Archetypes** (2-3): What recurring experience patterns appear? (e.g., "Transition Through Uncertainty", "Reclaiming Personal Power", "Learning to Set Boundaries")

4. **Key Insights** (3-5 bullet points): Specific learnings that emerge from the pattern. Focus on:
   - What you're learning about yourself
   - How your understanding has evolved
   - What questions remain open
   - What you're discovering (not what you've resolved)

Return ONLY valid JSON:
{
  "consolidatedWisdom": "string",
  "primaryTheme": "Love|Value|Power|Freedom|Truth|Justice",
  "archetypes": ["string", "string"],
  "insights": ["string", "string", "string"]
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a wisdom extraction AI specializing in exploratory processing of life experiences. Focus on learning and growth, not closure or comfort."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "consolidated_wisdom",
        strict: true,
        schema: {
          type: "object",
          properties: {
            consolidatedWisdom: {
              type: "string",
              description: "3-4 sentence wisdom insight focusing on exploration and understanding"
            },
            primaryTheme: {
              type: "string",
              enum: ["Love", "Value", "Power", "Freedom", "Truth", "Justice"],
              description: "The dominant life theme"
            },
            archetypes: {
              type: "array",
              items: { type: "string" },
              description: "2-3 recurring experience patterns"
            },
            insights: {
              type: "array",
              items: { type: "string" },
              description: "3-5 specific learnings focusing on discovery, not resolution"
            }
          },
          required: ["consolidatedWisdom", "primaryTheme", "archetypes", "insights"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from LLM");
  }

  const result = JSON.parse(content);
  return result;
}

/**
 * Suggests a name for a combined experience based on the wisdom
 */
export async function suggestCombinationName(
  consolidatedWisdom: string,
  archetypes: string[]
): Promise<string> {
  const prompt = `Given this consolidated wisdom and archetypes, suggest a concise, meaningful name (3-6 words) for this combined experience pattern:

Wisdom: ${consolidatedWisdom}
Archetypes: ${archetypes.join(", ")}

The name should be:
- Evocative and memorable
- Capture the essence of the pattern
- Use active language (verbs, not just nouns)
- Be specific, not generic

Examples of good names:
- "Learning to Trust My Voice"
- "Navigating Career Transitions"
- "Reclaiming Personal Boundaries"
- "Discovering Authentic Connection"

Return ONLY the suggested name (no quotes, no explanation).`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a naming expert who creates evocative, meaningful names for life experience patterns."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const name = response.choices[0]?.message?.content?.trim() || "Combined Experience";
  return name;
}

