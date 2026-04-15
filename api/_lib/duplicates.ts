import pool from "./db.js";

export interface DuplicateMatch {
  id: number;
  parentName: string;
  phone: string;
}

export async function findDuplicates(
  parentName: string,
  phone: string,
  email: string,
  childNames: string[],
  excludeOrderId?: number
): Promise<DuplicateMatch[]> {
  try {
    const phoneDigits = phone.replace(/\D/g, "").slice(-9);
    const safeEmail = email.trim().toLowerCase();
    const safeParentName = parentName.trim();
    const safeChildNames = childNames.map((name) => name.trim()).filter(Boolean);

    // Build condition dynamically to avoid matching empty strings
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (safeEmail) {
      conditions.push(`LOWER(o.email) = $${paramIdx++}`);
      params.push(safeEmail);
    }

    if (phoneDigits.length >= 7) {
      conditions.push(`RIGHT(REGEXP_REPLACE(o.phone, '\\D', '', 'g'), 9) = $${paramIdx++}`);
      params.push(phoneDigits);
    }

    if (safeParentName) {
      conditions.push(`o.parent_name ILIKE $${paramIdx++}`);
      params.push(safeParentName);
    }

    if (safeChildNames.length > 0) {
      conditions.push(`r.child_name ILIKE ANY($${paramIdx++})`);
      params.push(safeChildNames);
    }

    if (conditions.length === 0) {
      return [];
    }

    let query = `
      SELECT DISTINCT o.id, o.parent_name, o.phone
      FROM orders o
      LEFT JOIN registrations r ON r.order_id = o.id
      WHERE (${conditions.join(" OR ")})
    `;

    if (excludeOrderId) {
      query += ` AND o.id != $${paramIdx++}`;
      params.push(excludeOrderId);
    }

    const result = await pool.query<{ id: number; parent_name: string; phone: string }>(
      query,
      params
    );

    return result.rows.map((row) => ({
      id: row.id,
      parentName: row.parent_name,
      phone: row.phone,
    }));
  } catch (err) {
    console.error("[duplicates] Error finding duplicates:", err);
    return [];
  }
}
