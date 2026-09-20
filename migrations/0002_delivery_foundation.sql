-- Migration 0002: delivery foundation (Phase 2C).
-- Smallest change needed to make queue-consumer notification delivery durable and idempotent.
-- It stays inside the logical domains already approved in docs/05 -> Lead Database Schema:
-- no new strategic domain is introduced.
--
-- 1. lead_events gains a durable idempotency key (UNIQUE) plus the delivery lifecycle event
--    types. Because SQLite cannot alter a CHECK constraint, the table is rebuilt and its rows
--    are copied; history stays append-only (the no-UPDATE trigger is recreated).
-- 2. partners gains notification-destination configuration (email / SMS), validated by triggers.
--    NO real contractor data is seeded here or anywhere else; tests use synthetic fixtures.
--
-- Still true after this migration: no remote D1 database exists, no partner row exists, no
-- notification provider is configured, and nothing is deployed.

CREATE TABLE lead_events_v2 (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'lead_created', 'consent_recorded', 'routing_evaluated', 'route_assigned', 'route_unavailable',
    'delivery_pending', 'delivery_enqueued', 'delivery_enqueue_failed', 'outcome_recorded',
    'delivery_attempt_started', 'delivery_succeeded', 'delivery_failed_retryable',
    'delivery_failed_permanent', 'delivery_duplicate_suppressed')),
  actor TEXT NOT NULL CHECK (actor IN ('system', 'operator', 'partner')),
  payload_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(payload_json) AND length(payload_json) <= 2000),
  -- Durable delivery idempotency. NULL for ordinary history rows; SQLite treats NULLs as
  -- distinct in a UNIQUE index, so only keyed rows are constrained.
  idempotency_key TEXT CHECK (idempotency_key IS NULL OR length(idempotency_key) BETWEEN 1 AND 200),
  created_at TEXT NOT NULL
);

INSERT INTO lead_events_v2 (id, lead_id, event_type, actor, payload_json, idempotency_key, created_at)
SELECT id, lead_id, event_type, actor, payload_json, NULL, created_at FROM lead_events;

DROP TRIGGER lead_events_no_update;

DROP TABLE lead_events;

ALTER TABLE lead_events_v2 RENAME TO lead_events;

CREATE INDEX idx_lead_events_lead ON lead_events (lead_id, created_at);
CREATE INDEX idx_lead_events_type ON lead_events (event_type, created_at);
CREATE UNIQUE INDEX idx_lead_events_idempotency ON lead_events (idempotency_key);

CREATE TRIGGER lead_events_no_update BEFORE UPDATE ON lead_events
BEGIN
  SELECT RAISE(ABORT, 'lead_events are append-only');
END;

-- Partner notification destinations. Columns are nullable and default to disabled, so the
-- migration cannot enable delivery for anyone.
ALTER TABLE partners ADD COLUMN notification_email TEXT;

ALTER TABLE partners ADD COLUMN notification_phone_e164 TEXT;

ALTER TABLE partners ADD COLUMN notify_email_enabled INTEGER NOT NULL DEFAULT 0;

ALTER TABLE partners ADD COLUMN notify_sms_enabled INTEGER NOT NULL DEFAULT 0;

-- ALTER TABLE ADD COLUMN cannot add table-level CHECKs, so the invariants are enforced by
-- triggers: a channel can only be enabled when it has a usable destination.
CREATE TRIGGER partners_notification_valid_insert BEFORE INSERT ON partners
BEGIN
  SELECT RAISE(ABORT, 'partner notification configuration is invalid')
  WHERE NEW.notify_email_enabled NOT IN (0, 1)
     OR NEW.notify_sms_enabled NOT IN (0, 1)
     OR (NEW.notify_email_enabled = 1 AND (NEW.notification_email IS NULL OR instr(NEW.notification_email, '@') < 2))
     OR (NEW.notify_sms_enabled = 1 AND (NEW.notification_phone_e164 IS NULL OR NEW.notification_phone_e164 NOT LIKE '+1%' OR length(NEW.notification_phone_e164) <> 12));
END;

CREATE TRIGGER partners_notification_valid_update BEFORE UPDATE ON partners
BEGIN
  SELECT RAISE(ABORT, 'partner notification configuration is invalid')
  WHERE NEW.notify_email_enabled NOT IN (0, 1)
     OR NEW.notify_sms_enabled NOT IN (0, 1)
     OR (NEW.notify_email_enabled = 1 AND (NEW.notification_email IS NULL OR instr(NEW.notification_email, '@') < 2))
     OR (NEW.notify_sms_enabled = 1 AND (NEW.notification_phone_e164 IS NULL OR NEW.notification_phone_e164 NOT LIKE '+1%' OR length(NEW.notification_phone_e164) <> 12));
END;
