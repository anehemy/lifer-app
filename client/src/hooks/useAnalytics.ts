import { trpc } from "../lib/trpc";
import { useEffect, useRef } from "react";

// Generate a session ID that persists for the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

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
  
  // Session events
  SESSION_START: "SESSION_START",
  SESSION_END: "SESSION_END",
} as const;

export type EventTypeValue = typeof EventType[keyof typeof EventType];

export function useAnalytics() {
  const logEventMutation = trpc.analytics.logEvent.useMutation();
  const sessionId = getSessionId();

  const logEvent = (eventType: EventTypeValue, eventData?: Record<string, any>) => {
    logEventMutation.mutate({
      eventType,
      eventData,
      sessionId,
    });
  };

  return { logEvent, sessionId };
}

// Hook to track page views automatically
export function usePageView(pageName: string) {
  const { logEvent } = useAnalytics();
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (!hasLoggedRef.current) {
      logEvent(EventType.PAGE_VIEW, { page: pageName });
      hasLoggedRef.current = true;
    }
  }, [pageName, logEvent]);
}

// Hook to track session start/end
export function useSessionTracking() {
  const { logEvent } = useAnalytics();
  const sessionStartedRef = useRef(false);

  useEffect(() => {
    // Log session start
    if (!sessionStartedRef.current) {
      logEvent(EventType.SESSION_START);
      sessionStartedRef.current = true;
    }

    // Log session end on page unload
    const handleUnload = () => {
      // Use sendBeacon for reliable event logging on page unload
      const sessionId = getSessionId();
      navigator.sendBeacon(
        "/api/trpc/analytics.logEvent",
        JSON.stringify({
          eventType: EventType.SESSION_END,
          sessionId,
        })
      );
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [logEvent]);
}

