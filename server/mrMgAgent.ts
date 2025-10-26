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
3. DELETE - Delete content (journal-entry, vision-item, meditation)
4. QUERY - Get information (show entries, list meditations, view patterns)
5. CHAT - Just have a conversation (no specific action needed)

User message: "${userMessage}"

Return ONLY a JSON object with this structure:
{
  "type": "navigate|create|delete|query|chat",
  "target": "page-name or resource-type (if applicable)",
  "data": {any extracted data including id for delete operations},
  "intent": "brief description of what user wants"
}

Examples:
- "Take me to my life story" → {"type": "navigate", "target": "life-story", "intent": "navigate to journal"}
- "Create a journal entry about my childhood" → {"type": "create", "target": "journal-entry", "data": {"topic": "childhood"}, "intent": "create journal entry"}
- "Delete my last journal entry" → {"type": "delete", "target": "journal-entry", "data": {"which": "last"}, "intent": "delete most recent entry"}
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
      // Generate contextual follow-up based on destination
      const destination = target?.replace('-', ' ') || 'page';
      let contextualMessage = '';
      
      if (target === 'meditation') {
        contextualMessage = "Here you are in your meditations. Would you like help creating a new meditation, or would you prefer to replay one you've already done?";
      } else if (target === 'life-story' || target === 'journal') {
        contextualMessage = "Welcome to your Life Story. Would you like to answer a new question, or would you like me to help you explore the patterns in your responses?";
      } else if (target === 'patterns') {
        contextualMessage = "Here are the patterns I've discovered in your story. Would you like me to explain any of them, or help you see how they connect to your Primary Aim?";
      } else if (target === 'vision-board') {
        contextualMessage = "Welcome to your Vision Board. Would you like to add a new vision, or explore how your current visions align with who you are?";
      } else if (target === 'primary-aim') {
        contextualMessage = "This is where we synthesize everything into your Primary Aim. Would you like me to help you craft it, or review what you've discovered so far?";
      } else {
        contextualMessage = `Here we are at your ${destination}. How can I help you here?`;
      }
      
      return contextualMessage;
    
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
    
    case 'delete':
      if (target === 'journal-entry') {
        return `I can help you delete that journal entry. Just to confirm - which entry would you like me to remove?`;
      }
      if (target === 'vision-item') {
        return `I can help you remove that from your vision board. Which item would you like to delete?`;
      }
      if (target === 'meditation') {
        return `I can delete that meditation session. Which one would you like me to remove?`;
      }
      return `I can help you delete that. Can you be more specific about what you'd like to remove?`;
    
    case 'query':
      return `Let me show you that information.`;
    
    default:
      // Generate conversational response using LLM
      try {
        const result = await invokeLLM({
          messages: [
            { 
              role: "system", 
              content: `You are Mr. MG, the AI avatar of Michael E. Gerber, author of The E-Myth and business partner in Lifer App.

Your role: Guide users to discover their Primary Aim through thoughtful questions and reflection.

Communication style:
- Be warm, direct, and conversational (2-3 sentences max)
- Ask ONE specific question at a time
- Focus on WHO they are and WHAT they truly want
- Avoid philosophical tangents - stay action-oriented
- Connect insights to their actual life experiences
- When appropriate, suggest concrete next steps

Remember: You're a guide, not a lecturer. Listen more than you speak.` 
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

