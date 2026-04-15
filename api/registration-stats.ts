import type { VercelRequest, VercelResponse } from "@vercel/node";
import pool from "./_lib/db.js";
import { json, methodNotAllowed, serverError } from "./_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const result = await pool.query<{ age_group: string; count: string }>(`
      SELECT
        CASE
          WHEN birth_year BETWEEN 2022 AND 2023 THEN '2022-2023'
          WHEN birth_year BETWEEN 2020 AND 2021 THEN '2020-2021'
          WHEN birth_year BETWEEN 2018 AND 2019 THEN '2018-2019'
          WHEN birth_year BETWEEN 2016 AND 2017 THEN '2016-2017'
          WHEN birth_year BETWEEN 2014 AND 2015 THEN '2014-2015'
          ELSE 'special'
        END AS age_group,
        COUNT(*) AS count
      FROM registrations r
      JOIN orders o ON o.id = r.order_id
      WHERE o.status = 'paid'
      GROUP BY age_group
    `);

    const countMap: Record<string, number> = {};
    for (const row of result.rows) {
      countMap[row.age_group] = parseInt(row.count, 10);
    }

    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    return json(res, 200, { counts: countMap });
  } catch (err) {
    return serverError(res, err);
  }
}
