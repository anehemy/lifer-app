import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Event types enum
export const EventType = {
  // Auth events
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  
  // Navigation events
  PAGE_VIEW: "PAGE_VIEW",
  
  // Journal events
  JOURNAL_ENTRY_CREATED: "JOURNAL_ENTRY_CREATED",
  JOURNAL_ENTRY_UPDATED: "JOURNAL_ENTRY_UPDATED",
  JOURNAL_ENTRY_DELETED: "JOURNAL_ENTRY_DELETED",
  
  // Meditation events
  MEDITATION_STARTED: "MEDITATION_STARTED",
  MEDITATION_COMPLETED: "MEDITATION_COMPLETED",
  MEDITATION_ABANDONED: "MEDITATION_ABANDONED",
  
  // Vision Board events
  VISION_ITEM_CREATED: "VISION_ITEM_CREATED",
  VISION_ITEM_UPDATED: "VISION_ITEM_UPDATED",
  VISION_ITEM_DELETED: "VISION_ITEM_DELETED",
  
  // Pattern events
  PATTERNS_VIEWED: "PATTERNS_VIEWED",
  PATTERN_DETAIL_VIEWED: "PATTERN_DETAIL_VIEWED",
  
  // Primary Aim events
  PRIMARY_AIM_UPDATED: "PRIMARY_AIM_UPDATED",
  PRIMARY_AIM_VIEWED: "PRIMARY_AIM_VIEWED",
  
  // Chat events
  CHAT_MESSAGE_SENT: "CHAT_MESSAGE_SENT",
  CHAT_SESSION_STARTED: "CHAT_SESSION_STARTED",
  
  // Settings events
  SETTINGS_UPDATED: "SETTINGS_UPDATED",
} as const;

export type EventTypeValue = typeof EventType[keyof typeof EventType];

export const analyticsRouter = router({
  // Log a user event
  logEvent: protectedProcedure
    .input(z.object({
      eventType: z.string(),
      eventData: z.record(z.string(), z.any()).optional(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.logUserEvent({
        userId: ctx.user.id,
        eventType: input.eventType,
        eventData: input.eventData ? JSON.stringify(input.eventData) : null,
        sessionId: input.sessionId || null,
      });
      
      return { success: true };
    }),
  
  // Get recent events for a user (for debugging/testing)
  getRecentEvents: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return await db.getUserRecentEvents(ctx.user.id, input.limit);
    }),
  
  // Admin-only: Get all recent events
  getAllRecentEvents: protectedProcedure
    .input(z.object({
      limit: z.number().default(100),
    }))
    .query(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      
      return await db.getAllRecentEvents(input.limit);
    }),
});
