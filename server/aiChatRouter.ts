import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM, getCurrentProvider, getProviderConfig } from "./_core/llm";
import * as db from "./db";
import { detectIntent } from "./mrMgAgent";
import { knowledgeBase } from "./_core/knowledgeBase";

export const aiChatRouter = router({
  // Get all available AI agents
  listAgents: protectedProcedure.query(async () => {
    return await db.getAllAgents();
  }),

  // Get a specific agent
  getAgent: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      return await db.getAgentById(input.agentId);
    }),

  // Update agent system prompt (admin only)
  updateAgentSystemPrompt: protectedProcedure
    .input(z.object({ 
      agentId: z.number(),
      systemPrompt: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin (you can add role check here)
      await db.updateAgentSystemPrompt(input.agentId, input.systemPrompt);
      return { success: true };
    }),

  // Create a new chat session with optional initial question from Mr. MG
  createSession: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      title: z.string().optional(),
      initialQuestion: z.string().optional(), // Question from journal to start conversation
      journalQuestion: z.string().optional(), // Original journal question to display in chat
    }))
    .mutation(async ({ ctx, input }) => {
      // Store journal question in context if provided
      const context = input.journalQuestion ? JSON.stringify({ journalQuestion: input.journalQuestion }) : null;
      
      const sessionId = await db.createChatSession(
        ctx.user.id,
        input.agentId,
        input.title || "New Conversation",
        context
      );
      
      // If there's an initial question, add it as an assistant message
      if (input.initialQuestion) {
        await db.addChatMessage(sessionId, "assistant", input.initialQuestion);
      }
      
      return { sessionId };
    }),

  // Get user's chat sessions
  listSessions: protectedProcedure
    .input(z.object({ agentId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return await db.getUserChatSessions(ctx.user.id, input.agentId);
    }),

  // Get messages for a session
  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await db.getChatSession(input.sessionId, ctx.user.id);
      if (!session) {
        throw new Error("Session not found");
      }
      return await db.getChatMessages(input.sessionId);
    }),

  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[sendMessage] Starting - sessionId:', input.sessionId, 'userId:', ctx.user.id);
      // Verify session belongs to user
      const session = await db.getChatSession(input.sessionId, ctx.user.id);
      if (!session) {
        throw new Error("Session not found");
      }

      // Get agent
      const agent = await db.getAgentById(session.agentId);
      if (!agent) {
        throw new Error("Agent not found");
      }

      // Save pending assistant message from previous exchange (if any)
      // When user responds, we save the previous assistant message + current user message
      // This ensures we only keep questions/messages that users actually responded to
      const pendingAssistantMsg = await db.getPendingAssistantMessage(input.sessionId);
      if (pendingAssistantMsg) {
        // Save the previous assistant message
        await db.addChatMessage(input.sessionId, "assistant", pendingAssistantMsg);
        // Save the current user response
        await db.addChatMessage(input.sessionId, "user", input.message);
        await db.clearPendingMessages(input.sessionId);
      } else {
        // No pending message - this might be first message, save user message
        await db.addChatMessage(input.sessionId, "user", input.message);
      }

      // Get conversation history
      const messages = await db.getChatMessages(input.sessionId);
      
      // Auto-generate title from conversation topic using AI
      if (!session.title || session.title === "New Conversation") {
        const userMessages = messages.filter(m => m.role === "user");
        // This is the first message if there are no user messages yet (since we haven't saved current one)
        if (userMessages.length === 0) {
          // This is the first user message - generate a topic-based title
          try {
            const titlePrompt = `Generate a short, descriptive title (3-6 words max) for a conversation that starts with this question/message: "${input.message}". Return ONLY the title, nothing else.`;
            const titleResult = await invokeLLM({
              messages: [{ role: "user", content: titlePrompt }],
            });
            const aiTitle = titleResult.choices[0]?.message?.content;
            const title = typeof aiTitle === 'string' ? aiTitle.trim().replace(/^["']|["']$/g, '') : input.message.substring(0, 50);
            await db.updateChatSessionTitle(input.sessionId, title);
          } catch (e) {
            // Fallback to simple truncation
            const title = input.message.length > 50 
              ? input.message.substring(0, 47) + "..." 
              : input.message;
            await db.updateChatSessionTitle(input.sessionId, title);
          }
        }
      }
      
      // Build context for AI based on agent capabilities
      const capabilities = JSON.parse(agent.capabilities);
      let contextData = "";

      if (capabilities.includes("access_journal_entries")) {
        const entries = await db.getUserJournalEntries(ctx.user.id);
        if (entries.length > 0) {
          contextData += "\n\n=== User's Journal Entries ===\n";
          entries.slice(-10).forEach((entry) => {
            contextData += `Q: ${entry.question}\nA: ${entry.response}\n\n`;
          });
        }
      }

      if (capabilities.includes("access_patterns")) {
        const entries = await db.getUserJournalEntries(ctx.user.id);
        if (entries.length > 0) {
          contextData += "\n\n=== Observed Patterns ===\n";
          contextData += "User has written " + entries.length + " journal entries.\n";
        }
      }

      if (capabilities.includes("access_vision_board")) {
        const visionItems = await db.getUserVisionItems(ctx.user.id);
        if (visionItems.length > 0) {
          contextData += "\n\n=== Vision Board Items ===\n";
          visionItems.forEach((item) => {
            contextData += `${item.category}: ${item.title}\n`;
            if (item.description) contextData += `  ${item.description}\n`;
            if (item.affirmation) contextData += `  Affirmation: "${item.affirmation}"\n`;
          });
        }
      }

      if (capabilities.includes("access_primary_aim")) {
        const primaryAim = await db.getUserPrimaryAim(ctx.user.id);
        if (primaryAim && primaryAim.statement) {
          contextData += "\n\n=== Primary Aim Statement ===\n";
          contextData += primaryAim.statement + "\n";
        }
      }

      if (capabilities.includes("access_meditation_history")) {
        const sessions = await db.getUserMeditationSessions(ctx.user.id);
        if (sessions.length > 0) {
          contextData += "\n\n=== Meditation Practice ===\n";
          contextData += `User has completed ${sessions.length} meditation sessions.\n`;
        }
      }

      // Check message count and add warning if approaching limit
      const messageCount = messages.length;
      const approachingLimit = messageCount >= 40; // Warn at 40 out of 50 messages
      
      // Get relevant knowledge from RAG system
      let ragContext = '';
      try {
        // Build conversation summary for context
        const recentMessages = messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n');
        ragContext = await knowledgeBase.getRelevantContext(recentMessages, input.message, 2);
        console.log(`[AI Chat] RAG context retrieved: ${ragContext.length} chars`);
      } catch (error) {
        console.error('[AI Chat] RAG retrieval failed:', error);
        // Continue without RAG context
      }
      
      // Build messages for LLM
      const llmMessages: any[] = [
        {
          role: "system",
          content: agent.systemPrompt + 
            (contextData ? "\n\nCurrent user data:" + contextData : "") +
            (ragContext ? ragContext : "") +
            (approachingLimit ? `\n\n⚠️ IMPORTANT: This conversation has ${messageCount} messages and is approaching the limit (50 messages). After your next response, proactively tell the user: "We've had a rich conversation with many insights. Would you like me to save a summary of our discussion to your journal? Then we can start a fresh conversation to continue exploring these ideas." Use the create_conversation_summary tool if they agree.` : ""),
        },
      ];
      
      // Smart message truncation based on estimated token count
      // Rough estimate: 1 token ≈ 4 characters for English text
      const estimateTokens = (text: string) => Math.ceil(text.length / 4);
      
      // Get current provider's context window
      const currentProvider = await getCurrentProvider();
      const providerConfig = await getProviderConfig(currentProvider);
      const contextWindow = providerConfig.contextWindow;
      
      const systemTokens = estimateTokens(llmMessages[0].content);
      const newMessageTokens = estimateTokens(input.message);
      const toolsTokens = 2000; // Rough estimate for tool definitions
      const responseReserve = providerConfig.maxTokens; // Reserve tokens for response based on provider
      
      // Use 50% of context window for conversation history to be safe
      // This leaves room for system prompt, tools, and response
      const maxHistoryTokens = Math.floor(contextWindow * 0.5) - systemTokens - newMessageTokens - toolsTokens - responseReserve;
      
      console.log(`[AI Chat] Provider: ${currentProvider}, Context window: ${contextWindow}, Max history tokens: ${maxHistoryTokens}`);
      
      // Add conversation history, truncating from the beginning if needed
      let historyTokens = 0;
      const messagesToInclude: any[] = [];
      
      // Process messages in reverse order (newest first)
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === "system") continue;
        
        const msgTokens = estimateTokens(msg.content);
        if (historyTokens + msgTokens > maxHistoryTokens) {
          console.log(`[AI Chat] Truncating message history at ${messagesToInclude.length} messages (${historyTokens} tokens)`);
          break;
        }
        
        historyTokens += msgTokens;
        messagesToInclude.unshift({
          role: msg.role,
          content: msg.content,
        });
      }
      
      llmMessages.push(...messagesToInclude);
      console.log(`[AI Chat] Including ${messagesToInclude.length} messages (≈${historyTokens} tokens) from conversation history`);
      
      // Add the current user message to LLM context
      llmMessages.push({
        role: "user",
        content: input.message,
      });

      // Define tools for Mr. MG to use
      const tools: any[] = [
        {
          type: "function",
          function: {
            name: "save_journal_entry",
            description: "Save a life story or significant experience shared by the user to their journal. Use this when the user shares a meaningful life experience, memory, or story that should be documented.",
            parameters: {
              type: "object",
              properties: {
                question: {
                  type: "string",
                  description: "A reflective question that prompted this story (e.g., 'Tell me about a time when you overcame a challenge')",
                },
                response: {
                  type: "string",
                  description: "The user's story or experience in their own words",
                },
              },
              required: ["question", "response"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "merge_journal_entries",
            description: "Merge multiple journal entries into a single, cohesive entry. Use this when the user requests to combine similar or short entries, or when doing housekeeping on their journal.",
            parameters: {
              type: "object",
              properties: {
                entryIds: {
                  type: "array",
                  items: { type: "number" },
                  description: "Array of journal entry IDs to merge",
                },
                mergedQuestion: {
                  type: "string",
                  description: "The combined question that encompasses all merged entries",
                },
                mergedResponse: {
                  type: "string",
                  description: "The combined response that integrates all the stories/experiences from the entries being merged",
                },
              },
              required: ["entryIds", "mergedQuestion", "mergedResponse"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "create_conversation_summary",
            description: "Create a summary of the current conversation and save it to the user's journal. Use this when the conversation reaches a natural conclusion or when the user agrees to save a summary of insights discussed.",
            parameters: {
              type: "object",
              properties: {
                summaryTitle: {
                  type: "string",
                  description: "A clear title for the summary (e.g., 'Conversation about Career Purpose')",
                },
                keyInsights: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of key insights, realizations, or important points from the conversation",
                },
                actionItems: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of action items or next steps identified in the conversation (if any)",
                },
                fullSummary: {
                  type: "string",
                  description: "A comprehensive summary of the conversation in paragraph form",
                },
              },
              required: ["summaryTitle", "keyInsights", "fullSummary"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "navigate_to_page",
            description: "Navigate the user to a specific page in the app. Use this when the user asks to go to a page, open a section, or view a specific feature.",
            parameters: {
              type: "object",
              properties: {
                page: {
                  type: "string",
                  enum: ["dashboard", "life-story", "patterns", "vision-board", "meditation", "primary-aim", "settings"],
                  description: "The page to navigate to",
                },
                message: {
                  type: "string",
                  description: "A friendly message to show the user before navigating (e.g., 'Taking you to the meditation page now!')",
                },
              },
              required: ["page", "message"],
            },
          },
        },
      ];

      // Get AI response with function calling
      let response;
      try {
        console.log("[AI Chat] Sending to LLM with", llmMessages.length, "messages and", tools.length, "tools");
        response = await invokeLLM({
          messages: llmMessages,
          tools,
          tool_choice: "auto", // Let the model decide when to use tools
        });
        console.log("[AI Chat] LLM Response:", JSON.stringify(response, null, 2));
      } catch (error: any) {
        console.error("[AI Chat] LLM Error:", error.message);
        // Save error message for user
        const errorMsg = "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
        await db.addChatMessage(input.sessionId, "assistant", errorMsg);
        return {
          message: errorMsg,
          journalEntrySaved: false,
        };
      }

      if (!response.choices || response.choices.length === 0) {
        throw new Error("No response from LLM");
      }

      const responseMessage = response.choices[0].message;
      
      if (!responseMessage) {
        throw new Error("No message in LLM response");
      }
      
      // Check if the model wants to call a function
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        const toolCall = responseMessage.tool_calls[0];
        
        if (toolCall.function.name === "save_journal_entry") {
          // Parse function arguments
          const args = JSON.parse(toolCall.function.arguments);
          
          // Extract metadata from response using AI
          const metadataPrompt = `Analyze this journal entry and extract contextual metadata. Return ONLY a JSON object with these fields (use null if not applicable):
{
  "timeContext": "time period mentioned (e.g., 'childhood', '2010', 'age 15', 'summer')",
  "placeContext": "ONLY the geographic location name for map geocoding (e.g., 'New York', 'Piracicaba', 'Tokyo, Japan'). Do NOT include descriptions like 'grandfather's garage' or 'best friend's farm' - use ONLY city/state/country names",
  "experienceType": "type of experience (e.g., 'learning', 'relationship', 'achievement', 'loss', 'struggle with time management')",
  "challengeType": "challenge faced if any (e.g., 'bullying', 'failure', 'conflict', 'loss', 'not following through on commitments')",
  "growthTheme": "growth or lesson (e.g., 'resilience', 'patience', 'self-discovery', 'courage', 'alignment creates time')"
}

Question: ${args.question}
Response: ${args.response}`;
          
          let metadata = {};
          try {
            const result = await invokeLLM({
              messages: [{ role: "user", content: metadataPrompt }],
            });
            const content = result.choices[0].message.content;
            if (typeof content === 'string') {
              const parsed = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
              metadata = parsed;
            }
          } catch (e) {
            console.error('Failed to extract metadata:', e);
          }
          
          // Save to journal with metadata
          await db.createJournalEntry({
            userId: ctx.user.id,
            question: args.question,
            response: args.response,
            ...metadata,
          });
          
          // Generate a confirmation message
          const confirmationMessages = [
            ...llmMessages,
            responseMessage,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ success: true, message: "Journal entry saved successfully" }),
            },
          ];
          
          // Get final response from the model
          const finalResponse = await invokeLLM({
            messages: confirmationMessages,
          });
          
          const assistantMessage = typeof finalResponse.choices[0].message.content === 'string' 
            ? finalResponse.choices[0].message.content 
            : "I've saved your story to your journal!";
          
          // Save assistant message as pending - will be committed when user responds
          await db.savePendingAssistantMessage(input.sessionId, assistantMessage);
          
          return {
            message: assistantMessage,
            journalEntrySaved: true,
          };
        }
        
        if (toolCall.function.name === "merge_journal_entries") {
          // Parse function arguments
          const args = JSON.parse(toolCall.function.arguments);
          const { entryIds, mergedQuestion, mergedResponse } = args;
          
          // Extract metadata from merged response
          const metadataPrompt = `Analyze this journal entry and extract contextual metadata. Return ONLY a JSON object with these fields (use null if not applicable):
{
  "timeContext": "time period mentioned (e.g., 'childhood', '2010', 'age 15', 'summer')",
  "placeContext": "ONLY the geographic location name for map geocoding (e.g., 'New York', 'Piracicaba', 'Tokyo, Japan'). Do NOT include descriptions like 'grandfather's garage' or 'best friend's farm' - use ONLY city/state/country names",
  "experienceType": "type of experience (e.g., 'learning', 'relationship', 'achievement', 'loss')",
  "challengeType": "challenge faced if any (e.g., 'bullying', 'failure', 'conflict', 'loss')",
  "growthTheme": "growth or lesson (e.g., 'resilience', 'patience', 'self-discovery', 'courage')"
}

Question: ${mergedQuestion}
Response: ${mergedResponse}`;
          
          let metadata = {};
          try {
            const result = await invokeLLM({
              messages: [{ role: "user", content: metadataPrompt }],
            });
            const content = result.choices[0].message.content;
            if (typeof content === 'string') {
              const parsed = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
              metadata = parsed;
            }
          } catch (e) {
            console.error('Failed to extract metadata for merged entry:', e);
          }
          
          // Create the merged entry with metadata
          await db.createJournalEntry({
            userId: ctx.user.id,
            question: mergedQuestion,
            response: mergedResponse,
            ...metadata,
          });
          
          // Delete the old entries
          for (const entryId of entryIds) {
            await db.deleteJournalEntry(entryId, ctx.user.id);
          }
          
          // Generate a confirmation message
          const confirmationMessages = [
            ...llmMessages,
            responseMessage,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ 
                success: true, 
                message: `Merged ${entryIds.length} entries successfully` 
              }),
            },
          ];
          
          // Get final response from the model
          const finalResponse = await invokeLLM({
            messages: confirmationMessages,
          });
          
          const assistantMessage = typeof finalResponse.choices[0].message.content === 'string' 
            ? finalResponse.choices[0].message.content 
            : `I've merged ${entryIds.length} entries into one cohesive story!`;
          
          // Save assistant message as pending - will be committed when user responds
          await db.savePendingAssistantMessage(input.sessionId, assistantMessage);
          
          return {
            message: assistantMessage,
            journalEntriesMerged: true,
          };
        }
        
        if (toolCall.function.name === "create_conversation_summary") {
          // Parse function arguments
          const args = JSON.parse(toolCall.function.arguments);
          const { summaryTitle, keyInsights, actionItems, fullSummary } = args;
          
          // Format the summary for journal
          let summaryText = fullSummary + "\n\n";
          
          if (keyInsights && keyInsights.length > 0) {
            summaryText += "**Key Insights:**\n";
            keyInsights.forEach((insight: string) => {
              summaryText += `- ${insight}\n`;
            });
            summaryText += "\n";
          }
          
          if (actionItems && actionItems.length > 0) {
            summaryText += "**Action Items:**\n";
            actionItems.forEach((item: string) => {
              summaryText += `- ${item}\n`;
            });
          }
          
          // Extract metadata from summary
          const metadataPrompt = `Analyze this conversation summary and extract contextual metadata. Return ONLY a JSON object with these fields (use null if not applicable):
{
  "timeContext": "time period mentioned (e.g., 'childhood', '2010', 'age 15', 'summer')",
  "placeContext": "ONLY the geographic location name for map geocoding (e.g., 'New York', 'Piracicaba', 'Tokyo, Japan'). Do NOT include descriptions like 'grandfather's garage' or 'best friend's farm' - use ONLY city/state/country names",
  "experienceType": "type of experience discussed (e.g., 'learning', 'relationship', 'achievement', 'loss', 'career exploration')",
  "challengeType": "main challenge discussed if any (e.g., 'bullying', 'failure', 'conflict', 'loss', 'time management')",
  "growthTheme": "growth or lesson from conversation (e.g., 'resilience', 'patience', 'self-discovery', 'courage', 'alignment')"
}

Summary Title: ${summaryTitle}
Full Summary: ${fullSummary}
Key Insights: ${keyInsights ? keyInsights.join(', ') : 'none'}`;
          
          let metadata = {};
          try {
            const result = await invokeLLM({
              messages: [{ role: "user", content: metadataPrompt }],
            });
            const content = result.choices[0].message.content;
            if (typeof content === 'string') {
              const parsed = JSON.parse(content.replace(/```json\n?|```/g, '').trim());
              metadata = parsed;
            }
          } catch (e) {
            console.error('Failed to extract metadata for conversation summary:', e);
          }
          
          // Save summary to journal with metadata
          await db.createJournalEntry({
            userId: ctx.user.id,
            question: `Conversation Summary: ${summaryTitle}`,
            response: summaryText,
            ...metadata,
          });
          
          // Generate a confirmation message
          const confirmationMessages = [
            ...llmMessages,
            responseMessage,
            {
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ 
                success: true, 
                message: "Conversation summary saved to journal" 
              }),
            },
          ];
          
          // Get final response from the model
          const finalResponse = await invokeLLM({
            messages: confirmationMessages,
          });
          
          const assistantMessage = typeof finalResponse.choices[0].message.content === 'string' 
            ? finalResponse.choices[0].message.content 
            : "I've saved a summary of our conversation to your journal!";
          
          // Save assistant message as pending - will be committed when user responds
          await db.savePendingAssistantMessage(input.sessionId, assistantMessage);
          
          return {
            message: assistantMessage,
            summarySaved: true,
          };
        }
        
        if (toolCall.function.name === "navigate_to_page") {
          // Parse function arguments
          const args = JSON.parse(toolCall.function.arguments);
          const { page, message } = args;
          
          // Save both user and assistant messages together
          await db.addChatMessage(input.sessionId, "user", input.message);
          await db.addChatMessage(input.sessionId, "assistant", message);
          
          // Return navigation instruction to client
          return {
            message,
            navigateTo: page,
          };
        }
      }
      
      // No function call - regular response
      const content = responseMessage.content;
      const assistantMessage = typeof content === 'string' ? content : "I apologize, I couldn't generate a response.";

      // Save assistant message as pending - will be committed when user responds
      await db.savePendingAssistantMessage(input.sessionId, assistantMessage);

      return {
        message: assistantMessage,
        journalEntrySaved: false,
      };
      } catch (error) {
        console.error('[sendMessage] ERROR:', error);
        console.error('[sendMessage] Stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }
    }),

  // Delete a chat session
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await db.getChatSession(input.sessionId, ctx.user.id);
      if (!session) {
        throw new Error("Session not found");
      }
      
      // Delete the session (this should cascade delete messages)
      await db.deleteChatSession(input.sessionId, ctx.user.id);
      
      return { success: true };
    }),

  // Mr. MG Agent Actions
  executeAction: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user
      const session = await db.getChatSession(input.sessionId, ctx.user.id);
      if (!session) {
        throw new Error("Session not found");
      }

      // Save user message
      await db.addChatMessage(input.sessionId, "user", input.message);

      // Detect intent and get action
      const action = await detectIntent(input.message, ctx.user.id);

      // Save assistant message
      await db.addChatMessage(input.sessionId, "assistant", action.message);

      return action;
    }),

  // Clear all chat history for user
  clearAllChatHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db.deleteAllUserChatSessions(ctx.user.id);
      return { success: true };
    }),

  // Clean up empty chat sessions (no user replies)
  cleanupEmptyChats: protectedProcedure
    .mutation(async ({ ctx }) => {
      await db.deleteEmptyChatSessions(ctx.user.id);
      return { success: true };
    }),
});
