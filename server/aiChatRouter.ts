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

  // Create a new chat session
  createSession: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      title: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const sessionId = await db.createChatSession(
        ctx.user.id,
        input.agentId,
        input.title
      );
      
      // Add initial greeting message from Mr. MG
      const agent = await db.getAgentById(input.agentId);
      if (agent) {
        // Get journal entries count for contextual greeting
        const journalEntries = await db.getUserJournalEntries(ctx.user.id);
        const entryCount = journalEntries.length;
        
        let greeting = "Welcome! I'm Mr. MG, your life mentor. ";
        
        if (entryCount === 0) {
          greeting += "I see you haven't started your Life Story yet. Shall we begin by exploring a formative moment from your past?";
        } else if (entryCount > 0 && entryCount < 3) {
          greeting += `Good to see you! You've shared ${entryCount} ${entryCount === 1 ? 'story' : 'stories'} so far. Would you like to continue exploring your life experiences, or shall we look at the patterns emerging?`;
        } else {
          greeting += `Welcome back! You've documented ${entryCount} meaningful moments. How can I support your journey today?`;
        }
        
        await db.addChatMessage(sessionId, "assistant", greeting);
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
      ];

      // Get AI response with function calling
      const response = await invokeLLM({
        messages: llmMessages,
        tools,
        tool_choice: "auto", // Let the model decide when to use tools
      });

      const responseMessage = response.choices[0].message;
      
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
