import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { json, methodNotAllowed, badRequest, serverError } from "../_lib/http.js";
import { sendTelegramMessage } from "../_lib/telegram.js";

function authenticate(req: VercelRequest): boolean {
  const expectedPassword = process.env.ORGANIZER_PASSWORD;
  if (!expectedPassword) return false;
  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return token === expectedPassword;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH" && req.method !== "DELETE") {
    return methodNotAllowed(res, ["PATCH", "DELETE"]);
  }

  if (!authenticate(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  // ── DELETE: remove an order and its registrations ──────────────────────────
  if (req.method === "DELETE") {
    const body = req.body as { orderId?: number };
    if (!body.orderId || typeof body.orderId !== "number") {
      return badRequest(res, "Required field: orderId (number)");
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Refuse to delete paid orders for safety
      const check = await client.query<{ status: string }>(
        `SELECT status FROM orders WHERE id = $1 LIMIT 1`,
        [body.orderId],
      );
      if (check.rows.length === 0) {
        await client.query("ROLLBACK");
        return json(res, 404, { error: "Order not found" });
      }
      if (check.rows[0].status === "paid") {
        await client.query("ROLLBACK");
        return json(res, 409, { error: "Cannot delete a paid order" });
      }
      await client.query(`DELETE FROM registrations WHERE order_id = $1`, [body.orderId]);
      await client.query(`DELETE FROM orders WHERE id = $1`, [body.orderId]);
      await client.query("COMMIT");
      return json(res, 200, { ok: true });
    } catch (err) {
      await client.query("ROLLBACK");
      return serverError(res, err);
    } finally {
      client.release();
    }
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

    const result = await client.query<{
      id: number;
      expected_amount: string;
      parent_name: string;
      phone: string;
      email: string;
    }>(
      `UPDATE orders SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING id, expected_amount, parent_name, phone, email`,
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

    if (body.status === "paid") {
      try {
        const row = result.rows[0];
        let msg = `✅ <b>Оплату підтверджено (вручну)!</b>\n`;
        msg += `Замовлення: #${row.id}\n`;
        msg += `Сума: ${parseFloat(row.expected_amount)} грн\n`;
        msg += `Батьки: ${row.parent_name}\n`;
        msg += `Телефон: ${row.phone}\n`;
        msg += `Email: ${row.email}\n`;
        await sendTelegramMessage(msg);
      } catch (err) {
        console.error("[update-order] telegram notification failed:", err);
      }
    }

    return json(res, 200, { ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    return serverError(res, err);
  } finally {
    client.release();
  }
}
