import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { json, methodNotAllowed, serverError } from "../_lib/http.js";
import { kopecksToUah } from "../_lib/monobank.js";

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
      order_id: number;
      parent_name: string;
      phone: string;
      email: string;
      payment_code: string;
      expected_amount: string;
      paid_at: string;
      mono_transaction_id: string;
      raw_statement: Record<string, unknown> | null;
    }>(
      `SELECT
         o.id            AS order_id,
         o.parent_name,
         o.phone,
         o.email,
         o.payment_code,
         o.expected_amount,
         o.paid_at,
         o.mono_transaction_id,
         o.raw_statement
       FROM orders o
       WHERE o.status = 'paid'
         AND o.mono_transaction_id IS NOT NULL
       ORDER BY o.paid_at DESC`,
    );

    const linked = result.rows.map((row) => {
      const stmt = row.raw_statement;

      // Amount from raw statement (kopecks) if available, else fall back to expected
      let actualAmount: number = parseFloat(row.expected_amount);
      if (stmt && typeof stmt.amount === "number") {
        actualAmount = kopecksToUah(stmt.amount);
      }

      const description =
        stmt && typeof stmt.description === "string" ? stmt.description : null;
      const comment =
        stmt && typeof stmt.comment === "string" ? stmt.comment : null;
      const counterName =
        stmt && typeof stmt.counterName === "string" ? stmt.counterName : null;

      // Amounts match if within 1 kopeck (floating point tolerance)
      const expectedAmount = parseFloat(row.expected_amount);
      const amountMatch = Math.abs(actualAmount - expectedAmount) < 0.01;

      return {
        orderId: row.order_id,
        parentName: row.parent_name,
        phone: row.phone,
        email: row.email,
        paymentCode: row.payment_code,
        expectedAmount,
        actualAmount,
        amountMatch,
        paidAt: row.paid_at,
        transactionId: row.mono_transaction_id,
        description,
        comment,
        counterName,
        rawStatement: stmt ?? null,
      };
    });

    return json(res, 200, { linked });
  } catch (err) {
    return serverError(res, err);
  }
}
