/**
 * D1 data-access layer. Prepared statements only; every value is bound as a parameter, so
 * homeowner input is always data and never SQL. No ORM. Rows are mapped explicitly.
 * Server-only.
 */
import type { SqlDatabase, SqlStatement } from './db.ts';

export interface LeadRow {
  id: string;
  submission_key: string;
  source: string;
  municipality: string;
  zip: string;
  problem_category: string;
  description: string | null;
  urgency: string;
  camera_inspection: string;
  decision_maker: string;
  created_at: string;
}

export interface ContactRow {
  id: string;
  lead_id: string;
  first_name: string;
  phone_input: string | null;
  phone_e164: string | null;
  email: string | null;
  email_normalized: string | null;
  preferred_contact: string;
  created_at: string;
}

export interface EventRow {
  id: string;
  lead_id: string;
  event_type: string;
  actor: string;
  payload_json: string;
  created_at: string;
}

export interface RouteRow {
  id: string;
  lead_id: string;
  outcome: string;
  partner_id: string | null;
  routing_rule_id: string | null;
  decision_snapshot_json: string;
  decided_at: string;
}

export interface OutcomeRow {
  id: string;
  lead_id: string;
  route_id: string | null;
  reported_by: string;
  first_contact_at: string | null;
  appointment_status: string | null;
  appointment_at: string | null;
  qualification: string | null;
  diagnosis: string | null;
  proposed_method: string | null;
  quote_band: string | null;
  result: string | null;
  lost_reason: string | null;
  final_method: string | null;
  final_project_value_cents: number | null;
  value_voluntarily_provided: number;
  completed_at: string | null;
  recorded_at: string;
}

export const insertLead = (db: SqlDatabase, r: LeadRow): SqlStatement =>
  db
    .prepare(
      `INSERT INTO leads (id, submission_key, source, municipality, zip, problem_category,
                          description, urgency, camera_inspection, decision_maker, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      r.id, r.submission_key, r.source, r.municipality, r.zip, r.problem_category,
      r.description, r.urgency, r.camera_inspection, r.decision_maker, r.created_at,
    );

export const insertContact = (db: SqlDatabase, r: ContactRow): SqlStatement =>
  db
    .prepare(
      `INSERT INTO lead_contacts (id, lead_id, first_name, phone_input, phone_e164, email,
                                  email_normalized, preferred_contact, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(r.id, r.lead_id, r.first_name, r.phone_input, r.phone_e164, r.email, r.email_normalized, r.preferred_contact, r.created_at);

export const insertConsent = (
  db: SqlDatabase,
  r: {
    id: string; lead_id: string; contact_id: string; consent_type: string; artifact_id: string;
    artifact_version: string; accepted: 0 | 1; accepted_at: string | null; capture_channel: string;
    capture_context: string | null; created_at: string;
  },
): SqlStatement =>
  db
    .prepare(
      `INSERT INTO consents (id, lead_id, contact_id, consent_type, artifact_id, artifact_version,
                             accepted, accepted_at, capture_channel, capture_context, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      r.id, r.lead_id, r.contact_id, r.consent_type, r.artifact_id, r.artifact_version,
      r.accepted, r.accepted_at, r.capture_channel, r.capture_context, r.created_at,
    );

export const insertEvent = (
  db: SqlDatabase,
  r: { id: string; lead_id: string; event_type: string; actor: string; payload: Record<string, unknown>; created_at: string },
): SqlStatement =>
  db
    .prepare(`INSERT INTO lead_events (id, lead_id, event_type, actor, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(r.id, r.lead_id, r.event_type, r.actor, JSON.stringify(r.payload), r.created_at);

export const insertRoute = (
  db: SqlDatabase,
  r: { id: string; lead_id: string; outcome: string; partner_id: string | null; routing_rule_id: string | null; snapshot: Record<string, unknown>; decided_at: string },
): SqlStatement =>
  db
    .prepare(
      `INSERT INTO lead_routes (id, lead_id, outcome, partner_id, routing_rule_id, decision_snapshot_json, decided_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(r.id, r.lead_id, r.outcome, r.partner_id, r.routing_rule_id, JSON.stringify(r.snapshot), r.decided_at);

export const insertOutcome = (db: SqlDatabase, r: OutcomeRow): SqlStatement =>
  db
    .prepare(
      `INSERT INTO lead_outcomes (id, lead_id, route_id, reported_by, first_contact_at, appointment_status,
                                  appointment_at, qualification, diagnosis, proposed_method, quote_band, result,
                                  lost_reason, final_method, final_project_value_cents, value_voluntarily_provided,
                                  completed_at, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      r.id, r.lead_id, r.route_id, r.reported_by, r.first_contact_at, r.appointment_status, r.appointment_at,
      r.qualification, r.diagnosis, r.proposed_method, r.quote_band, r.result, r.lost_reason, r.final_method,
      r.final_project_value_cents, r.value_voluntarily_provided, r.completed_at, r.recorded_at,
    );

export async function findLeadBySubmissionKey(db: SqlDatabase, submissionKey: string): Promise<LeadRow | null> {
  return db.prepare(`SELECT * FROM leads WHERE submission_key = ? LIMIT 1`).bind(submissionKey).first<LeadRow>();
}

export async function getLead(db: SqlDatabase, leadId: string): Promise<LeadRow | null> {
  return db.prepare(`SELECT * FROM leads WHERE id = ? LIMIT 1`).bind(leadId).first<LeadRow>();
}

export async function getContactByLead(db: SqlDatabase, leadId: string): Promise<ContactRow | null> {
  return db.prepare(`SELECT * FROM lead_contacts WHERE lead_id = ? LIMIT 1`).bind(leadId).first<ContactRow>();
}

export async function listEvents(db: SqlDatabase, leadId: string): Promise<EventRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM lead_events WHERE lead_id = ? ORDER BY created_at ASC, rowid ASC`)
    .bind(leadId)
    .all<EventRow>();
  return results;
}

export async function listRoutes(db: SqlDatabase, leadId: string): Promise<RouteRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM lead_routes WHERE lead_id = ? ORDER BY decided_at ASC, rowid ASC`)
    .bind(leadId)
    .all<RouteRow>();
  return results;
}

export async function listOutcomes(db: SqlDatabase, leadId: string): Promise<OutcomeRow[]> {
  const { results } = await db
    .prepare(`SELECT * FROM lead_outcomes WHERE lead_id = ? ORDER BY recorded_at ASC, rowid ASC`)
    .bind(leadId)
    .all<OutcomeRow>();
  return results;
}

/**
 * Leads the operator must look at: no active partner was available, or the delivery could not
 * be enqueued and has not since been enqueued.
 */
export async function listLeadsNeedingFollowUp(db: SqlDatabase): Promise<{ lead_id: string; reason: string }[]> {
  const { results } = await db
    .prepare(
      `SELECT l.id AS lead_id, 'no_active_partner' AS reason
         FROM leads l
         JOIN lead_routes r ON r.lead_id = l.id AND r.outcome = 'no_active_partner'
        UNION
       SELECT l.id AS lead_id, 'delivery_not_enqueued' AS reason
         FROM leads l
        WHERE EXISTS (SELECT 1 FROM lead_events e WHERE e.lead_id = l.id AND e.event_type = 'delivery_enqueue_failed')
          AND NOT EXISTS (SELECT 1 FROM lead_events e WHERE e.lead_id = l.id AND e.event_type = 'delivery_enqueued')
        ORDER BY lead_id`,
    )
    .all<{ lead_id: string; reason: string }>();
  return results;
}
