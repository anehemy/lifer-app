import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  journalEntries,
  InsertJournalEntry,
  JournalEntry,
  visionItems,
  InsertVisionItem,
  VisionItem,
  primaryAims,
  InsertPrimaryAim,
  PrimaryAim,
  meditationSessions,
  InsertMeditationSession,
  MeditationSession,
  aiAgents,
  chatSessions,
  chatMessages,
  AiAgent,
  ChatSession,
  ChatMessage,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Lifer App Query Helpers



// Journal Entries
export async function getUserJournalEntries(userId: number): Promise<JournalEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt));
}

export async function createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(journalEntries).values(entry);
  const insertId = Number((result as any).insertId);
  const [newEntry] = await db.select().from(journalEntries).where(eq(journalEntries.id, insertId));
  return newEntry;
}

export async function deleteJournalEntry(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
}

// Vision Board
export async function getUserVisionItems(userId: number): Promise<VisionItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(visionItems).where(eq(visionItems.userId, userId)).orderBy(visionItems.position);
}

export async function createVisionItem(item: InsertVisionItem): Promise<VisionItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(visionItems).values(item);
  const insertId = Number((result as any).insertId);
  const [newItem] = await db.select().from(visionItems).where(eq(visionItems.id, insertId));
  return newItem;
}

export async function updateVisionItem(id: number, userId: number, updates: Partial<InsertVisionItem>): Promise<VisionItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(visionItems).set(updates).where(and(eq(visionItems.id, id), eq(visionItems.userId, userId)));
  const [updated] = await db.select().from(visionItems).where(eq(visionItems.id, id));
  return updated;
}

export async function deleteVisionItem(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(visionItems).where(and(eq(visionItems.id, id), eq(visionItems.userId, userId)));
}

// Primary Aim
export async function getUserPrimaryAim(userId: number): Promise<PrimaryAim | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(primaryAims).where(eq(primaryAims.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertPrimaryAim(userId: number, aim: Partial<InsertPrimaryAim>): Promise<PrimaryAim> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserPrimaryAim(userId);
  
  if (existing) {
    await db.update(primaryAims).set(aim).where(eq(primaryAims.userId, userId));
    const [updated] = await db.select().from(primaryAims).where(eq(primaryAims.userId, userId));
    return updated;
  } else {
    const result = await db.insert(primaryAims).values({ ...aim, userId });
    const insertId = Number((result as any).insertId);
    const [newAim] = await db.select().from(primaryAims).where(eq(primaryAims.id, insertId));
    return newAim;
  }
}

// AI Agents and Chat
export async function getAllAgents() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(aiAgents).where(eq(aiAgents.isActive, 1));
}

export async function getAgentById(agentId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createChatSession(userId: number, agentId: number, title?: string, context?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatSessions).values({
    userId,
    agentId,
    title: title || null,
    context: context ? JSON.stringify(context) : null,
  });
  return result[0].insertId;
}

export async function getUserChatSessions(userId: number, agentId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (agentId) {
    return await db.select().from(chatSessions)
      .where(and(eq(chatSessions.userId, userId), eq(chatSessions.agentId, agentId)))
      .orderBy(desc(chatSessions.updatedAt));
  }
  return await db.select().from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt));
}

export async function getChatSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function addChatMessage(sessionId: number, role: "user" | "assistant" | "system", content: string, metadata?: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values({
    sessionId,
    role,
    content,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

export async function getChatMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);
}

// Meditation Sessions
export async function getUserMeditationSessions(userId: number): Promise<MeditationSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meditationSessions).where(eq(meditationSessions.userId, userId)).orderBy(desc(meditationSessions.completedAt));
}

export async function createMeditationSession(session: InsertMeditationSession): Promise<MeditationSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(meditationSessions).values(session);
  const insertId = Number((result as any).insertId);
  const [newSession] = await db.select().from(meditationSessions).where(eq(meditationSessions.id, insertId));
  return newSession;
}
