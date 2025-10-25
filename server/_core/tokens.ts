import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Token costs for different AI operations
export const TOKEN_COSTS = {
  LLM_CHAT: 10,           // Per AI chat message
  LLM_GENERATION: 20,     // Per content generation (meditation, primary aim, etc.)
  IMAGE_GENERATION: 50,   // Per image generated
  TTS_MINUTE: 15,         // Per minute of text-to-speech
  PATTERN_ANALYSIS: 25,   // Per pattern analysis
};

export async function getUserTokens(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const [user] = await db.select({ aiTokens: users.aiTokens }).from(users).where(eq(users.id, userId));
  return user?.aiTokens || 0;
}

export async function deductTokens(userId: number, amount: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const currentTokens = await getUserTokens(userId);
  
  if (currentTokens < amount) {
    return false; // Insufficient tokens
  }
  
  await db.update(users)
    .set({ aiTokens: currentTokens - amount })
    .where(eq(users.id, userId));
  
  return true;
}

export async function addTokens(userId: number, amount: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const currentTokens = await getUserTokens(userId);
  await db.update(users)
    .set({ aiTokens: currentTokens + amount })
    .where(eq(users.id, userId));
}
