import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./_lib/db.js";
import { json, methodNotAllowed, serverError } from "./_lib/http.js";
import { matchAndPay } from "./_lib/registration-matching.js";
import { sendPaymentConfirmationEmail } from "./_lib/email.js";
import type { StatementItem } from "./_lib/monobank.js";

const MONOBANK_API = "https://api.monobank.ua";
const SYNC_WINDOW_HOURS = 24;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  const token = process.env.MONO_TOKEN;
  if (!token) {
    return json(res, 500, { error: "MONO_TOKEN environment variable is not set" });
  }

  const accountId = process.env.MONO_ACCOUNT_ID ?? "0"; // "0" = first account
  const to = Math.floor(Date.now() / 1000);
  const from = to - SYNC_WINDOW_HOURS * 60 * 60;

  let statements: StatementItem[];
  try {
    const monoRes = await fetch(
      `${MONOBANK_API}/personal/statement/${accountId}/${from}/${to}`,
      { headers: { "X-Token": token } },
    );
    if (!monoRes.ok) {
      const body = await monoRes.text();
      return json(res, 502, {
        error: "Monobank API error",
        status: monoRes.status,
        body,
      });
    }
    statements = (await monoRes.json()) as StatementItem[];
  } catch (err) {
    return serverError(res, err);
  }

  const stats = {
    reviewed: 0,
    matched: 0,
    duplicates: 0,
    not_matched: 0,
    errors: 0,
  };

  for (const item of statements) {
    stats.reviewed++;
    try {
      // Log each statement item into mono_events for traceability
      await pool.query(
        `INSERT INTO mono_events
           (event_type, account, statement_item_id, payload, processed)
         VALUES ('StatementItem', $1, $2, $3, false)
         ON CONFLICT DO NOTHING`,
        [accountId === "0" ? null : accountId, item.id, JSON.stringify(item)],
      );

      const result = await matchAndPay(item);

      // Mark the event as processed
      await pool.query(
        `UPDATE mono_events
         SET processed = true, processed_at = now()
         WHERE statement_item_id = $1 AND processed = false`,
        [item.id],
      );

      if (result.status === "ok") {
        stats.matched++;
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
          console.error("[mono-sync] payment email failed:", err);
        }
      } else if (result.status === "duplicate") {
        stats.duplicates++;
      } else {
        stats.not_matched++;
      }
    } catch (err) {
      stats.errors++;
      console.error("[mono-sync] error processing item", item.id, err);
      await pool.query(
        `UPDATE mono_events
         SET error = $1
         WHERE statement_item_id = $2 AND processed = false`,
        [err instanceof Error ? err.message : String(err), item.id],
      );
    }
  }

  json(res, 200, {
    windowHours: SYNC_WINDOW_HOURS,
    from: new Date(from * 1000).toISOString(),
    to: new Date(to * 1000).toISOString(),
    stats,
  });
}
