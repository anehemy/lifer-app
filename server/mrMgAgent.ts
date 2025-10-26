import { invokeLLM } from "./_core/llm";

export interface AgentAction {
  type: 'navigate' | 'create' | 'update' | 'delete' | 'query' | 'chat';
  target?: string; // page name or resource type
  data?: any; // data for create/update operations
  message: string; // response message to user
}

export async function detectIntent(userMessage: string, userId: number): Promise<AgentAction> {
  const prompt = `You are Mr. MG, an AI agent that helps users navigate and manage their Lifer App. Analyze the user's message and determine what action to take.

Available actions:
1. NAVIGATE - Go to a page (dashboard, life-story, patterns, vision-board, meditation, primary-aim)
2. CREATE - Create new content (journal-entry, vision-item, meditation)
3. QUERY - Get information (show entries, list meditations, view patterns)
4. CHAT - Just have a conversation (no specific action needed)

User message: "${userMessage}"

Return ONLY a JSON object with this structure:
{
  "type": "navigate|create|query|chat",
  "target": "page-name or resource-type (if applicable)",
  "data": {any extracted data for create operations},
  "intent": "brief description of what user wants"
}

Examples:
- "Take me to my life story" → {"type": "navigate", "target": "life-story", "intent": "navigate to journal"}
- "Create a journal entry about my childhood" → {"type": "create", "target": "journal-entry", "data": {"topic": "childhood"}, "intent": "create journal entry"}
- "Show me my patterns" → {"type": "navigate", "target": "patterns", "intent": "view patterns"}
- "What should I do next?" → {"type": "chat", "intent": "seeking guidance"}`;

  try {
    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
    });
    
    const content = result.choices[0]?.message?.content;
    if (typeof content === 'string') {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          type: parsed.type || 'chat',
          target: parsed.target,
          data: parsed.data,
          message: await generateResponse(parsed, userMessage),
        };
      }
    }
  } catch (e) {
    console.error('Intent detection failed:', e);
  }

  // Default to chat
  return {
    type: 'chat',
    message: "I'm here to help! You can ask me to navigate to different sections, create journal entries, or just chat about your journey.",
  };
}

async function generateResponse(intent: any, userMessage: string): Promise<string> {
  const { type, target, data } = intent;
  
  switch (type) {
    case 'navigate':
      return `I'll take you to your ${target?.replace('-', ' ')} right away!`;
    
    case 'create':
      if (target === 'journal-entry') {
        return `I'll help you create a journal entry${data?.topic ? ` about ${data.topic}` : ''}. Let me open that for you.`;
      }
      if (target === 'meditation') {
        return `Let's create a new meditation together. I'll guide you through it.`;
      }
      if (target === 'vision-item') {
        return `Great! I'll help you add that to your vision board.`;
      }
      return `I'll help you create that.`;
    
    case 'query':
      return `Let me show you that information.`;
    
    default:
      // Generate conversational response using LLM
      try {
        const result = await invokeLLM({
          messages: [
            { 
              role: "system", 
              content: "You are Mr. MG, the AI avatar of Michael E. Gerber, author of The E-Myth and business partner in Lifer App. Respond warmly and insightfully to help users discover their Primary Aim." 
            },
            { role: "user", content: userMessage }
          ],
        });
        const content = result.choices[0]?.message?.content;
        return typeof content === 'string' ? content : "I'm here to support your journey.";
      } catch (e) {
        return "I'm here to support your journey. What would you like to explore?";
      }
  }
}

