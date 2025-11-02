import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { analyzeExperience, calculateSimilarity } from "./ai/experienceAnalyzer";
import {
  generateEmbedding,
  cosineSimilarity,
  findSimilarExperiences,
  clusterExperiences,
  identifyPatterns,
  type SimilarExperience,
  type ExperienceCluster,
  type LifePattern
} from "./ai/semanticClustering";
import { generateConsolidatedWisdom, suggestCombinationName } from "./ai/wisdomGenerator";
import {
  getJournalEntryById,
  saveExperienceAnalysis,
  getExperienceAnalysis,
  getUserExperienceAnalyses,
  getDb,
} from "./db";
import { journalEntries, experienceAnalyses, combinedExperiences, experienceCombinations } from "../drizzle/schema";
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

  /**
   * Generate embeddings for all analyzed experiences
   */
  generateEmbeddings: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const analyses = await getUserExperienceAnalyses(ctx.user.id);
    let generated = 0;

    for (const analysis of analyses) {
      // Skip if already has embedding
      if (analysis.semanticEmbedding) continue;

      const entry = await getJournalEntryById(analysis.entryId);
      if (!entry) continue;

      // Generate embedding from question + response
      const text = `${entry.question} ${entry.response}`;
      const embedding = await generateEmbedding(text);

      // Save embedding to database
      await db
        .update(experienceAnalyses)
        .set({ semanticEmbedding: JSON.stringify(embedding) })
        .where(eq(experienceAnalyses.id, analysis.id));

      generated++;
    }

    return { generated, total: analyses.length };
  }),

  /**
   * Find semantically similar experiences using embeddings
   */
  findSimilarSemantic: protectedProcedure
    .input(z.object({ entryId: z.number(), threshold: z.number().default(0.7), limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      const entry = await getJournalEntryById(input.entryId);
      if (!entry || entry.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const targetAnalysis = await getExperienceAnalysis(input.entryId);
      if (!targetAnalysis || !targetAnalysis.semanticEmbedding) {
        throw new Error("Entry not analyzed or embedding not generated");
      }

      const targetEmbedding = JSON.parse(targetAnalysis.semanticEmbedding);

      // Get all user's analyses with embeddings
      const allAnalyses = await getUserExperienceAnalyses(ctx.user.id);
      const withEmbeddings = allAnalyses.filter(
        a => a.entryId !== input.entryId && a.semanticEmbedding
      );

      // Get corresponding journal entries
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const experiences = await Promise.all(
        withEmbeddings.map(async a => {
          const e = await getJournalEntryById(a.entryId);
          return {
            entryId: a.entryId,
            embedding: JSON.parse(a.semanticEmbedding!),
            question: e?.question || "",
            response: e?.response || "",
            primaryTheme: a.primaryTheme || undefined,
            experienceArchetype: a.experienceArchetype || undefined,
          };
        })
      );

      const similar = findSimilarExperiences(
        targetEmbedding,
        experiences,
        input.threshold,
        input.limit
      );

      return similar;
    }),

  /**
   * Cluster all experiences and identify patterns
   */
  clusterAndIdentifyPatterns: protectedProcedure
    .input(z.object({ similarityThreshold: z.number().default(0.75) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all analyses with embeddings
      const allAnalyses = await getUserExperienceAnalyses(ctx.user.id);
      const withEmbeddings = allAnalyses.filter(a => a.semanticEmbedding);

      if (withEmbeddings.length < 2) {
        return {
          clusters: [],
          patterns: [],
          message: "Need at least 2 analyzed experiences with embeddings"
        };
      }

      // Prepare data for clustering
      const experiences = withEmbeddings.map(a => ({
        entryId: a.entryId,
        embedding: JSON.parse(a.semanticEmbedding!),
        primaryTheme: a.primaryTheme || undefined,
        experienceArchetype: a.experienceArchetype || undefined,
      }));

      // Perform clustering
      const clusters = clusterExperiences(experiences, input.similarityThreshold);

      // Update cluster IDs in database
      for (const cluster of clusters) {
        for (const entryId of cluster.experiences) {
          const analysis = withEmbeddings.find(a => a.entryId === entryId);
          if (analysis) {
            await db
              .update(experienceAnalyses)
              .set({ clusterId: cluster.id })
              .where(eq(experienceAnalyses.id, analysis.id));
          }
        }
      }

      // Get full experience data for pattern recognition
      const allExperiences = await Promise.all(
        withEmbeddings.map(async a => {
          const entry = await getJournalEntryById(a.entryId);
          return {
            entryId: a.entryId,
            question: entry?.question || "",
            response: entry?.response || "",
            primaryTheme: a.primaryTheme || undefined,
            experienceArchetype: a.experienceArchetype || undefined,
          };
        })
      );

      // Identify patterns
      const patterns = await identifyPatterns(clusters, allExperiences);

      return {
        clusters: clusters.map(c => ({
          id: c.id,
          experienceCount: c.experiences.length,
          experiences: c.experiences,
          theme: c.theme,
          archetype: c.archetype
        })),
        patterns,
        totalClusters: clusters.length,
        totalPatterns: patterns.length
      };
    }),

  /**
   * Get all clusters for the user
   */
  getClusters: protectedProcedure.query(async ({ ctx }) => {
    const analyses = await getUserExperienceAnalyses(ctx.user.id);
    const clustered = analyses.filter(a => a.clusterId !== null);

    // Group by cluster ID
    const clusterMap = new Map<number, typeof analyses>();
    clustered.forEach(a => {
      const clusterId = a.clusterId!;
      if (!clusterMap.has(clusterId)) {
        clusterMap.set(clusterId, []);
      }
      clusterMap.get(clusterId)!.push(a);
    });

    // Get journal entries for each cluster
    const clusters = await Promise.all(
      Array.from(clusterMap.entries()).map(async ([clusterId, analyses]) => {
        const entries = await Promise.all(
          analyses.map(a => getJournalEntryById(a.entryId))
        );

        return {
          id: clusterId,
          experienceCount: analyses.length,
          entries: entries.filter(e => e !== undefined),
          analyses: analyses.map(a => ({
            ...a,
            secondaryThemes: a.secondaryThemes ? JSON.parse(a.secondaryThemes) : [],
            keywords: a.keywords ? JSON.parse(a.keywords) : [],
          })),
        };
      })
    );

    return clusters;
  }),

  /**
   * Combine multiple experiences into a consolidated wisdom insight
   */
  combineExperiences: protectedProcedure
    .input(z.object({
      entryIds: z.array(z.number()).min(2),
      customName: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Validate all entries belong to user and are analyzed
      const entries = await Promise.all(
        input.entryIds.map(id => getJournalEntryById(id))
      );

      const analyses = await Promise.all(
        input.entryIds.map(id => getExperienceAnalysis(id))
      );

      // Check ownership
      if (entries.some(e => !e || e.userId !== ctx.user.id)) {
        throw new Error("Unauthorized or entry not found");
      }

      // Check all are analyzed
      if (analyses.some(a => !a)) {
        throw new Error("All entries must be analyzed first");
      }

      // Prepare data for wisdom generation
      const experiencesData = entries.map((entry, idx) => ({
        question: entry!.question,
        response: entry!.response,
        theme: analyses[idx]!.primaryTheme,
        archetype: analyses[idx]!.experienceArchetype,
        valence: analyses[idx]!.valence,
        impact: analyses[idx]!.impact,
        challenge: analyses[idx]!.challenge,
        worldviewChange: analyses[idx]!.worldviewChange,
      }));

      // Generate consolidated wisdom
      const wisdom = await generateConsolidatedWisdom(experiencesData);

      // Suggest name if not provided
      const name = input.customName || await suggestCombinationName(
        wisdom.consolidatedWisdom,
        wisdom.archetypes
      );

      // Save combined experience
      const [combinedExp] = await db.insert(combinedExperiences).values({
        userId: ctx.user.id,
        name,
        consolidatedWisdom: wisdom.consolidatedWisdom,
        primaryTheme: wisdom.primaryTheme,
        archetypes: JSON.stringify(wisdom.archetypes),
      });

      const combinedId = combinedExp.insertId;

      // Link journal entries to combined experience
      await Promise.all(
        input.entryIds.map(entryId =>
          db.insert(experienceCombinations).values({
            combinedExperienceId: combinedId,
            journalEntryId: entryId,
          })
        )
      );

      return {
        id: combinedId,
        name,
        ...wisdom,
        entryCount: input.entryIds.length,
      };
    }),

  /**
   * Get all combined experiences for the user
   */
  getCombinedExperiences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const combined = await db
      .select()
      .from(combinedExperiences)
      .where(eq(combinedExperiences.userId, ctx.user.id));

    // Get linked entries for each combination
    const withEntries = await Promise.all(
      combined.map(async (comb) => {
        const links = await db
          .select()
          .from(experienceCombinations)
          .where(eq(experienceCombinations.combinedExperienceId, comb.id));

        const entries = await Promise.all(
          links.map(link => getJournalEntryById(link.journalEntryId))
        );

        return {
          ...comb,
          archetypes: comb.archetypes ? JSON.parse(comb.archetypes) : [],
          entries: entries.filter(e => e !== undefined),
          entryCount: entries.length,
        };
      })
    );

    return withEntries;
  }),

  /**
   * Get a single combined experience with full details
   */
  getCombinedExperience: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [combined] = await db
        .select()
        .from(combinedExperiences)
        .where(eq(combinedExperiences.id, input.id));

      if (!combined || combined.userId !== ctx.user.id) {
        throw new Error("Not found or unauthorized");
      }

      // Get linked entries
      const links = await db
        .select()
        .from(experienceCombinations)
        .where(eq(experienceCombinations.combinedExperienceId, combined.id));

      const entries = await Promise.all(
        links.map(link => getJournalEntryById(link.journalEntryId))
      );

      const analyses = await Promise.all(
        links.map(link => getExperienceAnalysis(link.journalEntryId))
      );

      return {
        ...combined,
        archetypes: combined.archetypes ? JSON.parse(combined.archetypes) : [],
        entries: entries.filter(e => e !== undefined).map((entry, idx) => ({
          ...entry,
          analysis: analyses[idx],
        })),
      };
    }),

  /**
   * Delete a combined experience
   */
  deleteCombinedExperience: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify ownership
      const [combined] = await db
        .select()
        .from(combinedExperiences)
        .where(eq(combinedExperiences.id, input.id));

      if (!combined || combined.userId !== ctx.user.id) {
        throw new Error("Not found or unauthorized");
      }

      // Delete links first
      await db
        .delete(experienceCombinations)
        .where(eq(experienceCombinations.combinedExperienceId, input.id));

      // Delete combined experience
      await db
        .delete(combinedExperiences)
        .where(eq(combinedExperiences.id, input.id));

      return { success: true };
    }),

  /**
   * Update experienceType metadata for selected entries based on their primaryTheme
   */
  updateExperienceFromTheme: protectedProcedure
    .input(z.object({ entryIds: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (input.entryIds.length === 0) {
        throw new Error("No entries selected");
      }

      let updated = 0;
      const errors: string[] = [];

      for (const entryId of input.entryIds) {
        try {
          // Get the entry to verify ownership
          const entry = await getJournalEntryById(entryId);
          if (!entry || entry.userId !== ctx.user.id) {
            errors.push(`Entry ${entryId}: Not found or unauthorized`);
            continue;
          }

          // Get the analysis to get primaryTheme
          const analysis = await getExperienceAnalysis(entryId);
          if (!analysis) {
            errors.push(`Entry ${entryId}: Not analyzed yet`);
            continue;
          }

          // Update the experienceType field with primaryTheme value
          await db
            .update(journalEntries)
            .set({ experienceType: analysis.primaryTheme })
            .where(eq(journalEntries.id, entryId));

          updated++;
        } catch (error) {
          console.error(`[ExperiencesRouter] Error updating entry ${entryId}:`, error);
          errors.push(`Entry ${entryId}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      return {
        updated,
        total: input.entryIds.length,
        errors,
      };
    }),

  /**
   * Re-analyze entries that have theme names as experienceType
   * This restores proper experience types that were overwritten
   */
  reanalyzeThemeEntries: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const themeNames = ['Freedom', 'Love', 'Power', 'Truth', 'Value'];
      
      // Find all entries where experienceType is a theme name
      const entries = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, ctx.user.id));

      const themeEntries = entries.filter(e => 
        e.experienceType && themeNames.includes(e.experienceType)
      );

      console.log(`[ExperiencesRouter] Found ${themeEntries.length} entries with theme names as experienceType`);

      let reanalyzed = 0;
      const errors: string[] = [];

      for (const entry of themeEntries) {
        try {
          // Re-extract metadata using AI
          const { invokeLLM } = await import("./_core/llm");
          
          const metadataPrompt = `Analyze this journal entry and extract contextual metadata. Return ONLY a JSON object with these fields (use null if not applicable):
{
  "timeContext": "time period mentioned (e.g., 'childhood', '2010', 'age 15', 'summer')",
  "placeContext": "location mentioned (e.g., 'New York', 'grandfather's garage', 'school')",
  "experienceType": "type of experience (e.g., 'learning', 'relationship', 'achievement', 'loss', 'career change', 'relocation')",
  "challengeType": "challenge faced if any (e.g., 'bullying', 'failure', 'conflict', 'loss')",
  "growthTheme": "growth or lesson (e.g., 'resilience', 'patience', 'self-discovery', 'courage')"
}

Question: ${entry.question}
Response: ${entry.response}`;

          const result = await invokeLLM({
            messages: [{ role: "user", content: metadataPrompt }],
          });

          const content = result.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No response from LLM");
          }

          const metadata = JSON.parse(content);
          
          // Update experienceType with the re-analyzed value
          await db
            .update(journalEntries)
            .set({ 
              experienceType: metadata.experienceType,
              // Also update other fields if they were affected
              timeContext: metadata.timeContext || entry.timeContext,
              placeContext: metadata.placeContext || entry.placeContext,
              challengeType: metadata.challengeType || entry.challengeType,
              growthTheme: metadata.growthTheme || entry.growthTheme,
            })
            .where(eq(journalEntries.id, entry.id));

          reanalyzed++;
          console.log(`[ExperiencesRouter] Re-analyzed entry ${entry.id}: ${entry.experienceType} → ${metadata.experienceType}`);
        } catch (error) {
          console.error(`[ExperiencesRouter] Error re-analyzing entry ${entry.id}:`, error);
          errors.push(`Entry ${entry.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      return {
        reanalyzed,
        total: themeEntries.length,
        errors,
      };
    }),
});

