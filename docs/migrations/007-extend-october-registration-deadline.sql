-- Extend public registration two more days. Exhibition and the adult race
-- stay open through 10 October, 23:59 Kyiv. The team race stays closed.
UPDATE events
SET registration_deadline = '2026-10-10 23:59:00+03'
WHERE edition = 'october-2026'
  AND name NOT ILIKE '%командн%';
