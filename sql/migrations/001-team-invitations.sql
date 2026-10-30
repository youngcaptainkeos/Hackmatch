-- Run once on existing HackMatch databases before deploying invitation support.
-- Existing rows remain participant-initiated applications. No data is deleted.
ALTER TABLE applications
  ADD COLUMN kind ENUM('application','invitation') NOT NULL DEFAULT 'application' AFTER message;
