// Registration opens at 19 Apr 2026, 16:00 Kyiv time (UTC+3).
const REGISTRATION_OPEN_DATE = new Date(Date.UTC(2026, 3, 19, 13, 0, 0));
export const REGISTRATION_OPEN_LABEL = "19 квітня о 16:00 (за Києвом)";

// Fest day ends at midnight Kyiv time after 24 May 2026.
const FEST_OVER_DATE = new Date(Date.UTC(2026, 4, 24, 21, 0, 0));
export const FEST_OVER_MESSAGE = "Фест завершено. Дякуємо всім учасникам!";

/**
 * Returns true after the fest has ended.
 */
export function isFestOver(): boolean {
  return new Date() >= FEST_OVER_DATE;
}

/**
 * Returns true when registration is open.
 * Can be forced open before the scheduled date by setting
 * VITE_REGISTRATION_OPEN=true in .env (or Vercel environment variables).
 * Registration is always closed after the fest ends.
 */
export function isRegistrationOpen(): boolean {
  if (isFestOver()) return false;
  if (import.meta.env.VITE_REGISTRATION_OPEN === "true") return true;
  return new Date() >= REGISTRATION_OPEN_DATE;
}
