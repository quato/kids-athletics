import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./_lib/db.js";
import { json, serverError } from "./_lib/http.js";
import { matchAndPay } from "./_lib/registration-matching.js";
import { sendPaymentConfirmationEmail } from "./_lib/email.js";
import type { MonobankWebhookPayload } from "./_lib/monobank.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Monobank sends a GET request to verify the webhook URL
  if (req.method === "GET") {
    return json(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const payload = req.body as MonobankWebhookPayload;
  console.log("[monobank-webhook] received payload:", JSON.stringify(payload));

  // Insert the raw event for audit / replay
  let monoEventId: number | null = null;
  try {
    const insertResult = await pool.query<{ id: number }>(
      `INSERT INTO mono_events
         (event_type, account, statement_item_id, payload, processed)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id`,
      [
        payload?.type ?? "unknown",
        payload?.data?.account ?? null,
        payload?.data?.statementItem?.id ?? null,
        JSON.stringify(payload),
      ],
    );
    monoEventId = insertResult.rows[0].id;
  } catch (err) {
    console.error("[monobank-webhook] failed to insert mono_event:", err);
    // Continue anyway – don't reject Monobank's POST over a logging failure
  }

  const markEvent = async (processed: boolean, error?: string) => {
    if (monoEventId === null) return;
    try {
      await pool.query(
        `UPDATE mono_events SET processed = $1, processed_at = now(), error = $2 WHERE id = $3`,
        [processed, error ?? null, monoEventId],
      );
    } catch (err) {
      console.error("[monobank-webhook] failed to update mono_event:", err);
    }
  };

  // Non-statement events – acknowledge and ignore
  if (payload?.type !== "StatementItem") {
    await markEvent(true);
    return json(res, 200, { status: "ignored" });
  }

  const statementItem = payload?.data?.statementItem;
  if (!statementItem) {
    await markEvent(false, "StatementItem payload missing data.statementItem");
    return json(res, 200, { status: "not_matched" });
  }

  try {
    const result = await matchAndPay(statementItem);
    await markEvent(true);

    if (result.status === "ok") {
      try {
        await sendPaymentConfirmationEmail({
          to: result.email,
          parentName: result.parentName,
          children: result.children,
          paymentCode: result.paymentCode,
          totalAmount: result.amount,
          orderId: result.orderId,
          paidAt: result.paidAt,
        });
      } catch (err) {
        console.error("[monobank-webhook] payment email failed:", err);
      }
    }

    return json(res, 200, { status: result.status });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await markEvent(false, errorMessage);
    return serverError(res, err);
  }
}
