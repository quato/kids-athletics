import pool from "./db.js";
import { unixToDate, type StatementItem } from "./monobank.js";

export interface ChildInfo {
  childName: string;
  eventName: string;
}

export interface PaidOrderData {
  orderId: number;
  email: string;
  phone: string;
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
 *  2. Primary match – status='pending' AND description OR comment contains payment_code
 *
 * If payment_code is not present in the statement text the payment is left
 * unmatched and shows up on the "Нерозпізнані платежі" tab for manual linking.
 */

export async function matchAndPay(item: StatementItem): Promise<MatchResult> {
  // Ignore outbound / zero-amount operations – they can never be payments
  if (item.amount <= 0) {
    return { status: "not_matched" };
  }

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

    // 2. Primary match: payment_code inside description OR comment
    const primaryMatch = await client.query<{ id: number }>(
      `SELECT id FROM orders
       WHERE status = 'pending'
         AND (
           $1 ILIKE '%' || payment_code || '%'
           OR $2 ILIKE '%' || payment_code || '%'
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [item.description ?? "", item.comment ?? ""],
    );

    // Only match when the payment_code is explicitly present in description or comment.
    // If the code is missing, the payment goes to the "Нерозпізнані платежі" tab
    // so an organizer can link it manually.
    if (primaryMatch.rows.length === 0) {
      await client.query("ROLLBACK");
      return { status: "not_matched" };
    }

    const orderId = primaryMatch.rows[0].id;

    const paidAt = unixToDate(item.time);

    // Mark order as paid
    const updateResult = await client.query<{
      id: number;
      email: string;
      phone: string;
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
       RETURNING id, email, phone, parent_name, payment_code, expected_amount, paid_at`,
      [paidAt, item.id, JSON.stringify(item), orderId],
    );

    // Mark all children as present by default when payment is confirmed
    await client.query(
      `UPDATE registrations SET is_present = true WHERE order_id = $1 AND is_present IS NULL`,
      [orderId],
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
      phone: row.phone,
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
