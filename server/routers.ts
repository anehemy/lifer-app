import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { aiChatRouter } from "./aiChatRouter";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  
  tokens: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const { getUserTokens } = await import("./_core/tokens");
      const balance = await getUserTokens(ctx.user.id);
      return { balance };
    }),
    purchase: protectedProcedure
      .input(z.object({ packageId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { addTokens } = await import("./_core/tokens");
        
        // Token packages
        const packages: Record<string, number> = {
          starter: 500,
          pro: 2000,
          unlimited: 10000,
        };
        
        const tokens = packages[input.packageId];
        if (!tokens) {
          throw new Error("Invalid package");
        }
        
        // In production, this would integrate with payment processor
        // For now, just add the tokens
        await addTokens(ctx.user.id, tokens);
        
        return { success: true, tokensAdded: tokens };
      }),
  }),

  admin: router({
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Admin access required');
      }
      const db = await import('./db').then(m => m.getDb());
      if (!db) return [];
      const { users } = await import('../drizzle/schema');
      return await db.select().from(users);
    }),
  }),

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
    askMrMg: protectedProcedure
      .input(z.object({ 
        question: z.string(),
        userMessage: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getUserJournalEntries, getUserVisionItems, getUserPrimaryAim } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        const { getPatternInsights } = await import("./db");
        
        // Gather comprehensive user context
        const [entries, visionItems, primaryAim, patterns] = await Promise.all([
          getUserJournalEntries(ctx.user.id),
          getUserVisionItems(ctx.user.id),
          getUserPrimaryAim(ctx.user.id),
          getPatternInsights(ctx.user.id),
        ]);
        
        // Build context for Mr. MG
        let context = `User's current question: ${input.question}\n\n`;
        
        if (primaryAim?.statement) {
          context += `User's Primary Aim: ${primaryAim.statement}\n\n`;
        }
        
        if (entries.length > 0) {
          context += `Recent journal entries (${entries.length} total):\n`;
          entries.slice(-5).forEach(e => {
            context += `Q: ${e.question}\nA: ${e.response}\n\n`;
          });
        }
        
        if (visionItems.length > 0) {
          context += `Vision items: ${visionItems.map(v => v.title).join(", ")}\n\n`;
        }
        
        if (patterns && patterns.length > 0) {
          context += `Identified patterns: ${patterns.join(", ")}\n\n`;
        }
        
        const systemPrompt = `You are Mr. MG, a wise life mentor inspired by Michael Gerber's E-Myth principles and scientific research on personal development. Your role is to help users discover their Primary Aim - not what they want to DO, but who they want to BE and how they want to LIVE.

Key principles:
- Focus on being vs. doing: Help users understand their identity and values before actions
- Use Socratic questioning: Ask thoughtful follow-up questions to deepen reflection
- Draw from E-Myth wisdom: Work ON your life, not just IN it
- Be warm, supportive, and insightful
- Reference their past reflections and patterns when relevant
- Help them see connections between their experiences, values, and aspirations
- Encourage authentic self-discovery over societal expectations

User Context:
${context}

Respond to their message with wisdom, empathy, and insight. Keep responses conversational (2-4 paragraphs). Ask one thoughtful follow-up question to deepen their reflection.`;
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.userMessage },
          ],
        });
        
        const content = response.choices[0].message.content;
        return { response: typeof content === 'string' ? content : "" };
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
    
    generateImage: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getUserVisionItems, updateVisionItem } = await import("./db");
        const { generateImage } = await import("./_core/imageGeneration");
        const { deductTokens, TOKEN_COSTS } = await import("./_core/tokens");
        
        // Check and deduct tokens
        const hasTokens = await deductTokens(ctx.user.id, TOKEN_COSTS.IMAGE_GENERATION);
        if (!hasTokens) {
          throw new Error("Insufficient AI tokens. Please purchase more tokens to continue.");
        }
        
        const items = await getUserVisionItems(ctx.user.id);
        const item = items.find(i => i.id === input.itemId);
        
        if (!item) {
          throw new Error("Vision item not found");
        }
        
        // Generate image based on vision item
        const prompt = `${item.title}. ${item.description || ''}. Inspirational, uplifting, beautiful visualization.`;
        
        try {
          const { url: imageUrl } = await generateImage({ prompt });
          
          // Update vision item with image URL
          await updateVisionItem(input.itemId, ctx.user.id, { imageUrl });
          
          return { imageUrl };
        } catch (error) {
          console.error("[Vision] Image generation failed:", error);
          throw new Error("Failed to generate image");
        }
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
    
    autoPopulate: protectedProcedure.query(async ({ ctx }) => {
      const { getUserJournalEntries, getUserVisionItems, getPatternInsights } = await import("./db");
      const { invokeLLM } = await import("./_core/llm");
      
      const [journalEntries, visionItems, patterns] = await Promise.all([
        getUserJournalEntries(ctx.user.id),
        getUserVisionItems(ctx.user.id),
        getPatternInsights(ctx.user.id),
      ]);
      
      let context = "";
      if (journalEntries.length > 0) {
        context += "\n\n=== Life Reflections ===\n";
        journalEntries.slice(0, 10).forEach(entry => {
          context += `\nQ: ${entry.question}\nA: ${entry.response}\n`;
        });
      }
      
      if (visionItems.length > 0) {
        context += "\n\n=== Vision Board ===\n";
        visionItems.forEach(item => {
          context += `\n- ${item.title}`;
          if (item.description) context += `: ${item.description}`;
        });
      }
      
      if (patterns.length > 0) {
        context += "\n\n=== Identified Patterns ===\n" + patterns.join("\n");
      }
      
      const systemPrompt = `You are Mr. MG, helping someone discover their Primary Aim by analyzing their reflections.

Based on their inputs, generate content for these 6 sections:

1. Personal Identity: Who are they at their core? What defines them beyond roles?
2. Relationships: How do they want to show up in relationships? What kind of connections matter?
3. Contribution: How do they want to serve others and make a difference?
4. Health & Vitality: How do they want to feel physically, mentally, emotionally?
5. Growth & Learning: What kind of person are they becoming? How do they evolve?
6. Legacy: What lasting impact do they want to leave?

For each section, write 2-3 thoughtful sentences that capture their essence based on their reflections. Make it personal and authentic to their voice.`;
      
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here are my reflections:${context}\n\nPlease generate the 6 sections of my Primary Aim.` },
        ],
      });
      
      const content = response.choices[0].message.content;
      const text = typeof content === 'string' ? content : "";
      
      // Parse the response into sections
      const sections = {
        personalIdentity: "",
        relationships: "",
        contribution: "",
        healthVitality: "",
        growthLearning: "",
        legacy: "",
      };
      
      // Simple parsing - extract content after each numbered section
      const lines = text.split('\n');
      let currentSection = "";
      let currentContent: string[] = [];
      
      lines.forEach(line => {
        if (line.match(/1\.|Personal Identity/i)) {
          currentSection = "personalIdentity";
          currentContent = [];
        } else if (line.match(/2\.|Relationships/i)) {
          if (currentSection && currentContent.length > 0) {
            sections[currentSection as keyof typeof sections] = currentContent.join(' ').trim();
          }
          currentSection = "relationships";
          currentContent = [];
        } else if (line.match(/3\.|Contribution/i)) {
          if (currentSection && currentContent.length > 0) {
            sections[currentSection as keyof typeof sections] = currentContent.join(' ').trim();
          }
          currentSection = "contribution";
          currentContent = [];
        } else if (line.match(/4\.|Health|Vitality/i)) {
          if (currentSection && currentContent.length > 0) {
            sections[currentSection as keyof typeof sections] = currentContent.join(' ').trim();
          }
          currentSection = "healthVitality";
          currentContent = [];
        } else if (line.match(/5\.|Growth|Learning/i)) {
          if (currentSection && currentContent.length > 0) {
            sections[currentSection as keyof typeof sections] = currentContent.join(' ').trim();
          }
          currentSection = "growthLearning";
          currentContent = [];
        } else if (line.match(/6\.|Legacy/i)) {
          if (currentSection && currentContent.length > 0) {
            sections[currentSection as keyof typeof sections] = currentContent.join(' ').trim();
          }
          currentSection = "legacy";
          currentContent = [];
        } else if (line.trim() && currentSection) {
          currentContent.push(line.trim());
        }
      });
      
      // Save the last section
      if (currentSection && currentContent.length > 0) {
        sections[currentSection as keyof typeof sections] = currentContent.join(' ').trim();
      }
      
      return sections;
    }),
    
    suggestSection: protectedProcedure
      .input(z.object({ section: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { getUserJournalEntries, getUserVisionItems, getPatternInsights } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        const [journalEntries, visionItems, patterns] = await Promise.all([
          getUserJournalEntries(ctx.user.id),
          getUserVisionItems(ctx.user.id),
          getPatternInsights(ctx.user.id),
        ]);
        
        const sectionLabels: Record<string, string> = {
          personal: "Personal Identity",
          relationships: "Relationships",
          contribution: "Contribution/Work",
          health: "Health & Vitality",
          growth: "Growth & Learning",
          legacy: "Legacy",
        };
        
        const sectionLabel = sectionLabels[input.section] || input.section;
        
        const prompt = `Based on the user's journey data below, suggest a thoughtful 2-3 sentence reflection for their "${sectionLabel}" section of their Primary Aim.

Journal Entries:
${journalEntries.slice(0, 10).map((e: any) => `Q: ${e.question}\nA: ${e.response}`).join('\n\n')}

Vision Board Items:
${visionItems.map((v: any) => `${v.title}: ${v.description || ''}`).join('\n')}

Recurring Patterns:
${patterns.slice(0, 5).map((p: any) => p.pattern).join(', ')}

Provide a personalized suggestion that reflects their values, aspirations, and life themes. Focus on who they want to BE, not what they want to DO.`;
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a life coach helping someone discover their Primary Aim. Provide thoughtful, personalized suggestions based on their life story." },
            { role: "user", content: prompt },
          ],
        });
        
        const suggestion = response.choices[0]?.message?.content || "";
        
        return {
          section: input.section,
          suggestion,
        };
      }),
  }),

  meditation: router({
    getUserContext: protectedProcedure.query(async ({ ctx }) => {
      const { getUserJournalEntries, getUserVisionItems, getUserPrimaryAim } = await import("./db");
      const { getPatternInsights } = await import("./db");
      
      const [journalEntries, visionItems, primaryAim, patterns] = await Promise.all([
        getUserJournalEntries(ctx.user.id),
        getUserVisionItems(ctx.user.id),
        getUserPrimaryAim(ctx.user.id),
        getPatternInsights(ctx.user.id),
      ]);
      
      return {
        firstName: ctx.user.name?.split(" ")[0] || "friend",
        recentJournalEntries: journalEntries.slice(0, 5).map((e: any) => ({
          question: e.question,
          response: e.response,
        })),
        visionItems: visionItems.map((v: any) => ({
          title: v.title,
          description: v.description || "",
        })),
        primaryAimStatement: primaryAim?.statement || null,
        patterns: patterns.slice(0, 5),
      };
    }),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserMeditationSessions } = await import("./db");
      return getUserMeditationSessions(ctx.user.id);
    }),
    
    // Step 1: Generate personalized meditation (script + audio)
    generate: protectedProcedure
      .input(
        z.object({
          meditationType: z.string(),
          durationMinutes: z.number(),
          voiceId: z.string().optional(),
          customContext: z.any().optional(),
          ambientSound: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { getUserJournalEntries, getUserVisionItems, getUserPrimaryAim, createMeditationSession } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        const { generateSpeechAudio, isTTSAvailable } = await import("./_core/textToSpeech");
        
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
        
        const systemPrompt = `You are a meditation guide. Create a ${input.durationMinutes}-minute guided meditation for "${input.meditationType}".

IMPORTANT: Output ONLY the meditation script itself - the exact words to be spoken to the user. Do NOT include any meta-commentary, instructions, or explanations about the script.

Guidelines for the meditation:
- About ${input.durationMinutes * 80} words total (spoken at 80 words/minute for slower, more meditative pace)
- Use second person ("you", "your") throughout
- Begin with grounding (breath awareness, settling in)
- Middle section: main practice (visualization, body scan, or reflection)
- End with gentle integration and return to awareness
- Use calming, supportive, gentle language
- Include MANY natural pauses: use ellipsis (...) for 2-second pauses, and phrases like "pause here for three breaths" or "take a moment to simply be"
- Add breathing cues: "breathe in... and breathe out...", "take a deep breath..."
- Space out sentences with pauses between each instruction
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
        
        // Generate audio if TTS is available
        let audioUrl = "";
        if (isTTSAvailable()) {
          try {
            audioUrl = await generateSpeechAudio({ 
              text: script,
              voiceId: input.voiceId || "rachel",
            });
          } catch (error) {
            console.error("[Meditation] Failed to generate audio:", error);
          }
        }
        
        // Create meditation session
        const session = await createMeditationSession({
          userId: ctx.user.id,
          meditationType: input.meditationType,
          durationMinutes: input.durationMinutes,
          script,
          audioUrl: audioUrl || null,
          voiceId: input.voiceId || "rachel",
          ambientSound: input.ambientSound || "none",
        });
        
        return session;
      }),
    
    // Step 2: Save post-meditation reflection
    saveReflection: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          reflection: z.string(),
          rating: z.number().min(1).max(5).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateMeditationSession } = await import("./db");
        return updateMeditationSession(input.sessionId, ctx.user.id, {
          reflection: input.reflection,
          rating: input.rating,
        });
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
  
  aiChat: aiChatRouter,
});

export type AppRouter = typeof appRouter;
