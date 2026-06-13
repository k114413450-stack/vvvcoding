/**
 * src/lib/dynamic-stats.ts — Generates highly realistic, dynamically growing view counts
 * based on post age, preventing new posts from showing high view counts immediately.
 */

export function getDynamicViews(createdAt: Date, targetViews: number): number {
  const ageMs = Date.now() - createdAt.getTime();
  if (ageMs < 0) return 0; // future scheduled topic

  const ageMins = ageMs / (1000 * 60);
  
  // First 5 minutes: start with 1 to 3 initial views
  if (ageMins < 5) {
    const seed = createdAt.getTime() % 3;
    return seed + 1; 
  }

  // Define 7 days in minutes as the maximum growth timeline
  const maxAgeMins = 7 * 24 * 60; 
  const fraction = Math.min(ageMins / maxAgeMins, 1.0);

  // Square-root growth curve: views rise rapidly in the first hours and level off
  const baseViews = 3;
  if (targetViews <= baseViews) {
    return targetViews;
  }

  const dynamicViews = Math.floor(baseViews + (targetViews - baseViews) * Math.sqrt(fraction));
  return dynamicViews;
}
