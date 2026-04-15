import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { json, methodNotAllowed, serverError } from "../_lib/http.js";

function authenticate(req: VercelRequest): boolean {
  const expectedPassword = process.env.ORGANIZER_PASSWORD;
  if (!expectedPassword) return false;

  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") return false;

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return token === expectedPassword;
}

interface OrderRow {
  id: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  parent_name: string;
  phone: string;
  email: string;
  payment_code: string;
  expected_amount: string;
  children: Array<{
    id: number;
    childName: string;
    eventName: string;
    startNumber: number | null;
    isPresent: boolean | null;
  }> | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  if (!authenticate(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    const result = await pool.query<OrderRow>(`
      SELECT
        o.id,
        o.status,
        o.created_at,
        o.paid_at,
        o.parent_name,
        o.phone,
        o.email,
        o.payment_code,
        o.expected_amount,
        json_agg(
          json_build_object(
            'id',          r.id,
            'childName',   r.child_name,
            'birthYear',   r.birth_year,
            'eventName',   e.name,
            'startNumber', r.start_number,
            'isPresent',   r.is_present
          ) ORDER BY r.id
        ) FILTER (WHERE r.id IS NOT NULL) AS children
      FROM orders o
      LEFT JOIN registrations r ON r.order_id = o.id
      LEFT JOIN events e ON e.id = r.event_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    const orders = result.rows.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.created_at,
      paidAt: row.paid_at,
      parentName: row.parent_name,
      phone: row.phone,
      email: row.email,
      paymentCode: row.payment_code,
      expectedAmount: parseFloat(row.expected_amount),
      children: row.children ?? [],
    }));

    return json(res, 200, { orders });
  } catch (err) {
    return serverError(res, err);
  }
}
