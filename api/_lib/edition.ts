export const ACTIVE_EDITION = "october-2026";
export const KNOWN_EDITIONS = ["may-2026", "october-2026"] as const;

export type EditionSlug = (typeof KNOWN_EDITIONS)[number];

const CHILDREN_LIMITS: Record<EditionSlug, number> = {
  "may-2026": 200,
  "october-2026": 200,
};

/** Capacity of the fest that is currently open for registration. */
export const CHILDREN_LIMIT = CHILDREN_LIMITS[ACTIVE_EDITION];

export function childrenLimitFor(edition: string): number {
  return CHILDREN_LIMITS[edition as EditionSlug] ?? CHILDREN_LIMIT;
}

export function resolveEdition(query: string | string[] | undefined): string {
  const raw = Array.isArray(query) ? query[0] : query;
  if (raw && (KNOWN_EDITIONS as readonly string[]).includes(raw)) {
    return raw;
  }
  return ACTIVE_EDITION;
}

export const EDITION_REGISTRATION_COUNT_SQL = `
  SELECT COUNT(*) AS count
  FROM registrations r
  JOIN events e ON e.id = r.event_id
  WHERE e.edition = $1
`;

const ORDER_EDITIONS_SQL = `
  SELECT DISTINCT e.edition
  FROM registrations r
  JOIN events e ON e.id = r.event_id
  WHERE r.order_id = $1
`;

type Queryable = {
  query: <R extends Record<string, unknown>>(
    sql: string,
    params: unknown[],
  ) => Promise<{ rows: R[] }>;
};

/**
 * Returns the slug of the archived edition an order belongs to, or null when the
 * order belongs to the active edition. Archived orders are read-only so that
 * past-fest bookkeeping cannot be rewritten by accident.
 */
export async function findArchivedEditionOfOrder(
  db: Queryable,
  orderId: number,
): Promise<string | null> {
  const result = await db.query<{ edition: string }>(ORDER_EDITIONS_SQL, [orderId]);
  const archived = result.rows.map((row) => row.edition).find((edition) => edition !== ACTIVE_EDITION);
  return archived ?? null;
}

export function archivedEditionError(edition: string) {
  return {
    error: `Замовлення належить до архівного фесту (${edition}). Архівні дані доступні лише для перегляду.`,
    edition,
  };
}
