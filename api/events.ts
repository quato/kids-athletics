import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./_lib/db.js";
import {
  ACTIVE_EDITION,
  ADULT_LIMIT,
  CHILDREN_LIMIT,
  EDITION_ADULT_COUNT_SQL,
  EDITION_REGISTRATION_COUNT_SQL,
} from "./_lib/edition.js";
import { json, methodNotAllowed, serverError } from "./_lib/http.js";

interface EventRow {
  id: number;
  name: string;
  date: string;
  fee_amount: string;
  registration_deadline: string;
  audience: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const [eventsResult, countResult, adultCountResult] = await Promise.all([
      pool.query<EventRow>(
        `SELECT id, name, date, fee_amount, registration_deadline, audience
         FROM events
         WHERE edition = $1 AND registration_deadline > now()
         ORDER BY date ASC`,
        [ACTIVE_EDITION],
      ),
      pool.query<{ count: string }>(EDITION_REGISTRATION_COUNT_SQL, [ACTIVE_EDITION]),
      pool.query<{ count: string }>(EDITION_ADULT_COUNT_SQL, [ACTIVE_EDITION]),
    ]);

    const adultPlacesLeft = Math.max(
      ADULT_LIMIT - parseInt(adultCountResult.rows[0].count, 10),
      0,
    );

    // A full adult race disappears from the form; the children's programme is
    // gated by registrationOpen instead, so its products stay listed either way.
    const events = eventsResult.rows
      .filter((row) => row.audience !== "adults" || adultPlacesLeft > 0)
      .map((row) => ({
        id: row.id,
        name: row.name,
        date: row.date,
        feeAmount: parseFloat(row.fee_amount),
        registrationDeadline: row.registration_deadline,
        audience: row.audience === "adults" ? "adults" : "children",
      }));

    const registrationOpen = parseInt(countResult.rows[0].count, 10) < CHILDREN_LIMIT;

    json(res, 200, { events, registrationOpen, adultPlacesLeft });
  } catch (err) {
    serverError(res, err);
  }
}
