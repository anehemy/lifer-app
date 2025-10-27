import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { detectIntent } from "./mrMgAgent";

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

  // Create a new chat session (no greeting - only saves if user sends message)
  createSession: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      title: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const sessionId = await db.createChatSession(
        ctx.user.id,
        input.agentId,
        input.title || "New Conversation"
      );
      
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

      // Save user message
      await db.addChatMessage(input.sessionId, "user", input.message);

      // Get conversation history
      const messages = await db.getChatMessages(input.sessionId);
      
      // Auto-generate title from conversation topic using AI
      if (!session.title || session.title === "New Conversation") {
        const userMessages = messages.filter(m => m.role === "user");
        if (userMessages.length === 1) {
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

      // Build messages for LLM
      const llmMessages: any[] = [
        {
          role: "system",
          content: agent.systemPrompt + (contextData ? "\n\nCurrent user data:" + contextData : ""),
        },
      ];

      // Add conversation history (last 10 messages to keep context manageable)
      const recentMessages = messages.slice(-10);
      recentMessages.forEach((msg) => {
        if (msg.role !== "system") {
          llmMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
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
      ];

      // Get AI response with function calling
      const response = await invokeLLM({
        messages: llmMessages,
        tools,
        tool_choice: "auto", // Let the model decide when to use tools
      });

      console.log("[AI Chat] LLM Response:", JSON.stringify(response, null, 2));

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
          
          // Save to journal
          await db.createJournalEntry({
            userId: ctx.user.id,
            question: args.question,
            response: args.response,
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
          
          // Save assistant message
          await db.addChatMessage(input.sessionId, "assistant", assistantMessage);
          
          return {
            message: assistantMessage,
            journalEntrySaved: true,
          };
        }
        
        if (toolCall.function.name === "merge_journal_entries") {
          // Parse function arguments
          const args = JSON.parse(toolCall.function.arguments);
          const { entryIds, mergedQuestion, mergedResponse } = args;
          
          // Create the merged entry
          await db.createJournalEntry({
            userId: ctx.user.id,
            question: mergedQuestion,
            response: mergedResponse,
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
          
          // Save assistant message
          await db.addChatMessage(input.sessionId, "assistant", assistantMessage);
          
          return {
            message: assistantMessage,
            journalEntriesMerged: true,
          };
        }
      }
      
      // No function call - regular response
      const content = responseMessage.content;
      const assistantMessage = typeof content === 'string' ? content : "I apologize, I couldn't generate a response.";

      // Save assistant message
      await db.addChatMessage(input.sessionId, "assistant", assistantMessage);

      return {
        message: assistantMessage,
        journalEntrySaved: false,
      };
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
});
