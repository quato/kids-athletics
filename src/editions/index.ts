import { may2026 } from "./may-2026";
import { october2026 } from "./october-2026";
import type { Edition } from "./types";

export type { Edition, EditionMode, EditionResults, AgeCategoryRun, IndividualRow, TeamStanding } from "./types";
export { EditionProvider, useEdition } from "./EditionContext";
export { may2026 } from "./may-2026";
export { october2026 } from "./october-2026";

export const editions: Edition[] = [may2026, october2026];

export function getEdition(slug: string): Edition | undefined {
  return editions.find((edition) => edition.slug === slug);
}

export function getUpcomingEdition(now = new Date()): Edition {
  return editions.find((edition) => now < edition.festOverAt) ?? editions[editions.length - 1];
}

export function pastEditions(now = new Date()): Edition[] {
  return editions.filter((edition) => now >= edition.festOverAt);
}

export function latestEditionWithResults(): Edition | undefined {
  return [...editions].reverse().find((edition) => edition.results != null);
}

export function resultsPathFor(
  edition: Edition,
  tab?: "teams" | "individual",
): string {
  const target = edition.results ? edition : latestEditionWithResults();
  if (!target) return "/archive";
  return tab ? `/results/${target.slug}?tab=${tab}` : `/results/${target.slug}`;
}

export function editionDisplayName(edition: Edition): string {
  return `${edition.shortName} ${edition.accentWord}`;
}
