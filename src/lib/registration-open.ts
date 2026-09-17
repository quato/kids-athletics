import type { Edition } from "@/editions/types";

export const FEST_OVER_MESSAGE = "Фест завершено. Дякуємо всім учасникам!";

export function isFestOver(edition: Edition, now = new Date()): boolean {
  return now >= edition.festOverAt;
}

export function isRegistrationOpen(edition: Edition, now = new Date()): boolean {
  if (isFestOver(edition, now)) return false;
  if (import.meta.env.VITE_REGISTRATION_OPEN === "true") return true;
  return now >= edition.registrationOpensAt;
}

export function isStatsOpen(edition: Edition, now = new Date()): boolean {
  return now >= edition.statsOpensAt;
}
