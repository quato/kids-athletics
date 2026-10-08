-- Public registration for OCTOBER FEST closed on 5 October because
-- registration_deadline had passed, even though places were still free.
-- Exhibition and the adult race stay open through 7 October, 23:59 Kyiv.
-- The team race stays closed (see 004).
UPDATE events
SET registration_deadline = '2026-10-07 23:59:00+03'
WHERE edition = 'october-2026'
  AND name NOT ILIKE '%командн%';
