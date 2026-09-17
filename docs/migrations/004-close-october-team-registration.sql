-- Team places for OCTOBER FEST filled up before public registration opened, so the
-- team product must stop being offered publicly. A past registration_deadline is
-- what /api/events uses to hide a product; organizers can still add team
-- registrations by hand in /organizers, which does not check the deadline.
UPDATE events
SET registration_deadline = now()
WHERE edition = 'october-2026'
  AND name ILIKE '%командн%';
