import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./_lib/db.js";
import { json, methodNotAllowed, serverError } from "./_lib/http.js";

const AGE_GROUP_EXPR = `
  CASE
    WHEN r.birth_year BETWEEN 2022 AND 2023 THEN '2022-2023'
    WHEN r.birth_year BETWEEN 2020 AND 2021 THEN '2020-2021'
    WHEN r.birth_year BETWEEN 2018 AND 2019 THEN '2018-2019'
    WHEN r.birth_year BETWEEN 2016 AND 2017 THEN '2016-2017'
    WHEN r.birth_year BETWEEN 2014 AND 2015 THEN '2014-2015'
    ELSE 'special'
  END
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const [countsResult, startersResult, totalResult] = await Promise.all([
      // counts per age group (present + start_number set, paid orders only)
      pool.query<{ age_group: string; count: string }>(`
        SELECT ${AGE_GROUP_EXPR} AS age_group, COUNT(*) AS count
        FROM registrations r
        JOIN orders o ON o.id = r.order_id
        WHERE r.is_present = true AND r.start_number IS NOT NULL AND o.status = 'paid'
        GROUP BY age_group
      `),
      // children with a start number (present + start_number set, paid orders only)
      pool.query<{ age_group: string; child_name: string; start_number: number }>(`
        SELECT
          ${AGE_GROUP_EXPR} AS age_group,
          r.child_name,
          r.start_number
        FROM registrations r
        JOIN orders o ON o.id = r.order_id
        WHERE r.is_present = true
          AND r.start_number IS NOT NULL
          AND o.status = 'paid'
        ORDER BY r.start_number ASC
      `),
      // total children across all orders (all statuses)
      pool.query<{ count: string }>(`SELECT COUNT(*) AS count FROM registrations`),
    ]);

    const counts: Record<string, number> = {};
    for (const row of countsResult.rows) {
      counts[row.age_group] = parseInt(row.count, 10);
    }

    // group starters by age_group
    const starters: Record<string, Array<{ childName: string; startNumber: number }>> = {};
    for (const row of startersResult.rows) {
      if (!starters[row.age_group]) starters[row.age_group] = [];
      starters[row.age_group].push({
        childName: row.child_name,
        startNumber: row.start_number,
      });
    }

    const totalRegistered = parseInt(totalResult.rows[0].count, 10);

    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    return json(res, 200, { counts, starters, totalRegistered });
  } catch (err) {
    return serverError(res, err);
  }
}
