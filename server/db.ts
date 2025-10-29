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
  userEvents,
  InsertUserEvent,
  UserEvent,
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
  
  await db.insert(journalEntries).values(entry);
  
  // Get the most recently created entry for this user
  const [newEntry] = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, entry.userId!))
    .orderBy(desc(journalEntries.createdAt))
    .limit(1);
  
  if (!newEntry) {
    throw new Error("Failed to retrieve newly created journal entry");
  }
  
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
  
  await db.insert(visionItems).values(item);
  
  // Get the most recently created item for this user
  const [newItem] = await db
    .select()
    .from(visionItems)
    .where(eq(visionItems.userId, item.userId!))
    .orderBy(desc(visionItems.id))
    .limit(1);
  
  if (!newItem) {
    throw new Error("Failed to retrieve newly created vision item");
  }
  
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
    await db.insert(primaryAims).values({ ...aim, userId });
    
    // Get the newly created aim for this user
    const [newAim] = await db
      .select()
      .from(primaryAims)
      .where(eq(primaryAims.userId, userId))
      .limit(1);
    
    if (!newAim) {
      throw new Error("Failed to retrieve newly created primary aim");
    }
    
    return newAim;
  }
}

export async function getPatternInsights(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  
  const entries = await db.select().from(journalEntries).where(eq(journalEntries.userId, userId));
  const patterns: string[] = [];
  
  // Simple pattern detection based on keywords
  const keywords = {
    growth: ["learn", "grow", "develop", "improve", "better"],
    relationships: ["family", "friend", "love", "connect", "relationship"],
    purpose: ["purpose", "meaning", "why", "calling", "passion"],
    challenges: ["difficult", "hard", "struggle", "challenge", "obstacle"],
    gratitude: ["grateful", "thankful", "appreciate", "blessing", "fortunate"],
  };
  
  const counts: Record<string, number> = {};
  
  entries.forEach(entry => {
    const text = entry.response.toLowerCase();
    Object.entries(keywords).forEach(([theme, words]) => {
      if (words.some(word => text.includes(word))) {
        counts[theme] = (counts[theme] || 0) + 1;
      }
    });
  });
  
  // Return top patterns
  Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([theme, count]) => {
      if (count > 1) {
        patterns.push(`You frequently reflect on ${theme} (${count} times)`);
      }
    });
  
  return patterns;
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

export async function updateAgentSystemPrompt(agentId: number, systemPrompt: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiAgents)
    .set({ systemPrompt })
    .where(eq(aiAgents.id, agentId));
  return true;
}

export async function createChatSession(userId: number, agentId: number, title?: string, context?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatSessions).values({
    userId,
    agentId,
    title: title || null,
    context: context || null,
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

export async function updateChatSessionTitle(sessionId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(chatSessions)
    .set({ title })
    .where(eq(chatSessions.id, sessionId));
}

// In-memory storage for pending assistant messages (waiting for user to respond)
// Key: sessionId, Value: pending assistant message content
const pendingAssistantMessages = new Map<number, string>(); 

export async function savePendingAssistantMessage(sessionId: number, content: string) {
  pendingAssistantMessages.set(sessionId, content);
}

export async function getPendingAssistantMessage(sessionId: number): Promise<string | null> {
  return pendingAssistantMessages.get(sessionId) || null;
}

export async function clearPendingMessages(sessionId: number) {
  pendingAssistantMessages.delete(sessionId);
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

export async function deleteAllUserChatSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all user's chat sessions
  const sessions = await getUserChatSessions(userId);
  
  // Delete all messages for each session
  for (const session of sessions) {
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, session.id));
  }
  
  // Delete all sessions
  await db.delete(chatSessions).where(eq(chatSessions.userId, userId));
}

export async function deleteEmptyChatSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all user's chat sessions
  const sessions = await getUserChatSessions(userId);
  
  for (const session of sessions) {
    // Get messages for this session
    const messages = await getChatMessages(session.id);
    
    // Delete if no messages or only assistant messages (no user replies)
    const hasUserMessages = messages.some(m => m.role === 'user');
    if (!hasUserMessages) {
      await db.delete(chatMessages).where(eq(chatMessages.sessionId, session.id));
      await db.delete(chatSessions).where(eq(chatSessions.id, session.id));
    }
  }
}

export async function deleteChatSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First delete all messages in the session
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  
  // Then delete the session itself
  await db.delete(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
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
  
  // Check if user has 20+ meditations, delete oldest if needed
  const userSessions = await db
    .select()
    .from(meditationSessions)
    .where(eq(meditationSessions.userId, session.userId!))
    .orderBy(desc(meditationSessions.createdAt));
  
  if (userSessions.length >= 20) {
    // Delete the oldest meditation(s) to keep limit at 20
    const toDelete = userSessions.slice(19); // Keep newest 19, delete rest
    for (const old of toDelete) {
      await db.delete(meditationSessions).where(eq(meditationSessions.id, old.id));
    }
  }
  
  await db.insert(meditationSessions).values(session);
  
  // Get the most recently created session for this user
  const [newSession] = await db
    .select()
    .from(meditationSessions)
    .where(eq(meditationSessions.userId, session.userId!))
    .orderBy(desc(meditationSessions.createdAt))
    .limit(1);
  
  if (!newSession) {
    throw new Error("Failed to retrieve newly created meditation session");
  }
  
  return newSession;
}

export async function updateMeditationSession(id: number, userId: number, updates: Partial<InsertMeditationSession>): Promise<MeditationSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(meditationSessions)
    .set(updates)
    .where(and(eq(meditationSessions.id, id), eq(meditationSessions.userId, userId)));
  
  const [updated] = await db.select().from(meditationSessions)
    .where(eq(meditationSessions.id, id))
    .limit(1);
  
  if (!updated) {
    throw new Error("Failed to retrieve updated meditation session");
  }
  
  return updated;
}


export async function deleteMeditationSession(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(meditationSessions)
    .where(and(eq(meditationSessions.id, id), eq(meditationSessions.userId, userId)));
}

// User Events / Analytics
export async function logUserEvent(event: InsertUserEvent): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Analytics] Database not available, skipping event log");
    return;
  }
  
  try {
    await db.insert(userEvents).values(event);
  } catch (error) {
    console.error("[Analytics] Failed to log event:", error);
  }
}

export async function getUserRecentEvents(userId: number, limit: number = 50): Promise<UserEvent[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(userEvents)
    .where(eq(userEvents.userId, userId))
    .orderBy(desc(userEvents.createdAt))
    .limit(limit);
}

export async function getAllRecentEvents(limit: number = 100): Promise<UserEvent[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(userEvents)
    .orderBy(desc(userEvents.createdAt))
    .limit(limit);
}



export async function getAllUsers(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(users)
    .orderBy(desc(users.createdAt));
}

