import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./_lib/db.js";
import { json, methodNotAllowed, badRequest, notFound, serverError } from "./_lib/http.js";
import { sendRegistrationEmail } from "./_lib/email.js";
import { sendTelegramMessage } from "./_lib/telegram.js";
import { findDuplicates } from "./_lib/duplicates.js";
import {
  ACTIVE_EDITION,
  ADULT_LIMIT,
  ADULT_MIN_AGE,
  CHILDREN_LIMIT,
  EDITION_ADULT_COUNT_SQL,
  EDITION_REGISTRATION_COUNT_SQL,
} from "./_lib/edition.js";

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
      // Adults are allowed here too; the exact floor per audience is checked
      // once the events (and therefore their audience) are known.
      c.birthYear >= 1930 &&
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch fee_amount for every requested event, in one query
    const eventIds = [...new Set(children.map((c) => c.eventId))];
    const eventResult = await client.query<{ id: number; name: string; fee_amount: string; audience: string }>(
      `SELECT id, name, fee_amount, audience FROM events WHERE id = ANY($1::int[]) AND edition = $2`,
      [eventIds, ACTIVE_EDITION],
    );

    const eventMap = new Map(
      eventResult.rows.map((r) => [
        r.id,
        { name: r.name, fee: parseFloat(r.fee_amount), audience: r.audience },
      ]),
    );

    // Validate all events exist
    for (const child of children) {
      if (!eventMap.has(child.eventId)) {
        await client.query("ROLLBACK");
        return notFound(res, `Event with id ${child.eventId} not found`);
      }
    }

    // Adult races carry their own age floor and their own capacity, so the two
    // audiences are validated and counted apart from each other.
    const adultEntries = children.filter((c) => eventMap.get(c.eventId)!.audience === "adults");
    const childEntries = children.filter((c) => eventMap.get(c.eventId)!.audience !== "adults");

    const latestAdultBirthYear = new Date().getFullYear() - ADULT_MIN_AGE;
    if (adultEntries.some((c) => c.birthYear > latestAdultBirthYear)) {
      await client.query("ROLLBACK");
      return badRequest(
        res,
        `Дорослі забіги — для учасників від ${ADULT_MIN_AGE} років (рік народження ${latestAdultBirthYear} або раніше)`,
      );
    }
    if (childEntries.some((c) => c.birthYear < 2000)) {
      await client.query("ROLLBACK");
      return badRequest(res, "Рік народження дитини не може бути раніше 2000");
    }

    if (childEntries.length > 0) {
      const capResult = await client.query<{ count: string }>(
        EDITION_REGISTRATION_COUNT_SQL,
        [ACTIVE_EDITION],
      );
      if (parseInt(capResult.rows[0].count, 10) + childEntries.length > CHILDREN_LIMIT) {
        await client.query("ROLLBACK");
        return json(res, 409, {
          error: `Реєстрацію закрито — досягнуто максимальну кількість дітей (${CHILDREN_LIMIT})`,
        });
      }
    }

    if (adultEntries.length > 0) {
      const adultResult = await client.query<{ count: string }>(
        EDITION_ADULT_COUNT_SQL,
        [ACTIVE_EDITION],
      );
      if (parseInt(adultResult.rows[0].count, 10) + adultEntries.length > ADULT_LIMIT) {
        await client.query("ROLLBACK");
        return json(res, 409, {
          error: `Місця на дорослий забіг закінчилися — всього ${ADULT_LIMIT} місць`,
        });
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

    // Telegram notification
    try {
      const childNames = children.map((c) => c.childName);
      const duplicates = await findDuplicates(parentName, phone, email, childNames, orderId);

      let msg = `🆕 <b>Нова реєстрація!</b>\n`;
      msg += `Замовлення: #${orderId}\n`;
      msg += `Батьки: ${parentName.trim()}\n`;
      msg += `Телефон: ${phone.trim()}\n`;
      msg += `Email: ${email.trim().toLowerCase()}\n`;
      msg += `Сума: ${totalAmount} грн\n`;

      if (duplicates.length > 0) {
        msg += `\n⚠️ <b>Увага, можливий дублікат!</b>\n`;
        msg += `Збіги знайдено у замовленнях:\n`;
        duplicates.forEach((d) => {
          msg += `- #${d.id} (${d.parentName}, ${d.phone})\n`;
        });
      }

      await sendTelegramMessage(msg);
    } catch (err) {
      console.error("[registration] telegram notification failed:", err);
    }

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
