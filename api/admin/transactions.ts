import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { json, methodNotAllowed, badRequest, serverError } from "../_lib/http.js";
import { kopecksToUah, unixToDate } from "../_lib/monobank.js";
import { sendPaymentConfirmationEmail } from "../_lib/email.js";
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
  if (req.method !== "GET" && req.method !== "POST") {
    return methodNotAllowed(res, ["GET", "POST"]);
  }

  if (!authenticate(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  // ── GET: return unlinked transactions ──────────────────────────────────────
  if (req.method === "GET") {
    try {
      const result = await pool.query<{
        statement_item_id: string;
        payload: Record<string, unknown>;
        received_at: string;
      }>(
        `SELECT statement_item_id, payload, received_at
         FROM mono_events
         WHERE event_type = 'StatementItem'
           AND account = 'ZeA6u7VeMG3F2Qb3vlxfdg'
           AND statement_item_id IS NOT NULL
           AND statement_item_id NOT IN (
             SELECT mono_transaction_id FROM orders WHERE mono_transaction_id IS NOT NULL
           )
         ORDER BY received_at DESC`,
      );

      const transactions = result.rows
        .map((row) => {
          // The payload may be a direct StatementItem or wrapped in { data: { statementItem: ... } }
          const raw = row.payload;
          let item: Record<string, unknown> = raw;
          if (raw.type === "StatementItem" && raw.data && typeof raw.data === "object") {
            const data = raw.data as Record<string, unknown>;
            if (data.statementItem && typeof data.statementItem === "object") {
              item = data.statementItem as Record<string, unknown>;
            }
          }

          return {
            id: row.statement_item_id,
            receivedAt: row.received_at,
            time: item.time as number | undefined,
            description: (item.description as string | undefined) ?? "",
            comment: (item.comment as string | undefined) ?? null,
            counterName: (item.counterName as string | undefined) ?? null,
            amount: kopecksToUah((item.amount as number | undefined) ?? 0),
            rawPayload: item,
          };
        })
        .filter((tx) => tx.amount > 0);

      return json(res, 200, { transactions });
    } catch (err) {
      return serverError(res, err);
    }
  }

  // ── POST: manually link a transaction to an order ─────────────────────────
  const body = req.body as { orderId?: number; transactionId?: string };

  if (!body.orderId || typeof body.orderId !== "number") {
    return badRequest(res, "Required field: orderId (number)");
  }
  if (!body.transactionId || typeof body.transactionId !== "string") {
    return badRequest(res, "Required field: transactionId (string)");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch the raw transaction payload from mono_events
    const eventResult = await client.query<{
      id: number;
      payload: Record<string, unknown>;
    }>(
      `SELECT id, payload FROM mono_events
       WHERE statement_item_id = $1
       LIMIT 1`,
      [body.transactionId],
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return json(res, 404, { error: "Transaction not found in mono_events" });
    }

    // Guard: transaction already linked
    const dupCheck = await client.query<{ id: number }>(
      "SELECT id FROM orders WHERE mono_transaction_id = $1 LIMIT 1",
      [body.transactionId],
    );
    if (dupCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return json(res, 409, { error: "Transaction is already linked to an order" });
    }

    // Guard: order must exist and be pending
    const orderCheck = await client.query<{
      id: number;
      status: string;
      email: string;
      phone: string;
      parent_name: string;
      payment_code: string;
      expected_amount: string;
    }>(
      `SELECT id, status, email, phone, parent_name, payment_code, expected_amount
       FROM orders WHERE id = $1 LIMIT 1`,
      [body.orderId],
    );
    if (orderCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return json(res, 404, { error: "Order not found" });
    }
    if (orderCheck.rows[0].status === "paid") {
      await client.query("ROLLBACK");
      return json(res, 409, { error: "Order is already paid" });
    }

    // Extract the raw StatementItem payload
    const rawPayload = eventResult.rows[0].payload;
    let statementItem: Record<string, unknown> = rawPayload;
    if (
      rawPayload.type === "StatementItem" &&
      rawPayload.data &&
      typeof rawPayload.data === "object"
    ) {
      const data = rawPayload.data as Record<string, unknown>;
      if (data.statementItem && typeof data.statementItem === "object") {
        statementItem = data.statementItem as Record<string, unknown>;
      }
    }

    const paidAt =
      typeof statementItem.time === "number"
        ? unixToDate(statementItem.time)
        : new Date();

    // Mark order as paid and link the transaction
    await client.query(
      `UPDATE orders SET
         status = 'paid',
         paid_at = $1,
         mono_transaction_id = $2,
         raw_statement = $3
       WHERE id = $4`,
      [paidAt, body.transactionId, JSON.stringify(statementItem), body.orderId],
    );

    // Mark all children as present
    await client.query(
      `UPDATE registrations SET is_present = true WHERE order_id = $1 AND is_present IS NULL`,
      [body.orderId],
    );

    // Mark mono_event as processed
    await client.query(
      `UPDATE mono_events SET processed = true, processed_at = now()
       WHERE statement_item_id = $1 AND processed = false`,
      [body.transactionId],
    );

    // Fetch children for the email
    const childrenResult = await client.query<{ child_name: string; event_name: string }>(
      `SELECT r.child_name, e.name AS event_name
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.order_id = $1
       ORDER BY r.id`,
      [body.orderId],
    );

    await client.query("COMMIT");

    const order = orderCheck.rows[0];

    // Send payment confirmation email (same as automatic matching)
    if (order.email) {
      try {
        await sendPaymentConfirmationEmail({
          to: order.email,
          parentName: order.parent_name,
          children: childrenResult.rows.map((r) => ({
            childName: r.child_name,
            eventName: r.event_name,
          })),
          paymentCode: order.payment_code,
          totalAmount: parseFloat(order.expected_amount),
          orderId: order.id,
          paidAt,
        });
      } catch (err) {
        console.error("[transactions] payment email failed:", err);
      }
    } else {
      console.warn(`[transactions] order #${order.id} has no email – skipping confirmation email`);
    }

    // Send Telegram notification
    try {
      let msg = `✅ <b>Оплату зв'язано вручну!</b>\n`;
      msg += `Замовлення: #${order.id}\n`;
      msg += `Сума: ${parseFloat(order.expected_amount)} грн\n`;
      msg += `Батьки: ${order.parent_name}\n`;
      msg += `Телефон: ${order.phone}\n`;
      msg += `Email: ${order.email}\n`;
      msg += `Транзакція: ${body.transactionId}\n`;
      await sendTelegramMessage(msg);
    } catch (err) {
      console.error("[transactions] telegram notification failed:", err);
    }

    return json(res, 200, { ok: true, orderId: order.id });
  } catch (err) {
    await client.query("ROLLBACK");
    return serverError(res, err);
  } finally {
    client.release();
  }
}
