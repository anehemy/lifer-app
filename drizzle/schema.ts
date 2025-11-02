import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  aiTokens: int("aiTokens").default(1000).notNull(), // AI usage tokens
  hasSeenWelcome: boolean("hasSeenWelcome").default(false).notNull(), // Track if user has seen welcome guide
  introAudioUrl: text("introAudioUrl"), // Custom intro audio URL for Start Here guide
  birthYear: int("birthYear"), // User's birth year for timeline visualization
  autoApproveThoughts: boolean("autoApproveThoughts").default(false).notNull(), // Auto-approve free-form thoughts without review
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Lifer App Tables

/**
 * Journal entries for life story journaling
 */
export const journalEntries = mysqlTable("journalEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  response: text("response").notNull(),
  // Contextual metadata extracted from response
  timeContext: text("timeContext"), // e.g., "childhood", "2010", "age 15"
  placeContext: text("placeContext"), // e.g., "New York", "grandfather's garage"
  experienceType: text("experienceType"), // e.g., "learning", "relationship", "achievement"
  challengeType: text("challengeType"), // e.g., "bullying", "loss", "failure"
  growthTheme: text("growthTheme"), // e.g., "resilience", "patience", "self-discovery"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JournalEntry = typeof journalEntries.$inferSelect;

/**
 * Mr. MG conversation history
 */
export const mrMgConversations = mysqlTable("mrMgConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(), // user or Mr. MG
  content: text("content").notNull(),
  actionType: varchar("actionType", { length: 64 }), // navigate, create, delete, query, chat
  actionTarget: varchar("actionTarget", { length: 255 }), // target resource
  actionStatus: mysqlEnum("actionStatus", ["pending", "confirmed", "executed", "cancelled"]), // for 3-step workflow
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MrMgConversation = typeof mrMgConversations.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

/**
 * Vision board items
 */
export const visionItems = mysqlTable("visionItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  affirmation: text("affirmation"),
  connectionToPrimaryAim: text("connectionToPrimaryAim"),
  imageUrl: text("imageUrl"),
  position: int("position").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VisionItem = typeof visionItems.$inferSelect;
export type InsertVisionItem = typeof visionItems.$inferInsert;

/**
 * Data completion notifications - prompts users to fill missing metadata
 */
export const dataNotifications = mysqlTable("dataNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  entryId: int("entryId").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  fieldName: varchar("fieldName", { length: 64 }).notNull(), // e.g., "timeContext", "placeContext"
  promptQuestion: text("promptQuestion").notNull(), // e.g., "When did this happen?"
  isDismissed: boolean("isDismissed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataNotification = typeof dataNotifications.$inferSelect;
export type InsertDataNotification = typeof dataNotifications.$inferInsert;

/**
 * Primary Aim canvas and statement
 */
export const primaryAims = mysqlTable("primaryAims", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  statement: text("statement"),
  personal: text("personal"),
  relationships: text("relationships"),
  contribution: text("contribution"),
  health: text("health"),
  growth: text("growth"),
  legacy: text("legacy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrimaryAim = typeof primaryAims.$inferSelect;
export type InsertPrimaryAim = typeof primaryAims.$inferInsert;

/**
 * AI Agents and Chat System
 */
export const aiAgents = mysqlTable("ai_agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 100 }).notNull(),
  systemPrompt: text("system_prompt").notNull(),
  capabilities: text("capabilities").notNull(), // JSON array of capabilities
  avatar: varchar("avatar", { length: 10 }).notNull(),
  isActive: int("is_active").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  agentId: int("agent_id").notNull(),
  title: varchar("title", { length: 255 }),
  context: text("context"), // JSON context data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = typeof aiAgents.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Meditation session history
 */
export const meditationSessions = mysqlTable("meditationSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  meditationType: varchar("meditationType", { length: 255 }).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  script: text("script"),
  audioUrl: varchar("audioUrl", { length: 512 }),
  voiceId: varchar("voiceId", { length: 50 }).default("rachel"),
  ambientSound: varchar("ambientSound", { length: 50 }),
  reflection: text("reflection"),
  rating: int("rating"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MeditationSession = typeof meditationSessions.$inferSelect;
export type InsertMeditationSession = typeof meditationSessions.$inferInsert;

/**
 * Global settings (admin-only)
 * Stores app-wide configuration including LLM provider settings
 * Keys: llm_primary_provider, llm_primary_model, llm_fallback_provider, llm_fallback_model
 */
export const globalSettings = mysqlTable("globalSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GlobalSetting = typeof globalSettings.$inferSelect;
export type InsertGlobalSetting = typeof globalSettings.$inferInsert;

/**
 * User events for engagement tracking and analytics
 */
export const userEvents = mysqlTable("userEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("eventType", { length: 100 }).notNull(), // LOGIN, LOGOUT, PAGE_VIEW, JOURNAL_ENTRY_CREATED, etc.
  eventData: text("eventData"), // JSON metadata about the event
  sessionId: varchar("sessionId", { length: 255 }), // Browser session ID for tracking sessions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserEvent = typeof userEvents.$inferSelect;
export type InsertUserEvent = typeof userEvents.$inferInsert;

/**
 * Experience analysis data - AI-extracted psychological dimensions
 * Based on Event Characteristics Questionnaire (ECQ) and Life Themes framework
 */
export const experienceAnalyses = mysqlTable("experienceAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entryId").notNull().unique().references(() => journalEntries.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // ECQ Dimensions (9 psychological characteristics)
  valence: mysqlEnum("valence", ["positive", "negative", "neutral"]),
  impact: int("impact"), // 1-10 scale
  predictability: int("predictability"), // 1-10 scale
  challenge: int("challenge"), // 1-10 scale
  emotionalSignificance: int("emotionalSignificance"), // 1-10 scale
  worldviewChange: int("worldviewChange"), // 1-10 scale
  
  // Life Themes (6 core human concerns)
  primaryTheme: mysqlEnum("primaryTheme", ["Love", "Value", "Power", "Freedom", "Truth", "Justice"]),
  secondaryThemes: text("secondaryThemes"), // JSON array
  
  // Pattern Recognition
  experienceArchetype: varchar("experienceArchetype", { length: 255 }), // e.g., "Loss and Recovery"
  keywords: text("keywords"), // JSON array of key concepts
  emotionalTone: varchar("emotionalTone", { length: 100 }),
  
  // Clustering
  clusterId: int("clusterId"), // For grouping similar experiences
  semanticEmbedding: text("semanticEmbedding"), // JSON array of embedding vector
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExperienceAnalysis = typeof experienceAnalyses.$inferSelect;
export type InsertExperienceAnalysis = typeof experienceAnalyses.$inferInsert;

/**
 * Combined Experiences - Stores wisdom generated from combining multiple similar experiences
 */
export const combinedExperiences = mysqlTable("combined_experiences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // User-given name for the combination
  consolidatedWisdom: text("consolidatedWisdom").notNull(), // AI-generated wisdom insight
  primaryTheme: varchar("primaryTheme", { length: 50 }), // Dominant life theme
  archetypes: text("archetypes"), // JSON array of common archetypes
  combinedAt: timestamp("combinedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CombinedExperience = typeof combinedExperiences.$inferSelect;
export type InsertCombinedExperience = typeof combinedExperiences.$inferInsert;

/**
 * Experience Combinations - Junction table linking journal entries to combined experiences
 */
export const experienceCombinations = mysqlTable("experience_combinations", {
  id: int("id").autoincrement().primaryKey(),
  combinedExperienceId: int("combinedExperienceId").notNull(),
  journalEntryId: int("journalEntryId").notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type ExperienceCombination = typeof experienceCombinations.$inferSelect;
export type InsertExperienceCombination = typeof experienceCombinations.$inferInsert;

