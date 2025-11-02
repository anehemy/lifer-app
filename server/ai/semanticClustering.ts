import { invokeLLM } from "../_core/llm";

/**
 * Generate semantic embedding for a journal entry
 * Uses LLM to create a vector representation of the experience
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Create a rich semantic representation by combining question and response
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Generate a semantic embedding that captures the psychological essence, emotional tone, and thematic content of this life experience."
        },
        {
          role: "user",
          content: text
        }
      ],
      // Note: We'll use the response to generate a simple embedding
      // In production, you'd use a dedicated embedding model like text-embedding-ada-002
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Simple embedding: convert text to numerical vector based on word frequencies
    // This is a placeholder - in production use proper embedding API
    return textToSimpleEmbedding(content + " " + text);
  } catch (error) {
    console.error("[Embedding] Failed to generate embedding:", error);
    throw error;
  }
}

/**
 * Simple text-to-embedding conversion (placeholder)
 * In production, replace with proper embedding API (OpenAI, Cohere, etc.)
 */
function textToSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // 384-dimensional vector
  
  // Hash each word to a position and increment
  words.forEach(word => {
    const hash = simpleHash(word);
    const index = hash % embedding.length;
    embedding[index] += 1;
  });
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

/**
 * Simple string hash function
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }
  
  return dotProduct / (mag1 * mag2);
}

/**
 * Find similar experiences based on semantic similarity
 * Returns experiences sorted by similarity score (highest first)
 */
export interface SimilarExperience {
  entryId: number;
  similarity: number;
  question: string;
  response: string;
  primaryTheme?: string;
  experienceArchetype?: string;
}

export function findSimilarExperiences(
  targetEmbedding: number[],
  allExperiences: Array<{
    entryId: number;
    embedding: number[];
    question: string;
    response: string;
    primaryTheme?: string;
    experienceArchetype?: string;
  }>,
  threshold: number = 0.7,
  limit: number = 5
): SimilarExperience[] {
  const similarities = allExperiences
    .map(exp => ({
      entryId: exp.entryId,
      similarity: cosineSimilarity(targetEmbedding, exp.embedding),
      question: exp.question,
      response: exp.response,
      primaryTheme: exp.primaryTheme,
      experienceArchetype: exp.experienceArchetype
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
  
  return similarities;
}

/**
 * Cluster experiences using simple threshold-based clustering
 * Groups experiences with similarity above threshold
 */
export interface ExperienceCluster {
  id: number;
  experiences: number[]; // Array of entryIds
  centroid: number[]; // Average embedding
  theme?: string;
  archetype?: string;
}

export function clusterExperiences(
  experiences: Array<{
    entryId: number;
    embedding: number[];
    primaryTheme?: string;
    experienceArchetype?: string;
  }>,
  similarityThreshold: number = 0.75
): ExperienceCluster[] {
  const clusters: ExperienceCluster[] = [];
  const assigned = new Set<number>();
  
  experiences.forEach((exp, idx) => {
    if (assigned.has(exp.entryId)) return;
    
    // Start a new cluster
    const cluster: ExperienceCluster = {
      id: clusters.length + 1,
      experiences: [exp.entryId],
      centroid: [...exp.embedding],
      theme: exp.primaryTheme,
      archetype: exp.experienceArchetype
    };
    
    assigned.add(exp.entryId);
    
    // Find similar experiences to add to this cluster
    experiences.forEach((other, otherIdx) => {
      if (idx === otherIdx || assigned.has(other.entryId)) return;
      
      const similarity = cosineSimilarity(exp.embedding, other.embedding);
      if (similarity >= similarityThreshold) {
        cluster.experiences.push(other.entryId);
        assigned.add(other.entryId);
        
        // Update centroid (average embedding)
        for (let i = 0; i < cluster.centroid.length; i++) {
          cluster.centroid[i] = (cluster.centroid[i] * (cluster.experiences.length - 1) + other.embedding[i]) / cluster.experiences.length;
        }
      }
    });
    
    clusters.push(cluster);
  });
  
  return clusters;
}

/**
 * Identify recurring patterns across experiences
 * Analyzes clusters to find common themes and archetypes
 */
export interface LifePattern {
  patternId: number;
  name: string;
  description: string;
  frequency: number; // How many experiences match this pattern
  experiences: number[]; // Entry IDs
  themes: string[]; // Common life themes
  archetypes: string[]; // Common experience archetypes
  insight: string; // AI-generated wisdom about this pattern
}

export async function identifyPatterns(
  clusters: ExperienceCluster[],
  allExperiences: Array<{
    entryId: number;
    question: string;
    response: string;
    primaryTheme?: string;
    experienceArchetype?: string;
  }>
): Promise<LifePattern[]> {
  const patterns: LifePattern[] = [];
  
  // Analyze each cluster for patterns
  for (const cluster of clusters) {
    if (cluster.experiences.length < 2) continue; // Need at least 2 experiences for a pattern
    
    const clusterExperiences = allExperiences.filter(exp => 
      cluster.experiences.includes(exp.entryId)
    );
    
    // Extract common themes and archetypes
    const themes = new Set<string>();
    const archetypes = new Set<string>();
    
    clusterExperiences.forEach(exp => {
      if (exp.primaryTheme) themes.add(exp.primaryTheme);
      if (exp.experienceArchetype) archetypes.add(exp.experienceArchetype);
    });
    
    // Generate pattern insight using LLM
    const experienceTexts = clusterExperiences
      .map(exp => `Q: ${exp.question}\nA: ${exp.response}`)
      .join("\n\n");
    
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are analyzing life patterns. Identify the recurring theme or lesson across these related experiences. Provide a concise, insightful observation (2-3 sentences max)."
          },
          {
            role: "user",
            content: `These ${clusterExperiences.length} experiences seem related:\n\n${experienceTexts}\n\nWhat pattern or recurring theme do you see?`
          }
        ]
      });
      
      const insight = response.choices[0]?.message?.content || "A pattern of related experiences.";
      
      patterns.push({
        patternId: patterns.length + 1,
        name: Array.from(archetypes)[0] || `Pattern ${patterns.length + 1}`,
        description: insight,
        frequency: cluster.experiences.length,
        experiences: cluster.experiences,
        themes: Array.from(themes),
        archetypes: Array.from(archetypes),
        insight
      });
    } catch (error) {
      console.error("[Pattern Recognition] Failed to generate insight:", error);
      // Continue with next cluster
    }
  }
  
  return patterns.sort((a, b) => b.frequency - a.frequency);
}

