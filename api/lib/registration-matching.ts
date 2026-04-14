import pool from "./db.js";
import { kopecksToUah, unixToDate, type StatementItem } from "./monobank.js";

export interface ChildInfo {
  childName: string;
  eventName: string;
}

export interface PaidOrderData {
  orderId: number;
  email: string;
  parentName: string;
  paymentCode: string;
  amount: number;
  paidAt: Date;
  children: ChildInfo[];
}

export type MatchResult =
  | ({ status: "ok" } & PaidOrderData)
  | { status: "duplicate"; orderId: number }
  | { status: "not_matched" };

/**
 * Try to find the pending order that corresponds to a Monobank StatementItem
 * and, if found, mark it as paid.
 *
 * Matching strategy:
 *  1. Duplicate guard – if mono_transaction_id already exists in orders => "duplicate"
 *  2. Primary – status='pending' AND description contains payment_code
 *  3. Fallback – status='pending' AND expected_amount = amount/100
 *               AND created_at within the last FALLBACK_WINDOW_DAYS days
 */
export const FALLBACK_WINDOW_DAYS = 7;

export async function matchAndPay(item: StatementItem): Promise<MatchResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Duplicate guard
    const dupCheck = await client.query<{ id: number }>(
      "SELECT id FROM orders WHERE mono_transaction_id = $1 LIMIT 1",
      [item.id],
    );
    if (dupCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return { status: "duplicate", orderId: dupCheck.rows[0].id };
    }

    // 2. Primary match: payment_code inside description
    const primaryMatch = await client.query<{ id: number }>(
      `SELECT id FROM orders
       WHERE status = 'pending'
         AND $1 ILIKE '%' || payment_code || '%'
       ORDER BY created_at DESC
       LIMIT 1`,
      [item.description ?? ""],
    );

    let orderId: number | null = null;

    if (primaryMatch.rows.length > 0) {
      orderId = primaryMatch.rows[0].id;
    } else {
      // 3. Fallback: amount + time window
      const uah = kopecksToUah(item.amount);
      const fallbackMatch = await client.query<{ id: number }>(
        `SELECT id FROM orders
         WHERE status = 'pending'
           AND expected_amount = $1
           AND created_at >= now() - interval '${FALLBACK_WINDOW_DAYS} days'
         ORDER BY created_at DESC
         LIMIT 1`,
        [uah],
      );
      if (fallbackMatch.rows.length > 0) {
        orderId = fallbackMatch.rows[0].id;
      }
    }

    if (orderId === null) {
      await client.query("ROLLBACK");
      return { status: "not_matched" };
    }

    const paidAt = unixToDate(item.time);

    // Mark order as paid
    const updateResult = await client.query<{
      id: number;
      email: string;
      parent_name: string;
      payment_code: string;
      expected_amount: string;
      paid_at: Date;
    }>(
      `UPDATE orders SET
         status = 'paid',
         paid_at = $1,
         mono_transaction_id = $2,
         raw_statement = $3
       WHERE id = $4
       RETURNING id, email, parent_name, payment_code, expected_amount, paid_at`,
      [paidAt, item.id, JSON.stringify(item), orderId],
    );

    // Fetch all children with event names for the email
    const childrenResult = await client.query<{ child_name: string; event_name: string }>(
      `SELECT r.child_name, e.name AS event_name
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.order_id = $1
       ORDER BY r.id`,
      [orderId],
    );

    await client.query("COMMIT");

    const row = updateResult.rows[0];
    return {
      status: "ok",
      orderId: row.id,
      email: row.email,
      parentName: row.parent_name,
      paymentCode: row.payment_code,
      amount: parseFloat(row.expected_amount),
      paidAt: row.paid_at,
      children: childrenResult.rows.map((r) => ({
        childName: r.child_name,
        eventName: r.event_name,
      })),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
