import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { analyzeExperience, calculateSimilarity } from "./ai/experienceAnalyzer";
import {
  getJournalEntryById,
  saveExperienceAnalysis,
  getExperienceAnalysis,
  getUserExperienceAnalyses,
  getDb,
} from "./db";
import { journalEntries } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const experiencesRouter = router({
  /**
   * Analyze a single journal entry
   */
  analyze: protectedProcedure
    .input(z.object({ entryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get the journal entry
      const entry = await getJournalEntryById(input.entryId);
      if (!entry) {
        throw new Error("Journal entry not found");
      }

      // Check if user owns this entry
      if (entry.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Check if already analyzed
      const existing = await getExperienceAnalysis(input.entryId);
      if (existing) {
        return {
          analysis: existing,
          alreadyAnalyzed: true,
        };
      }

      // Analyze the experience
      const analysisResult = await analyzeExperience(entry);

      // Save to database
      const saved = await saveExperienceAnalysis({
        entryId: entry.id,
        userId: ctx.user.id,
        valence: analysisResult.valence,
        impact: analysisResult.impact,
        predictability: analysisResult.predictability,
        challenge: analysisResult.challenge,
        emotionalSignificance: analysisResult.emotionalSignificance,
        worldviewChange: analysisResult.worldviewChange,
        primaryTheme: analysisResult.primaryTheme,
        secondaryThemes: JSON.stringify(analysisResult.secondaryThemes),
        experienceArchetype: analysisResult.experienceArchetype,
        keywords: JSON.stringify(analysisResult.keywords),
        emotionalTone: analysisResult.emotionalTone,
        clusterId: null,
        semanticEmbedding: JSON.stringify([]), // Will be populated in Phase 2
      });

      return {
        analysis: saved,
        alreadyAnalyzed: false,
      };
    }),

  /**
   * Batch analyze all user's journal entries
   */
  analyzeAll: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all user's journal entries
    const entries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, ctx.user.id));

    let analyzed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        // Check if already analyzed
        const existing = await getExperienceAnalysis(entry.id);
        if (existing) {
          skipped++;
          continue;
        }

        // Analyze
        const analysisResult = await analyzeExperience(entry);

        // Save
        await saveExperienceAnalysis({
          entryId: entry.id,
          userId: ctx.user.id,
          valence: analysisResult.valence,
          impact: analysisResult.impact,
          predictability: analysisResult.predictability,
          challenge: analysisResult.challenge,
          emotionalSignificance: analysisResult.emotionalSignificance,
          worldviewChange: analysisResult.worldviewChange,
          primaryTheme: analysisResult.primaryTheme,
          secondaryThemes: JSON.stringify(analysisResult.secondaryThemes),
          experienceArchetype: analysisResult.experienceArchetype,
          keywords: JSON.stringify(analysisResult.keywords),
          emotionalTone: analysisResult.emotionalTone,
          clusterId: null,
          semanticEmbedding: JSON.stringify([]),
        });

        analyzed++;
      } catch (error) {
        console.error(`[ExperiencesRouter] Error analyzing entry ${entry.id}:`, error);
        errors.push(`Entry ${entry.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return {
      total: entries.length,
      analyzed,
      skipped,
      errors,
    };
  }),

  /**
   * Get analysis for a specific entry
   */
  getAnalysis: protectedProcedure
    .input(z.object({ entryId: z.number() }))
    .query(async ({ ctx, input }) => {
      const entry = await getJournalEntryById(input.entryId);
      if (!entry || entry.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const analysis = await getExperienceAnalysis(input.entryId);
      return analysis;
    }),

  /**
   * Get all analyses for the user
   */
  getAllAnalyses: protectedProcedure.query(async ({ ctx }) => {
    const analyses = await getUserExperienceAnalyses(ctx.user.id);
    
    // Parse JSON fields
    return analyses.map(a => ({
      ...a,
      secondaryThemes: a.secondaryThemes ? JSON.parse(a.secondaryThemes) : [],
      keywords: a.keywords ? JSON.parse(a.keywords) : [],
    }));
  }),

  /**
   * Find similar experiences based on analysis
   */
  findSimilar: protectedProcedure
    .input(z.object({ entryId: z.number(), limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      const entry = await getJournalEntryById(input.entryId);
      if (!entry || entry.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const targetAnalysis = await getExperienceAnalysis(input.entryId);
      if (!targetAnalysis) {
        throw new Error("Entry not analyzed yet");
      }

      // Get all user's analyses
      const allAnalyses = await getUserExperienceAnalyses(ctx.user.id);

      // Calculate similarity scores
      const similarities = allAnalyses
        .filter(a => a.entryId !== input.entryId)
        .map(a => {
          const similarity = calculateSimilarity(
            {
              valence: targetAnalysis.valence!,
              impact: targetAnalysis.impact!,
              predictability: targetAnalysis.predictability!,
              challenge: targetAnalysis.challenge!,
              emotionalSignificance: targetAnalysis.emotionalSignificance!,
              worldviewChange: targetAnalysis.worldviewChange!,
              primaryTheme: targetAnalysis.primaryTheme!,
              secondaryThemes: targetAnalysis.secondaryThemes ? JSON.parse(targetAnalysis.secondaryThemes) : [],
              experienceArchetype: targetAnalysis.experienceArchetype!,
              keywords: targetAnalysis.keywords ? JSON.parse(targetAnalysis.keywords) : [],
              emotionalTone: targetAnalysis.emotionalTone!,
              summary: "",
            },
            {
              valence: a.valence!,
              impact: a.impact!,
              predictability: a.predictability!,
              challenge: a.challenge!,
              emotionalSignificance: a.emotionalSignificance!,
              worldviewChange: a.worldviewChange!,
              primaryTheme: a.primaryTheme!,
              secondaryThemes: a.secondaryThemes ? JSON.parse(a.secondaryThemes) : [],
              experienceArchetype: a.experienceArchetype!,
              keywords: a.keywords ? JSON.parse(a.keywords) : [],
              emotionalTone: a.emotionalTone!,
              summary: "",
            }
          );

          return {
            entryId: a.entryId,
            similarity,
            analysis: a,
          };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, input.limit);

      // Get the actual journal entries
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const similarEntries = await Promise.all(
        similarities.map(async s => {
          const entry = await getJournalEntryById(s.entryId);
          return {
            entry,
            analysis: {
              ...s.analysis,
              secondaryThemes: s.analysis.secondaryThemes ? JSON.parse(s.analysis.secondaryThemes) : [],
              keywords: s.analysis.keywords ? JSON.parse(s.analysis.keywords) : [],
            },
            similarity: s.similarity,
          };
        })
      );

      return similarEntries;
    }),

  /**
   * Get statistics about analyzed experiences
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const totalEntries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, ctx.user.id));

    const analyses = await getUserExperienceAnalyses(ctx.user.id);

    // Count by theme
    const themeCount: Record<string, number> = {};
    analyses.forEach(a => {
      if (a.primaryTheme) {
        themeCount[a.primaryTheme] = (themeCount[a.primaryTheme] || 0) + 1;
      }
    });

    // Average dimensions
    const avgImpact = analyses.reduce((sum, a) => sum + (a.impact || 0), 0) / analyses.length || 0;
    const avgChallenge = analyses.reduce((sum, a) => sum + (a.challenge || 0), 0) / analyses.length || 0;
    const avgWorldviewChange = analyses.reduce((sum, a) => sum + (a.worldviewChange || 0), 0) / analyses.length || 0;

    return {
      totalEntries: totalEntries.length,
      analyzedEntries: analyses.length,
      percentageAnalyzed: (analyses.length / totalEntries.length) * 100 || 0,
      themeDistribution: themeCount,
      averages: {
        impact: Math.round(avgImpact * 10) / 10,
        challenge: Math.round(avgChallenge * 10) / 10,
        worldviewChange: Math.round(avgWorldviewChange * 10) / 10,
      },
    };
  }),
});

