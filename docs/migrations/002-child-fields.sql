-- Migration 002: add start number and attendance tracking per child
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS start_number INTEGER;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS is_present BOOLEAN;
