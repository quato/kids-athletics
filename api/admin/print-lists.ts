import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { AGE_GROUP_SQL, isKnownAgeGroup } from "../_lib/age-groups.js";
import { json, methodNotAllowed, serverError } from "../_lib/http.js";

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
      age_group: string;
      child_name: string;
      birth_year: number;
      start_number: number;
    }>(`
      SELECT
        ${AGE_GROUP_SQL} AS age_group,
        r.child_name,
        r.birth_year,
        r.start_number
      FROM registrations r
      JOIN orders o ON o.id = r.order_id
      WHERE r.is_present = true
        AND r.start_number IS NOT NULL
        AND r.birth_year > 0
        AND o.status = 'paid'
      ORDER BY age_group, r.start_number ASC
    `);

    const groups: Record<string, Array<{ childName: string; birthYear: number; startNumber: number }>> = {};

    for (const row of result.rows) {
      if (!isKnownAgeGroup(row.age_group)) continue;
      if (!groups[row.age_group]) groups[row.age_group] = [];
      groups[row.age_group].push({
        childName: row.child_name,
        birthYear: row.birth_year,
        startNumber: row.start_number,
      });
    }

    return json(res, 200, {
      groups,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return serverError(res, err);
  }
}
