ALTER TABLE events ADD COLUMN edition text;
UPDATE events SET edition = 'may-2026' WHERE edition IS NULL;
ALTER TABLE events ALTER COLUMN edition SET NOT NULL;
CREATE INDEX idx_events_edition ON events (edition);

INSERT INTO events (name, date, fee_amount, registration_deadline, edition) VALUES
  ('Виставковий забіг — OCTOBER FEST', '2026-10-11 09:00:00+03', 400.00, '2026-10-05 23:59:00+03', 'october-2026'),
  ('Командна першість — OCTOBER FEST',  '2026-10-11 09:00:00+03', 500.00, '2026-10-05 23:59:00+03', 'october-2026');
