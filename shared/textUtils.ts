/**
 * Normalize text by removing accents and diacritical marks
 * This prevents duplicates like "São Paulo" and "Sao Paulo"
 */
export function normalizeText(text: string): string {
  if (!text) return text;
  
  return text
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .trim();
}

/**
 * Normalize location name specifically
 * Removes accents and ensures consistent casing
 */
export function normalizeLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  
  const trimmed = location.trim();
  if (!trimmed) return null;
  
  return normalizeText(trimmed);
}

