-- Migration 0001: lead-data foundation (Phase 2B).
-- Implements the logical domains in docs/05-BUILD-SPEC.md → Lead Database Schema.
--
-- Principles:
--   * Contact PII lives only in lead_contacts; leads holds non-contact intake fields.
--   * Lifecycle history is append-only: consents, lead_events, lead_routes, and lead_outcomes
--     reject UPDATE via triggers. Deletion is NOT blocked, because retention/deletion policy
--     is still OPEN (legal review) and future lawful deletion must remain possible.
--   * Routing is configuration-driven (partners, routing_rules); every decision is snapshotted
--     in an immutable lead_routes row, so changing partners never rewrites history.
--   * Call recording is structurally impossible (CHECK recording_enabled = 0).
--   * Uploads store metadata only; there is no column for file content.
--   * No seed data. No real partner, contractor, or homeowner data.
--
-- Statement convention (for the local migration runner): every statement ends with ';' at the
-- end of a line; trigger bodies are delimited by a line ending in BEGIN and a line "END;".

CREATE TABLE partners (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 120),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE routing_rules (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  priority INTEGER NOT NULL CHECK (priority >= 0),
  -- NULL municipality = applies to every municipality.
  municipality TEXT CHECK (municipality IS NULL OR length(municipality) BETWEEN 1 AND 80),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  created_at TEXT NOT NULL,
  CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX idx_routing_rules_selection ON routing_rules (status, priority, created_at);
CREATE INDEX idx_routing_rules_partner ON routing_rules (partner_id);

CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  -- Client-generated idempotency key; UNIQUE makes retries and races resolve to one lead.
  submission_key TEXT NOT NULL UNIQUE CHECK (length(submission_key) BETWEEN 16 AND 64),
  source TEXT NOT NULL CHECK (source IN ('web_form', 'test')),
  municipality TEXT NOT NULL CHECK (length(municipality) BETWEEN 1 AND 80),
  zip TEXT NOT NULL CHECK (length(zip) IN (5, 10)),
  problem_category TEXT NOT NULL CHECK (problem_category IN (
    'backup_or_slow_drains', 'root_intrusion', 'camera_found_defect',
    'break_or_collapse', 'under_driveway_or_foundation', 'repair_quote_comparison', 'other')),
  description TEXT CHECK (description IS NULL OR length(description) <= 1000),
  urgency TEXT NOT NULL CHECK (urgency IN ('emergency_now', 'within_days', 'within_weeks', 'researching')),
  camera_inspection TEXT NOT NULL CHECK (camera_inspection IN ('yes', 'no', 'unsure')),
  decision_maker TEXT NOT NULL CHECK (decision_maker IN (
    'homeowner_decision_maker', 'homeowner_shared_decision', 'not_homeowner')),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_leads_created_at ON leads (created_at);
CREATE INDEX idx_leads_municipality ON leads (municipality, created_at);

-- Contact PII. One row per lead. At least one contact channel is required.
CREATE TABLE lead_contacts (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL UNIQUE REFERENCES leads(id),
  first_name TEXT NOT NULL CHECK (length(first_name) BETWEEN 1 AND 60),
  phone_input TEXT CHECK (phone_input IS NULL OR length(phone_input) <= 32),
  phone_e164 TEXT CHECK (phone_e164 IS NULL OR (phone_e164 LIKE '+1%' AND length(phone_e164) = 12)),
  email TEXT CHECK (email IS NULL OR length(email) <= 254),
  email_normalized TEXT CHECK (email_normalized IS NULL OR length(email_normalized) <= 254),
  preferred_contact TEXT NOT NULL CHECK (preferred_contact IN ('phone', 'text', 'email')),
  created_at TEXT NOT NULL,
  CHECK (phone_e164 IS NOT NULL OR email_normalized IS NOT NULL),
  CHECK (preferred_contact <> 'email' OR email_normalized IS NOT NULL),
  CHECK (preferred_contact = 'email' OR phone_e164 IS NOT NULL)
);

-- Consent audit records. The artifact id/version identify what was presented; the legal text
-- itself is NOT stored here (legal wording is OPEN pending review).
CREATE TABLE consents (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  contact_id TEXT NOT NULL REFERENCES lead_contacts(id),
  consent_type TEXT NOT NULL CHECK (consent_type IN ('contractor_sharing')),
  artifact_id TEXT NOT NULL CHECK (length(artifact_id) BETWEEN 1 AND 100),
  artifact_version TEXT NOT NULL CHECK (length(artifact_version) BETWEEN 1 AND 40),
  accepted INTEGER NOT NULL CHECK (accepted IN (0, 1)),
  accepted_at TEXT,
  capture_channel TEXT NOT NULL CHECK (capture_channel IN ('web_form', 'test')),
  capture_context TEXT CHECK (capture_context IS NULL OR length(capture_context) <= 200),
  created_at TEXT NOT NULL,
  CHECK (accepted = 0 OR accepted_at IS NOT NULL)
);
CREATE INDEX idx_consents_lead ON consents (lead_id);

-- Append-only lifecycle history. Payloads are structured JSON and must not carry contact PII
-- (enforced in the application layer; see src/lib/leads/events.ts).
CREATE TABLE lead_events (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'lead_created', 'consent_recorded', 'routing_evaluated', 'route_assigned', 'route_unavailable',
    'delivery_pending', 'delivery_enqueued', 'delivery_enqueue_failed', 'outcome_recorded')),
  actor TEXT NOT NULL CHECK (actor IN ('system', 'operator', 'partner')),
  payload_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(payload_json) AND length(payload_json) <= 2000),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_lead_events_lead ON lead_events (lead_id, created_at);
