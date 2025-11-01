import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { dataNotifications, journalEntries, InsertDataNotification } from "../drizzle/schema";

/**
 * Get field-specific prompt question
 */
function getPromptForField(fieldName: string, entryQuestion: string): string {
  const prompts: Record<string, string> = {
    timeContext: `When did this happen? (for: "${entryQuestion}")`,
    placeContext: `Where did this take place? (for: "${entryQuestion}")`,
    experienceType: `What type of experience was this? (for: "${entryQuestion}")`,
    challengeType: `What challenge did you face? (for: "${entryQuestion}")`,
    growthTheme: `What did you learn or how did you grow? (for: "${entryQuestion}")`,
  };
  return prompts[fieldName] || `Please provide ${fieldName}`;
}

/**
 * Scan journal entries and create notifications for missing metadata
 */
export async function scanAndCreateNotifications(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Notifications] Database not available");
    return 0;
  }

  try {
    // Get all entries for this user
    const entries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    let notificationsCreated = 0;

    for (const entry of entries) {
      const missingFields: string[] = [];
      
      // Check each metadata field
      if (!entry.timeContext) missingFields.push("timeContext");
      if (!entry.placeContext) missingFields.push("placeContext");
      if (!entry.experienceType) missingFields.push("experienceType");
      if (!entry.challengeType) missingFields.push("challengeType");
      if (!entry.growthTheme) missingFields.push("growthTheme");

      // Create notifications for missing fields
      for (const fieldName of missingFields) {
        // Check if notification already exists
        const existing = await db
          .select()
          .from(dataNotifications)
          .where(
            and(
              eq(dataNotifications.userId, userId),
              eq(dataNotifications.entryId, entry.id),
              eq(dataNotifications.fieldName, fieldName),
              eq(dataNotifications.isDismissed, false)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          // Create new notification
          const notification: InsertDataNotification = {
            userId,
            entryId: entry.id,
            fieldName,
            promptQuestion: getPromptForField(fieldName, entry.question),
          };

          await db.insert(dataNotifications).values(notification);
          notificationsCreated++;
        }
      }
    }

    return notificationsCreated;
  } catch (error) {
    console.error("[Notifications] Failed to scan entries:", error);
    return 0;
  }
}

/**
 * Get all active notifications for a user
 */
export async function getActiveNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const notifications = await db
      .select({
        id: dataNotifications.id,
        entryId: dataNotifications.entryId,
        fieldName: dataNotifications.fieldName,
        promptQuestion: dataNotifications.promptQuestion,
        createdAt: dataNotifications.createdAt,
        entryQuestion: journalEntries.question,
        entryResponse: journalEntries.response,
      })
      .from(dataNotifications)
      .innerJoin(journalEntries, eq(dataNotifications.entryId, journalEntries.id))
      .where(
        and(
          eq(dataNotifications.userId, userId),
          eq(dataNotifications.isDismissed, false)
        )
      )
      .orderBy(dataNotifications.createdAt);

    return notifications;
  } catch (error) {
    console.error("[Notifications] Failed to get notifications:", error);
    return [];
  }
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(notificationId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(dataNotifications)
      .set({ isDismissed: true })
      .where(
        and(
          eq(dataNotifications.id, notificationId),
          eq(dataNotifications.userId, userId)
        )
      );
    return true;
  } catch (error) {
    console.error("[Notifications] Failed to dismiss notification:", error);
    return false;
  }
}

/**
 * Auto-dismiss notifications for a field that has been filled
 */
export async function autoDismissForField(
  userId: number,
  entryId: number,
  fieldName: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(dataNotifications)
      .set({ isDismissed: true })
      .where(
        and(
          eq(dataNotifications.userId, userId),
          eq(dataNotifications.entryId, entryId),
          eq(dataNotifications.fieldName, fieldName)
        )
      );
  } catch (error) {
    console.error("[Notifications] Failed to auto-dismiss:", error);
  }
}

/**
 * Get notification count for a user
 */
export async function getNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select()
      .from(dataNotifications)
      .where(
        and(
          eq(dataNotifications.userId, userId),
          eq(dataNotifications.isDismissed, false)
        )
      );
    return result.length;
  } catch (error) {
    console.error("[Notifications] Failed to get count:", error);
    return 0;
  }
}

