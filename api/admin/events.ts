import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { json, methodNotAllowed, serverError } from "../_lib/http.js";
import { resolveEdition } from "../_lib/edition.js";

function authenticate(req: VercelRequest): boolean {
  const expectedPassword = process.env.ORGANIZER_PASSWORD;
  if (!expectedPassword) return false;
  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return token === expectedPassword;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  if (!authenticate(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    const edition = resolveEdition(req.query.edition);

    const result = await pool.query<{
      id: number;
      name: string;
      fee_amount: string;
      edition: string;
    }>(
      `SELECT id, name, fee_amount, edition FROM events WHERE edition = $1 ORDER BY id ASC`,
      [edition],
    );

    const events = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      feeAmount: parseFloat(row.fee_amount),
      edition: row.edition,
    }));

    return json(res, 200, { events });
  } catch (err) {
    return serverError(res, err);
  }
}
