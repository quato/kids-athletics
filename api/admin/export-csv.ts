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

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  if (!authenticate(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    const result = await pool.query(`
      SELECT
        o.id AS order_id,
        o.created_at,
        o.status,
        o.paid_at,
        o.parent_name,
        o.phone,
        o.email,
        o.payment_code,
        o.expected_amount,
        r.id AS child_id,
        r.child_name,
        r.birth_year,
        r.start_number,
        r.is_present,
        e.name AS event_name
      FROM orders o
      LEFT JOIN registrations r ON r.order_id = o.id
      LEFT JOIN events e ON e.id = r.event_id
      ORDER BY o.created_at DESC, r.id ASC
    `);

    const headers = [
      "ID Замовлення",
      "Дата створення",
      "Статус",
      "Дата оплати",
      "Батько/Мати",
      "Телефон",
      "Email",
      "Код платежу",
      "Сума (грн)",
      "ID Дитини",
      "Ім'я дитини",
      "Рік народження",
      "Стартовий номер",
      "Присутність",
      "Подія"
    ];

    const rows = result.rows.map((row) => [
      row.order_id,
      row.created_at ? new Date(row.created_at).toLocaleString("uk-UA") : "",
      row.status === "paid" ? "Оплачено" : "Очікує",
      row.paid_at ? new Date(row.paid_at).toLocaleString("uk-UA") : "",
      row.parent_name,
      row.phone,
      row.email,
      row.payment_code,
      row.expected_amount,
      row.child_id || "",
      row.child_name || "",
      row.birth_year === 0 ? "Інвалід" : (row.birth_year || ""),
      row.start_number || "",
      row.is_present === true ? "Так" : row.is_present === false ? "Ні" : "",
      row.event_name || ""
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map(row => row.map(escapeCsv).join(","))
    ].join("\n");

    // Add BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF";

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="registrations.csv"');
    return res.status(200).send(bom + csvContent);
  } catch (err) {
    return serverError(res, err);
  }
}
