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

  const { orderId, status } = req.body as { orderId?: number; status?: string };

  if (!orderId || !status || !["paid", "pending"].includes(status)) {
    return badRequest(res, "Required fields: orderId (number), status ('paid' | 'pending')");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const paidAt = status === "paid" ? new Date() : null;
    const result = await client.query(
      `UPDATE orders SET status = $1, paid_at = $2 WHERE id = $3 RETURNING id`,
      [status, paidAt, orderId],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return json(res, 404, { error: "Order not found" });
    }

    if (status === "paid") {
      // Mark children as present by default when manually setting to paid
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
