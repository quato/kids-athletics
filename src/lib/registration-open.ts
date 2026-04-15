const REGISTRATION_OPEN_DATE = new Date("2026-04-19T00:00:00");

/**
 * Returns true when registration is open.
 * Can be forced open before the scheduled date by setting
 * VITE_REGISTRATION_OPEN=true in .env (or Vercel environment variables).
 */
export function isRegistrationOpen(): boolean {
  if (import.meta.env.VITE_REGISTRATION_OPEN === "true") return true;
  return new Date() >= REGISTRATION_OPEN_DATE;
}
