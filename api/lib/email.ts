import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "Kids Athletics FEST <noreply@kids-athletics.com.ua>";
const SITE_URL = (process.env.SITE_URL ?? "https://kids-athletics.com.ua").replace(/\/$/, "");

export interface EmailChild {
  childName: string;
  eventName: string;
  feeAmount?: number;
}

function statusUrl(orderId: number): string {
  return `${SITE_URL}/status/${orderId}`;
}

function childrenSubject(children: EmailChild[]): string {
  if (children.length === 1) return children[0].childName;
  if (children.length === 2) return children.map((c) => c.childName).join(", ");
  return `${children.length} дітей`;
}

/** Sent immediately after a new order is created. */
export async function sendRegistrationEmail(opts: {
  to: string;
  parentName: string;
  children: EmailChild[];
  paymentCode: string;
  totalAmount: number;
  orderId: number;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set – skipping registration email");
    return;
  }

  const link = statusUrl(opts.orderId);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [opts.to],
    subject: `Реєстрацію прийнято — ${childrenSubject(opts.children)} | Kids Athletics FEST`,
    html: registrationHtml({ ...opts, link }),
  });

  if (error) {
    console.error("[email] sendRegistrationEmail error:", error);
  }
}

/** Sent after payment is matched and order is marked as paid. */
export async function sendPaymentConfirmationEmail(opts: {
  to: string;
  parentName: string;
  children: EmailChild[];
  paymentCode: string;
  totalAmount: number;
  orderId: number;
  paidAt: Date;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set – skipping payment confirmation email");
    return;
  }

  const link = statusUrl(opts.orderId);

  const { error } = await resend.emails.send({
    from: FROM,
    to: [opts.to],
    subject: `Оплату підтверджено — ${childrenSubject(opts.children)} | Kids Athletics FEST`,
    html: paymentConfirmationHtml({ ...opts, link }),
  });

  if (error) {
    console.error("[email] sendPaymentConfirmationEmail error:", error);
  }
}

// ─── HTML templates ──────────────────────────────────────────────────────────

const CARD_NUMBER = "4874 0700 5666 0853";

const baseStyle = `font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;background:#ffffff;`;
const btnStyle = `display:inline-block;padding:12px 24px;background:#e85d24;color:#ffffff !important;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;`;
const codeBoxStyle = `background:#f5f5f5;border:1px solid #e0e0e0;border-radius:6px;padding:12px 16px;font-family:monospace;font-size:22px;font-weight:bold;letter-spacing:2px;color:#e85d24;display:inline-block;margin:8px 0;`;

function childrenTable(children: EmailChild[]): string {
  return children
    .map(
      (c) => `
  <tr style="border-top:1px solid #f0f0f0;">
    <td style="padding:8px 0;font-weight:bold;">${c.childName}</td>
    <td style="padding:8px 0;color:#666;font-size:14px;text-align:right;">${c.eventName}${c.feeAmount ? ` — ${c.feeAmount} грн` : ""}</td>
  </tr>`,
    )
    .join("");
}

