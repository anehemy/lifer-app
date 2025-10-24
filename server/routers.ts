import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { aiChatRouter } from "./aiChatRouter";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  aiChat: aiChatRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Lifer App routers
  journal: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserJournalEntries } = await import("./db");
      return getUserJournalEntries(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({ question: z.string(), response: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { createJournalEntry } = await import("./db");
        return createJournalEntry({ userId: ctx.user.id, ...input });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteJournalEntry } = await import("./db");
        await deleteJournalEntry(input.id, ctx.user.id);
        return { success: true };
      }),
  }),  vision: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserVisionItems } = await import("./db");
      return getUserVisionItems(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          category: z.string(),
          affirmation: z.string().optional(),
          targetDate: z.date().optional(),
          imageUrl: z.string().optional(),
          position: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createVisionItem } = await import("./db");
        return createVisionItem({ userId: ctx.user.id, ...input });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          affirmation: z.string().optional(),
          targetDate: z.date().optional(),
          imageUrl: z.string().optional(),
          position: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateVisionItem } = await import("./db");
        const { id, ...updates } = input;
        return updateVisionItem(id, ctx.user.id, updates);
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const { deleteVisionItem } = await import("./db");
      return deleteVisionItem(input.id, ctx.user.id);
    }),
    suggestVisionItem: protectedProcedure
      .input(z.object({ category: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { getUserJournalEntries, getUserPrimaryAim } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        const entries = await getUserJournalEntries(ctx.user.id);
        const primaryAim = await getUserPrimaryAim(ctx.user.id);
        
        let context = "";
        if (primaryAim?.statement) {
          context += `Primary Aim: ${primaryAim.statement}\n\n`;
        }
        if (entries.length > 0) {
          context += `Recent reflections: ${entries.slice(-5).map(e => `Q: ${e.question}\nA: ${e.response}`).join("\n\n")}`;
        }
        
        const systemPrompt = `You are a vision coach helping someone create meaningful vision board items.

Based on their reflections and primary aim, suggest a vision item for the category: ${input.category}

Provide your response as JSON with this structure:
{
  "title": "A clear, inspiring title (3-8 words)",
  "description": "A vivid description of what this looks like when achieved (2-3 sentences)",
  "affirmation": "A powerful present-tense affirmation (I am... / I have... / I create...)"
}

Make it personal, specific, and aligned with their deeper purpose.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: context || "Help me create a vision for my life." },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "vision_suggestion",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  affirmation: { type: "string" },
                },
                required: ["title", "description", "affirmation"],
                additionalProperties: false,
              },
            },
          },
        });
        
        const content = response.choices[0].message.content;
        const suggestion = typeof content === 'string' ? JSON.parse(content) : content;
        
        return suggestion;
      }),
  }), primaryAim: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getUserPrimaryAim } = await import("./db");
      return getUserPrimaryAim(ctx.user.id);
    }),
    upsert: protectedProcedure
      .input(
        z.object({
          statement: z.string().optional(),
          personal: z.string().optional(),
          relationships: z.string().optional(),
          contribution: z.string().optional(),
          health: z.string().optional(),
          growth: z.string().optional(),
          legacy: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { upsertPrimaryAim } = await import("./db");
        return upsertPrimaryAim(ctx.user.id, input);
      }),
    generateStatement: protectedProcedure
      .input(
        z.object({
          personal: z.string().optional(),
          relationships: z.string().optional(),
          contribution: z.string().optional(),
          health: z.string().optional(),
          growth: z.string().optional(),
          legacy: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getUserVisionItems } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        // Get vision board items for additional context
        const visionItems = await getUserVisionItems(ctx.user.id);
        
        // Build context from filled sections
        let context = "";
        if (input.personal) context += `\n\nPersonal Identity: ${input.personal}`;
        if (input.relationships) context += `\n\nRelationships: ${input.relationships}`;
        if (input.contribution) context += `\n\nContribution/Work: ${input.contribution}`;
        if (input.health) context += `\n\nHealth & Vitality: ${input.health}`;
        if (input.growth) context += `\n\nGrowth & Learning: ${input.growth}`;
        if (input.legacy) context += `\n\nLegacy: ${input.legacy}`;
        
        if (visionItems.length > 0) {
          context += "\n\n=== Vision Board Items ===";
          visionItems.forEach(item => {
            context += `\n- ${item.category}: ${item.title}`;
            if (item.description) context += ` - ${item.description}`;
          });
        }
        
        const systemPrompt = `You are Mr. MG, a wise life mentor helping someone discover their Primary Aim - the deeper purpose that gives their life meaning.

A Primary Aim is NOT about career goals or achievements. It's about WHO they want to BE and HOW they want to LIVE.

Based on their reflections and vision, craft a powerful Primary Aim Statement that:
- Is 2-3 paragraphs long
- Written in first person ("I am...", "My life is...")
- Focuses on BEING, not DOING
- Integrates their values, relationships, contribution, health, growth, and legacy
- Is inspiring yet authentic to their voice
- Paints a vivid picture of the life they want to live
- Connects their daily actions to deeper meaning

Make it personal, poetic, and powerful. This should move them.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Here are my reflections:${context}\n\nPlease craft my Primary Aim Statement.` },
          ],
        });
        
        const content = response.choices[0].message.content;
        const statement = typeof content === 'string' ? content : "";
        
        return { statement };
      }),
  }),

  meditation: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserMeditationSessions } = await import("./db");
      return getUserMeditationSessions(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          meditationType: z.string(),
          durationMinutes: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createMeditationSession } = await import("./db");
        return createMeditationSession({ userId: ctx.user.id, ...input });
      }),
    generateScript: protectedProcedure
      .input(
        z.object({
          meditationType: z.string(),
          duration: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getUserJournalEntries, getUserVisionItems, getUserPrimaryAim } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        // Gather user context
        const entries = await getUserJournalEntries(ctx.user.id);
        const visionItems = await getUserVisionItems(ctx.user.id);
        const primaryAim = await getUserPrimaryAim(ctx.user.id);
        
        let context = "";
        if (primaryAim?.statement) {
          context += `\n\nUser's Primary Aim: ${primaryAim.statement}`;
        }
        if (entries.length > 0) {
          context += `\n\nRecent reflections: ${entries.slice(-3).map(e => e.response).join(" ")}`;
        }
        if (visionItems.length > 0) {
          context += `\n\nVision items: ${visionItems.map(v => v.title).join(", ")}`;
        }
        
        const systemPrompt = `You are a meditation guide. Create a ${input.duration}-minute guided meditation for "${input.meditationType}".

IMPORTANT: Output ONLY the meditation script itself - the exact words to be spoken to the user. Do NOT include any meta-commentary, instructions, or explanations about the script.

Guidelines for the meditation:
- About ${input.duration * 100} words total (spoken at 100 words/minute)
- Use second person ("you", "your") throughout
- Begin with grounding (breath awareness, settling in)
- Middle section: main practice (visualization, body scan, or reflection)
- End with gentle integration and return to awareness
- Use calming, supportive, gentle language
- Include natural pauses by saying "pause for a moment" or "take your time"
- Weave in the user's context naturally if provided

Start directly with the meditation. For example: "Begin by finding a comfortable position..."`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Create a personalized meditation script.${context}` },
          ],
        });
        
        const content = response.choices[0].message.content;
        const script = typeof content === 'string' ? content : "";
        
        return { script };
      }),
  }),

  patterns: router({
    analyze: protectedProcedure.query(async ({ ctx }) => {
      const { getUserJournalEntries } = await import("./db");
      const { patternKeywords } = await import("../shared/liferData");
      
      const entries = await getUserJournalEntries(ctx.user.id);
      const patterns: Record<string, { theme: string; category: string; count: number; entries: number[] }> = {};
      
      entries.forEach((entry) => {
        const text = entry.response.toLowerCase();
        
        Object.entries(patternKeywords).forEach(([category, keywords]) => {
          keywords.forEach((keyword) => {
            if (text.includes(keyword)) {
              const patternKey = `${category}_${keyword}`;
              if (!patterns[patternKey]) {
                patterns[patternKey] = {
                  theme: keyword,
                  category: category,
                  count: 0,
                  entries: [],
                };
              }
              patterns[patternKey].count++;
              patterns[patternKey].entries.push(entry.id);
            }
          });
        });
      });
      
      return Object.values(patterns)
        .filter((p) => p.count > 0)
        .sort((a, b) => b.count - a.count);
    }),
  }),
});

export type AppRouter = typeof appRouter;
