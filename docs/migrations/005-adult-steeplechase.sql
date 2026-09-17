-- Steeplechase Mile: an adult race for parents, relatives and guests, added on top of
-- the children's programme. Adults get their own capacity (30 places) so they never
-- consume the 200 children's places, which is what the audience column is for.
ALTER TABLE events ADD COLUMN audience text NOT NULL DEFAULT 'children';
ALTER TABLE events ADD CONSTRAINT events_audience_check CHECK (audience IN ('children', 'adults'));

INSERT INTO events (name, date, fee_amount, registration_deadline, edition, audience) VALUES
  ('Steeplechase Mile — OCTOBER FEST', '2026-10-11 09:00:00+03', 500.00, '2026-10-05 23:59:00+03', 'october-2026', 'adults');
