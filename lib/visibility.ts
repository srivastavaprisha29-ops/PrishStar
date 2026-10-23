export function published(extra: string): boolean {
  try { return JSON.parse(extra).published === true; } catch { return false; }
}
export function ownerMatches(actual: string | null, expected: string | undefined): boolean {
  return !!actual && !!expected && actual.trim().toLowerCase() === expected.trim().toLowerCase();
}
