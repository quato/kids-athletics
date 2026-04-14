import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./lib/db.js";
import { json, methodNotAllowed, serverError } from "./lib/http.js";

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

  try {
    const result = await pool.query<EventRow>(
      `SELECT id, name, date, fee_amount, registration_deadline
       FROM events
       WHERE registration_deadline > now()
       ORDER BY date ASC`,
    );

    const events = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      feeAmount: parseFloat(row.fee_amount),
      registrationDeadline: row.registration_deadline,
    }));

    json(res, 200, { events });
  } catch (err) {
    serverError(res, err);
  }
}
