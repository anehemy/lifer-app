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

      // Get AI response
      const response = await invokeLLM({
        messages: llmMessages,
      });

      const content = response.choices[0].message.content;
      const assistantMessage = typeof content === 'string' ? content : "I apologize, I couldn't generate a response.";

      // Save assistant message
      await db.addChatMessage(input.sessionId, "assistant", assistantMessage);

      return {
        message: assistantMessage,
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