function registrationHtml(opts: {
  parentName: string;
  children: EmailChild[];
  paymentCode: string;
  totalAmount: number;
  orderId: number;
  link: string;
}): string {
  return `
<div style="${baseStyle}">
  <div style="background:#e85d24;padding:24px 32px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;color:#fff;font-size:22px;">Kids Athletics FEST</h1>
    <p style="margin:4px 0 0;color:#ffe0d0;font-size:14px;">Реєстрацію прийнято</p>
  </div>

  <div style="padding:32px;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 16px;">Привіт, <strong>${opts.parentName}</strong>!</p>
    <p style="margin:0 0 24px;">
      Реєстрацію на Kids Athletics FEST успішно прийнято.
      Для підтвердження участі необхідно оплатити реєстраційний внесок одним платежем.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td colspan="2" style="padding:8px 0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Учасники</td>
      </tr>
      ${childrenTable(opts.children)}
      <tr style="border-top:2px solid #e0e0e0;">
        <td style="padding:10px 0;font-weight:bold;">Разом до сплати</td>
        <td style="padding:10px 0;font-weight:bold;text-align:right;color:#e85d24;font-size:18px;">${opts.totalAmount} грн</td>
      </tr>
    </table>

    <div style="background:#fff8f5;border:1px solid #ffd5c0;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-weight:bold;font-size:15px;">Як оплатити?</p>

      <p style="margin:0 0 4px;font-size:13px;color:#666;">Картка організатора:</p>
      <p style="margin:0 0 16px;font-family:monospace;font-size:24px;font-weight:900;letter-spacing:3px;color:#1a1a1a;">${CARD_NUMBER}</p>

      <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:6px;padding:14px;margin-bottom:16px;">
        <p style="margin:0 0 6px;font-weight:bold;font-size:14px;color:#dc2626;">⚠️ Обов'язково вкажіть код платежу у призначенні:</p>
        <span style="${codeBoxStyle}">${opts.paymentCode}</span>
        <p style="margin:6px 0 0;font-size:12px;color:#888;">Без коду платіж неможливо ідентифікувати — реєстрація залишиться непідтвердженою.</p>
      </div>

      <ol style="margin:0;padding-left:20px;line-height:1.8;color:#444;font-size:14px;">
        <li>Відкрийте Monobank, Privatbank або будь-який інтернет-банкінг.</li>
        <li>Виконайте переказ на картку <strong style="font-family:monospace;">${CARD_NUMBER}</strong></li>
        <li>У призначенні платежу вкажіть код: <strong style="font-family:monospace;color:#e85d24;">${opts.paymentCode}</strong></li>
        <li>Сума: <strong>${opts.totalAmount} грн</strong></li>
      </ol>
    </div>

    <p style="text-align:center;margin-bottom:24px;">
      <a href="${opts.link}" style="${btnStyle}">Перевірити статус оплати</a>
    </p>

    <p style="font-size:12px;color:#999;margin:0;">
      Після надходження платежу статус оновиться автоматично — ви отримаєте ще один лист.
      Якщо є питання — зверніться до організаторів.
    </p>
  </div>
</div>`.trim();
}

function paymentConfirmationHtml(opts: {
  parentName: string;
  children: EmailChild[];
  paymentCode: string;
  totalAmount: number;
  orderId: number;
  paidAt: Date;
  link: string;
}): string {
  const paidAtFormatted = opts.paidAt.toLocaleString("uk-UA", {
    timeZone: "Europe/Kyiv",
    dateStyle: "long",
    timeStyle: "short",
  });

  return `
<div style="${baseStyle}">
  <div style="background:#16a34a;padding:24px 32px;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;color:#fff;font-size:22px;">Kids Athletics FEST</h1>
    <p style="margin:4px 0 0;color:#bbf7d0;font-size:14px;">Оплату підтверджено ✓</p>
  </div>

  <div style="padding:32px;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 16px;">Привіт, <strong>${opts.parentName}</strong>!</p>
    <p style="margin:0 0 24px;">
      Оплату за участь у Kids Athletics FEST успішно підтверджено. До зустрічі на старті! 🏃
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td colspan="2" style="padding:8px 0;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Учасники</td>
      </tr>
      ${childrenTable(opts.children)}
      <tr style="border-top:2px solid #e0e0e0;">
        <td style="padding:10px 0;font-weight:bold;">Сплачено</td>
        <td style="padding:10px 0;font-weight:bold;text-align:right;color:#16a34a;font-size:18px;">${opts.totalAmount} грн</td>
      </tr>
      <tr style="border-top:1px solid #f0f0f0;">
        <td style="padding:8px 0;color:#666;font-size:14px;">Код платежу</td>
        <td style="padding:8px 0;font-family:monospace;font-weight:bold;text-align:right;color:#16a34a;">${opts.paymentCode}</td>
      </tr>
      <tr style="border-top:1px solid #f0f0f0;">
        <td style="padding:8px 0;color:#666;font-size:14px;">Час оплати</td>
        <td style="padding:8px 0;text-align:right;color:#666;font-size:14px;">${paidAtFormatted}</td>
      </tr>
    </table>

    <p style="text-align:center;margin-bottom:24px;">
      <a href="${opts.link}" style="${btnStyle.replace("#e85d24", "#16a34a")}">Переглянути статус реєстрації</a>
    </p>

    <p style="font-size:12px;color:#999;margin:0;">
      Збережіть цей лист як підтвердження оплати. Чекаємо вас на фестивалі!
    </p>
  </div>
</div>`.trim();
}
