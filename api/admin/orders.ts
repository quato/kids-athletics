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
  mono_transaction_id: string | null;
  children: Array<{
    id: number;
    childName: string;
    birthYear: number;
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

  const CHILDREN_LIMIT = 140;

  try {
    const [result, childrenCountResult] = await Promise.all([
      pool.query<OrderRow>(`
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
          o.mono_transaction_id,
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
      `),
      pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM registrations"),
    ]);

    if (req.query.format === "csv") {
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

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows: any[][] = [];
      for (const row of result.rows) {
        const orderData = [
          row.id,
          row.created_at ? new Date(row.created_at).toLocaleString("uk-UA") : "",
          row.status === "paid" ? "Оплачено" : "Очікує",
          row.paid_at ? new Date(row.paid_at).toLocaleString("uk-UA") : "",
          row.parent_name,
          row.phone,
          row.email,
          row.payment_code,
          row.expected_amount
        ];

        if (!row.children || row.children.length === 0) {
          rows.push([...orderData, "", "", "", "", "", ""]);
        } else {
          for (const child of row.children) {
            rows.push([
              ...orderData,
              child.id,
              child.childName || "",
              child.birthYear === 0 ? "Інвалід" : (child.birthYear || ""),
              child.startNumber || "",
              child.isPresent === true ? "Так" : child.isPresent === false ? "Ні" : "",
              child.eventName || ""
            ]);
          }
        }
      }

      const csvContent = [
        headers.map(escapeCsv).join(","),
        ...rows.map(r => r.map(escapeCsv).join(","))
      ].join("\n");

      const bom = "\uFEFF";
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="registrations.csv"');
      return res.status(200).send(bom + csvContent);
    }

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
      monoTransactionId: row.mono_transaction_id,
      children: row.children ?? [],
    }));

    const registeredChildren = parseInt(childrenCountResult.rows[0].count, 10);
    const remainingPlaces = Math.max(CHILDREN_LIMIT - registeredChildren, 0);

    return json(res, 200, {
      orders,
      registeredChildren,
      childrenLimit: CHILDREN_LIMIT,
      remainingPlaces,
    });
  } catch (err) {
    return serverError(res, err);
  }
}
