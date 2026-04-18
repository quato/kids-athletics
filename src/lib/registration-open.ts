// Registration opens at 19 Apr 2026, 16:00 Kyiv time (UTC+3).
const REGISTRATION_OPEN_DATE = new Date(Date.UTC(2026, 3, 19, 13, 0, 0));
export const REGISTRATION_OPEN_LABEL = "19 квітня о 16:00 (за Києвом)";

/**
 * Returns true when registration is open.
 * Can be forced open before the scheduled date by setting
 * VITE_REGISTRATION_OPEN=true in .env (or Vercel environment variables).
 */
export function isRegistrationOpen(): boolean {
  if (import.meta.env.VITE_REGISTRATION_OPEN === "true") return true;
  return new Date() >= REGISTRATION_OPEN_DATE;
}
