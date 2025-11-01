/**
 * Utility for calculating journal entry data completeness
 */

export interface JournalEntryMetadata {
  timeContext?: string | null;
  placeContext?: string | null;
  experienceType?: string | null;
  challengeType?: string | null;
  growthTheme?: string | null;
}

export interface CompletenessResult {
  percentage: number;
  missingFields: string[];
  hasYear: boolean;
  hasLocation: boolean;
  hasExperience: boolean;
  hasChallenge: boolean;
  hasGrowth: boolean;
}

/**
 * Calculate completeness of a journal entry's metadata
 */
export function calculateCompleteness(metadata: JournalEntryMetadata): CompletenessResult {
  const hasYear = !!metadata.timeContext;
  const hasLocation = !!metadata.placeContext;
  const hasExperience = !!metadata.experienceType;
  const hasChallenge = !!metadata.challengeType;
  const hasGrowth = !!metadata.growthTheme;
  
  const fields = [hasYear, hasLocation, hasExperience, hasChallenge, hasGrowth];
  const completedCount = fields.filter(Boolean).length;
  const percentage = Math.round((completedCount / fields.length) * 100);
  
  const missingFields: string[] = [];
  if (!hasYear) missingFields.push("year");
  if (!hasLocation) missingFields.push("location");
  if (!hasExperience) missingFields.push("experience");
  if (!hasChallenge) missingFields.push("challenge");
  if (!hasGrowth) missingFields.push("growth");
  
  return {
    percentage,
    missingFields,
    hasYear,
    hasLocation,
    hasExperience,
    hasChallenge,
    hasGrowth,
  };
}

/**
 * Get user-friendly label for missing field
 */
export function getMissingFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    year: "When did this happen?",
    location: "Where did this take place?",
    experience: "What type of experience was this?",
    challenge: "What challenge did you face?",
    growth: "What did you learn or how did you grow?",
  };
  return labels[field] || field;
}

/**
 * Get color class based on completeness percentage
 */
export function getCompletenessColor(percentage: number): string {
  if (percentage === 100) return "text-green-600 dark:text-green-400";
  if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

/**
 * Get background color class based on completeness percentage
 */
export function getCompletenessBgColor(percentage: number): string {
  if (percentage === 100) return "bg-green-100 dark:bg-green-900/30";
  if (percentage >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

