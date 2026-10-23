export const DAY = 24 * 60 * 60 * 1000;
export function lifetime(kind: string): number | null {
  return kind === 'story' ? DAY : kind === 'photo' ? 7 * DAY : null;
}
export function expiresAt(kind: string, created: string): number | null {
  const duration = lifetime(kind);
  return duration === null ? null : Date.parse(created) + duration;
}
export function isLive(kind: string, created: string, now = Date.now()): boolean {
  const expiry = expiresAt(kind, created);
  return expiry === null || expiry > now;
}
