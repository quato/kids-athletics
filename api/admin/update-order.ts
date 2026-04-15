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
    orderId?: number;
    status?: string;
    parentName?: string;
    phone?: string;
    email?: string;
  };

  if (!body.orderId || typeof body.orderId !== "number") {
    return badRequest(res, "Required field: orderId (number)");
  }

  const { orderId } = body;

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (body.status !== undefined) {
    if (!["paid", "pending"].includes(body.status)) {
      return badRequest(res, "status must be 'paid' or 'pending'");
    }
    const paidAt = body.status === "paid" ? new Date() : null;
    values.push(body.status);
    setClauses.push(`status = $${values.length}`);
    values.push(paidAt);
    setClauses.push(`paid_at = $${values.length}`);
  }

  if (body.parentName !== undefined) {
    if (!body.parentName.trim()) return badRequest(res, "parentName cannot be empty");
    values.push(body.parentName.trim());
    setClauses.push(`parent_name = $${values.length}`);
  }

  if (body.phone !== undefined) {
    if (!body.phone.trim()) return badRequest(res, "phone cannot be empty");
    values.push(body.phone.trim());
    setClauses.push(`phone = $${values.length}`);
  }

  if (body.email !== undefined) {
    if (!body.email.trim()) return badRequest(res, "email cannot be empty");
    values.push(body.email.trim().toLowerCase());
    setClauses.push(`email = $${values.length}`);
  }

  if (setClauses.length === 0) {
    return badRequest(res, "Provide at least one field to update");
  }

  values.push(orderId);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE orders SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING id`,
      values,
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return json(res, 404, { error: "Order not found" });
    }

    if (body.status === "paid") {
      await client.query(
        `UPDATE registrations SET is_present = true WHERE order_id = $1 AND is_present IS NULL`,
        [orderId],
      );
    }

    await client.query("COMMIT");
    return json(res, 200, { ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    return serverError(res, err);
  } finally {
    client.release();
  }
}
