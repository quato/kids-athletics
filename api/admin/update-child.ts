import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { json, methodNotAllowed, badRequest, serverError } from "../_lib/http.js";

function authenticate(req: VercelRequest): boolean {
  const expectedPassword = process.env.ORGANIZER_PASSWORD;
  if (!expectedPassword) return false;
  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return token === expectedPassword;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") {
    return methodNotAllowed(res, ["PATCH"]);
  }

  if (!authenticate(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  const body = req.body as {
    childId?: number;
    startNumber?: number | null;
    isPresent?: boolean | null;
  };

  if (!body.childId || typeof body.childId !== "number") {
    return badRequest(res, "Required field: childId (number)");
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if ("startNumber" in body) {
    values.push(body.startNumber ?? null);
    setClauses.push(`start_number = $${values.length}`);
  }

  if ("isPresent" in body) {
    values.push(body.isPresent ?? null);
    setClauses.push(`is_present = $${values.length}`);
  }

  if (setClauses.length === 0) {
    return badRequest(res, "Provide at least one field to update: startNumber or isPresent");
  }

  values.push(body.childId);

  try {
    const result = await pool.query(
      `UPDATE registrations SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING id`,
      values,
    );

    if (result.rowCount === 0) {
      return json(res, 404, { error: "Child registration not found" });
    }

    return json(res, 200, { ok: true });
  } catch (err) {
    return serverError(res, err);
  }
}
