import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./lib/db.js";
import { json, methodNotAllowed, badRequest, notFound, serverError } from "./lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const id = req.query.id;
  if (!id || Array.isArray(id)) {
    return badRequest(res, "Query parameter 'id' (number) is required");
  }

  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return badRequest(res, "Query parameter 'id' must be a valid integer");
  }

  try {
    const orderResult = await pool.query<{
      id: number;
      status: string;
      paid_at: string | null;
      parent_name: string;
      payment_code: string;
      expected_amount: string;
    }>(
      `SELECT id, status, paid_at, parent_name, payment_code, expected_amount
       FROM orders
       WHERE id = $1
       LIMIT 1`,
      [numId],
    );

    if (orderResult.rows.length === 0) {
      return notFound(res, `Order with id ${numId} not found`);
    }

    const order = orderResult.rows[0];

    // Fetch all registered children with event names
    const childrenResult = await pool.query<{
      id: number;
      child_name: string;
      event_name: string;
    }>(
      `SELECT r.id, r.child_name, e.name AS event_name
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.order_id = $1
       ORDER BY r.id`,
      [numId],
    );

    json(res, 200, {
      id: order.id,
      status: order.status,
      paidAt: order.paid_at,
      parentName: order.parent_name,
      paymentCode: order.payment_code,
      expectedAmount: parseFloat(order.expected_amount),
      children: childrenResult.rows.map((r) => ({
        id: r.id,
        childName: r.child_name,
        eventName: r.event_name,
      })),
    });
  } catch (err) {
    serverError(res, err);
  }
}
