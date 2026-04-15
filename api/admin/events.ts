import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../lib/db.js";
import { json, methodNotAllowed, serverError } from "../lib/http.js";

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
    const result = await pool.query<{
      id: number;
      name: string;
      fee_amount: string;
    }>(
      `SELECT id, name, fee_amount FROM events ORDER BY id ASC`,
    );

    const events = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      feeAmount: parseFloat(row.fee_amount),
    }));

    return json(res, 200, { events });
  } catch (err) {
    return serverError(res, err);
  }
}
