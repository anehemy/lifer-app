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
  }),

  vision: router({
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
          connectionToPrimaryAim: z.string().optional(),
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
          connectionToPrimaryAim: z.string().optional(),
          position: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateVisionItem } = await import("./db");
        const { id, ...updates } = input;
        return updateVisionItem(id, ctx.user.id, updates);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteVisionItem } = await import("./db");
        await deleteVisionItem(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  primaryAim: router({
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
