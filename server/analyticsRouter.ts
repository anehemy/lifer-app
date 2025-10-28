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

  // Admin-only: Get overall metrics
  getMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const allEvents = await db.getAllRecentEvents(10000);
      const allUsers = await db.getAllUsers();

      const activeToday = new Set(allEvents.filter(e => new Date(e.createdAt) >= today).map(e => e.userId)).size;
      const activeThisWeek = new Set(allEvents.filter(e => new Date(e.createdAt) >= weekAgo).map(e => e.userId)).size;
      const activeThisMonth = new Set(allEvents.filter(e => new Date(e.createdAt) >= monthAgo).map(e => e.userId)).size;

      const journalEntries = allEvents.filter(e => e.eventType === "JOURNAL_ENTRY_CREATED").length;
      const meditations = allEvents.filter(e => e.eventType === "MEDITATION_COMPLETED").length;
      const visionItems = allEvents.filter(e => e.eventType === "VISION_ITEM_CREATED").length;
      const chatMessages = allEvents.filter(e => e.eventType === "CHAT_MESSAGE_SENT").length;

      return {
        totalUsers: allUsers.length,
        activeToday,
        activeThisWeek,
        activeThisMonth,
        journalEntries,
        meditations,
        visionItems,
        chatMessages,
      };
    }),

  // Admin-only: Get user stats
  getUserStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const allUsers = await db.getAllUsers();
      const allEvents = await db.getAllRecentEvents(10000);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      return allUsers.map((user: any) => {
        const userEvents = allEvents.filter(e => e.userId === user.id);
        const loginEvents = userEvents.filter(e => e.eventType === "LOGIN");
        const lastLogin = loginEvents.length > 0 ? loginEvents[0].createdAt : null;

        const todayEvents = userEvents.filter(e => new Date(e.createdAt) >= today);
        const weekEvents = userEvents.filter(e => new Date(e.createdAt) >= weekAgo);

        return {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          lastLogin,
          totalLogins: loginEvents.length,
          timeToday: `${Math.floor(todayEvents.length / 2)}m`,
          timeThisWeek: `${Math.floor(weekEvents.length / 2)}m`,
        };
      });
    }),
});
