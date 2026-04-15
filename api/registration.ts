import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./_lib/db.js";
import { json, methodNotAllowed, badRequest, notFound, serverError } from "./_lib/http.js";
import { sendRegistrationEmail } from "./_lib/email.js";

interface ChildInput {
  childName: string;
  birthYear: number;
  eventId: number;
}

interface RegistrationBody {
  parentName: string;
  phone: string;
  email: string;
  children: ChildInput[];
}

function validateBody(body: unknown): body is RegistrationBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (
    typeof b.parentName !== "string" || b.parentName.trim().length < 2 ||
    typeof b.phone !== "string" || b.phone.trim().length < 10 ||
    typeof b.email !== "string" || b.email.trim().length === 0 ||
    !Array.isArray(b.children) || b.children.length === 0
  ) return false;

  const currentYear = new Date().getFullYear();
  return b.children.every(
    (c) =>
      c &&
      typeof c === "object" &&
      typeof c.childName === "string" &&
      c.childName.trim().length >= 2 &&
      typeof c.birthYear === "number" &&
      c.birthYear >= 2000 &&
      c.birthYear <= currentYear &&
      typeof c.eventId === "number" &&
      c.eventId > 0,
  );
}

/**
 * Generates the order payment code from the auto-incremented order id.
 * Format: EV<4-digit-year>-<zero-padded-6-digit-id>
 * Example: EV2026-000042
 */
function buildPaymentCode(orderId: number): string {
  const year = new Date().getFullYear();
  return `EV${year}-${String(orderId).padStart(6, "0")}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  if (!validateBody(req.body)) {
    return badRequest(
      res,
      "Required fields: parentName, phone, email, children (array of {childName, eventId})",
    );
  }

  const { parentName, phone, email, children } = req.body as RegistrationBody;

  // Enforce 140-order capacity limit
  const capResult = await pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM orders");
  if (parseInt(capResult.rows[0].count, 10) >= 140) {
    return json(res, 409, { error: "Реєстрацію закрито — досягнуто максимальну кількість заявок (140)" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch fee_amount for every requested event, in one query
    const eventIds = [...new Set(children.map((c) => c.eventId))];
    const eventResult = await client.query<{ id: number; name: string; fee_amount: string }>(
      `SELECT id, name, fee_amount FROM events WHERE id = ANY($1::int[])`,
      [eventIds],
    );

    const eventMap = new Map(
      eventResult.rows.map((r) => [r.id, { name: r.name, fee: parseFloat(r.fee_amount) }]),
    );

    // Validate all events exist
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

    // Insert order with temporary payment_code placeholder
    const orderResult = await client.query<{ id: number }>(
      `INSERT INTO orders
         (parent_name, phone, email, payment_code, expected_amount, status)
       VALUES ($1, $2, $3, 'TEMP', $4, 'pending')
       RETURNING id`,
      [parentName.trim(), phone.trim(), email.trim().toLowerCase(), totalAmount],
    );

    const orderId = orderResult.rows[0].id;
    const paymentCode = buildPaymentCode(orderId);

    // Update with real payment_code
    await client.query("UPDATE orders SET payment_code = $1 WHERE id = $2", [paymentCode, orderId]);

    // Insert one registration row per child
    const childResults: { id: number; childName: string; eventName: string; feeAmount: number }[] = [];
    for (const child of children) {
      const ev = eventMap.get(child.eventId)!;
      const regResult = await client.query<{ id: number }>(
        `INSERT INTO registrations (order_id, event_id, child_name, birth_year) VALUES ($1, $2, $3, $4) RETURNING id`,
        [orderId, child.eventId, child.childName.trim(), child.birthYear],
      );
      childResults.push({
        id: regResult.rows[0].id,
        childName: child.childName.trim(),
        eventName: ev.name,
        feeAmount: ev.fee,
      });
    }

    await client.query("COMMIT");

    // Send registration confirmation email before responding so the serverless
    // function does not terminate before the HTTP request to Resend completes.
    try {
      await sendRegistrationEmail({
        to: email.trim().toLowerCase(),
        parentName: parentName.trim(),
        children: childResults.map((c) => ({
          childName: c.childName,
          eventName: c.eventName,
          feeAmount: c.feeAmount,
        })),
        paymentCode,
        totalAmount,
        orderId,
      });
    } catch (err) {
      console.error("[registration] email send failed:", err);
    }

    json(res, 201, {
      orderId,
      paymentCode,
      totalAmount,
      children: childResults,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    serverError(res, err);
  } finally {
    client.release();
  }
}
