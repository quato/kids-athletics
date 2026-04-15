import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./_lib/db.js";
import { json, methodNotAllowed, serverError } from "./_lib/http.js";

interface EventRow {
  id: number;
  name: string;
  date: string;
  fee_amount: string;
  registration_deadline: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const ORDER_LIMIT = 140;

  try {
    const [eventsResult, countResult] = await Promise.all([
      pool.query<EventRow>(
        `SELECT id, name, date, fee_amount, registration_deadline
         FROM events
         WHERE registration_deadline > now()
         ORDER BY date ASC`,
      ),
      pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM orders"),
    ]);

    const events = eventsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      feeAmount: parseFloat(row.fee_amount),
      registrationDeadline: row.registration_deadline,
    }));

    const registrationOpen = parseInt(countResult.rows[0].count, 10) < ORDER_LIMIT;

    json(res, 200, { events, registrationOpen });
  } catch (err) {
    serverError(res, err);
  }
}