CREATE INDEX idx_lead_events_type ON lead_events (event_type, created_at);

-- Immutable routing decisions, with a snapshot of the rule/partner used at the time.
CREATE TABLE lead_routes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  outcome TEXT NOT NULL CHECK (outcome IN ('assigned', 'no_active_partner')),
  partner_id TEXT REFERENCES partners(id),
  routing_rule_id TEXT REFERENCES routing_rules(id),
  decision_snapshot_json TEXT NOT NULL CHECK (json_valid(decision_snapshot_json)),
  decided_at TEXT NOT NULL,
  CHECK ((outcome = 'assigned' AND partner_id IS NOT NULL AND routing_rule_id IS NOT NULL)
      OR (outcome = 'no_active_partner' AND partner_id IS NULL AND routing_rule_id IS NULL))
);
CREATE INDEX idx_lead_routes_lead ON lead_routes (lead_id, decided_at);
CREATE INDEX idx_lead_routes_partner ON lead_routes (partner_id, decided_at);
CREATE INDEX idx_lead_routes_outcome ON lead_routes (outcome, decided_at);

-- Append-only outcome entries (contractor/operator enrichment). Each entry records only the
-- fields reported at that time; the current view is derived, never overwritten.
CREATE TABLE lead_outcomes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  route_id TEXT REFERENCES lead_routes(id),
  reported_by TEXT NOT NULL CHECK (reported_by IN ('operator', 'partner')),
  first_contact_at TEXT,
  appointment_status TEXT CHECK (appointment_status IS NULL OR appointment_status IN ('scheduled', 'held', 'cancelled', 'no_show')),
  appointment_at TEXT,
  qualification TEXT CHECK (qualification IS NULL OR qualification IN ('qualified', 'unqualified')),
  diagnosis TEXT CHECK (diagnosis IS NULL OR length(diagnosis) <= 500),
  proposed_method TEXT CHECK (proposed_method IS NULL OR proposed_method IN (
    'cipp_lining', 'sectional_point_liner', 'pipe_bursting', 'open_cut_excavation', 'spot_repair', 'cleaning_only', 'other', 'none')),
  quote_band TEXT CHECK (quote_band IS NULL OR quote_band IN (
    'under_5k', '5k_10k', '10k_20k', '20k_35k', 'over_35k', 'not_provided')),
  result TEXT CHECK (result IS NULL OR result IN ('open', 'won', 'lost')),
  lost_reason TEXT CHECK (lost_reason IS NULL OR length(lost_reason) <= 300),
  final_method TEXT CHECK (final_method IS NULL OR final_method IN (
    'cipp_lining', 'sectional_point_liner', 'pipe_bursting', 'open_cut_excavation', 'spot_repair', 'cleaning_only', 'other', 'none')),
  final_project_value_cents INTEGER CHECK (final_project_value_cents IS NULL OR final_project_value_cents >= 0),
  value_voluntarily_provided INTEGER NOT NULL DEFAULT 0 CHECK (value_voluntarily_provided IN (0, 1)),
  completed_at TEXT,
  recorded_at TEXT NOT NULL,
  CHECK (final_project_value_cents IS NULL OR value_voluntarily_provided = 1),
  CHECK (lost_reason IS NULL OR result = 'lost')
);
CREATE INDEX idx_lead_outcomes_lead ON lead_outcomes (lead_id, recorded_at);

-- Future call tracking metadata (not active). Recording is structurally disabled.
CREATE TABLE calls (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('twilio')),
  provider_call_id TEXT NOT NULL UNIQUE CHECK (length(provider_call_id) BETWEEN 1 AND 64),
  lead_id TEXT REFERENCES leads(id),
  partner_id TEXT REFERENCES partners(id),
  route_id TEXT REFERENCES lead_routes(id),
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  disposition TEXT CHECK (disposition IS NULL OR disposition IN (
    'answered', 'missed', 'voicemail', 'busy', 'failed', 'spam')),
  recording_enabled INTEGER NOT NULL DEFAULT 0 CHECK (recording_enabled = 0),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_calls_started ON calls (started_at);
CREATE INDEX idx_calls_partner ON calls (partner_id, started_at);

-- Future upload metadata (camera media is feature-controlled OFF). No file content column.
CREATE TABLE uploads (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id),
  storage_key TEXT NOT NULL UNIQUE CHECK (length(storage_key) BETWEEN 1 AND 200),
  category TEXT NOT NULL CHECK (category IN ('camera_image', 'camera_video', 'camera_report')),
  media_type TEXT NOT NULL CHECK (media_type IN (
    'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf')),
  byte_size INTEGER CHECK (byte_size IS NULL OR byte_size >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'stored', 'rejected')),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_uploads_lead ON uploads (lead_id);

CREATE TRIGGER consents_no_update BEFORE UPDATE ON consents
BEGIN
  SELECT RAISE(ABORT, 'consents are append-only');
END;

CREATE TRIGGER lead_events_no_update BEFORE UPDATE ON lead_events
BEGIN
  SELECT RAISE(ABORT, 'lead_events are append-only');
END;

CREATE TRIGGER lead_routes_no_update BEFORE UPDATE ON lead_routes
BEGIN
  SELECT RAISE(ABORT, 'lead_routes are immutable');
END;

CREATE TRIGGER lead_outcomes_no_update BEFORE UPDATE ON lead_outcomes
BEGIN
  SELECT RAISE(ABORT, 'lead_outcomes are append-only');
END;
