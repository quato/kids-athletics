import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "../_lib/db.js";
import { json, methodNotAllowed, badRequest, notFound, serverError } from "../_lib/http.js";

function authenticate(req: VercelRequest): boolean {
  const expectedPassword = process.env.ORGANIZER_PASSWORD;
  if (!expectedPassword) return false;
  const authHeader = req.headers["authorization"];
  if (!authHeader || typeof authHeader !== "string") return false;
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return token === expectedPassword;
}

function buildPaymentCode(orderId: number): string {
  const year = new Date().getFullYear();
  return `EV${year}-${String(orderId).padStart(6, "0")}`;
}

interface ChildInput {
  childName: string;
  birthYear?: number;
  eventId: number;
}

interface Body {
  parentName: string;
  phone: string;
  email: string;
  status: "paid" | "pending";
  note?: string;
  children: ChildInput[];
}

function validateBody(body: unknown): body is Body {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (
    typeof b.parentName !== "string" || b.parentName.trim().length < 2 ||
    typeof b.phone !== "string" || b.phone.trim().length < 5 ||
    typeof b.email !== "string" ||
    !Array.isArray(b.children) || b.children.length === 0
  ) return false;
  return b.children.every(
    (c) =>
      c &&
      typeof c === "object" &&
      typeof (c as Record<string, unknown>).childName === "string" &&
      ((c as Record<string, unknown>).childName as string).trim().length >= 2 &&
      typeof (c as Record<string, unknown>).eventId === "number" &&
      (c as Record<string, unknown>).eventId > 0,
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  if (!authenticate(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  if (!validateBody(req.body)) {
    return badRequest(res, "Required fields: parentName, phone, email, children[]");
  }

  const { parentName, phone, email, status = "paid", note, children } = req.body as Body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const eventIds = [...new Set(children.map((c) => c.eventId))];
    const eventResult = await client.query<{ id: number; name: string; fee_amount: string }>(
      `SELECT id, name, fee_amount FROM events WHERE id = ANY($1::int[])`,
      [eventIds],
    );
    const eventMap = new Map(
      eventResult.rows.map((r) => [r.id, { name: r.name, fee: parseFloat(r.fee_amount) }]),
    );

    for (const child of children) {
      if (!eventMap.has(child.eventId)) {
        await client.query("ROLLBACK");
        return notFound(res, `Event with id ${child.eventId} not found`);
      }
    }

    const totalAmount = children.reduce(
      (sum, c) => sum + (eventMap.get(c.eventId)?.fee ?? 0),
      0,
    );

    const paidAt = status === "paid" ? new Date() : null;

    const orderResult = await client.query<{ id: number }>(
      `INSERT INTO orders
         (parent_name, phone, email, payment_code, expected_amount, status, paid_at)
       VALUES ($1, $2, $3, 'TEMP', $4, $5, $6)
       RETURNING id`,
      [parentName.trim(), phone.trim(), email.trim().toLowerCase(), totalAmount, status, paidAt],
    );

    const orderId = orderResult.rows[0].id;
    const paymentCode = buildPaymentCode(orderId);

    await client.query(
      `UPDATE orders SET payment_code = $1${note ? ", note = $3" : ""} WHERE id = $2`,
      note ? [paymentCode, orderId, note.trim()] : [paymentCode, orderId],
    );

    const childResults: { childName: string; eventName: string }[] = [];
    for (const child of children) {
      const ev = eventMap.get(child.eventId)!;
      await client.query(
        `INSERT INTO registrations (order_id, event_id, child_name, birth_year) VALUES ($1, $2, $3, $4)`,
        [orderId, child.eventId, child.childName.trim(), child.birthYear ?? 0],
      );
      childResults.push({ childName: child.childName.trim(), eventName: ev.name });
    }

    await client.query("COMMIT");

    return json(res, 201, { orderId, paymentCode, totalAmount, status, children: childResults });
  } catch (err) {
    await client.query("ROLLBACK");
    return serverError(res, err);
  } finally {
    client.release();
  }
}
