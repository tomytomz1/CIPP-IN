/**
 * Operator follow-up queries (docs/05 -> Queue / Notification Reliability: "Failed deliveries are
 * retryable and visible to the operator").
 *
 * Data layer only: there is no admin UI in this phase. Results are safe structured records that
 * contain identifiers, reason codes, and timestamps — never homeowner contact details. Contact
 * PII is available only through an explicit, separate call, so an operator listing can never
 * leak it by accident.
 */
import type { SqlDatabase } from './db.ts';
import { getContactByLead, type ContactRow } from './repository.ts';

export type AttentionReason =
  | 'no_active_partner'
  | 'delivery_not_enqueued'
  | 'delivery_failed_permanently'
  | 'delivery_retry_pending';

export interface AttentionItem {
  leadId: string;
  reason: AttentionReason;
  /** Most recent time this lead entered the state, ISO-8601. */
  since: string;
  /** Enum-like detail code from the recorded event, when one exists. */
  detail: string | null;
}

/**
 * Leads that need a human: never routed, never enqueued, permanently undeliverable, or still
 * failing delivery. Ordered newest first.
 */
export async function listLeadsNeedingAttention(db: SqlDatabase): Promise<AttentionItem[]> {
  const { results } = await db
    .prepare(
      // A lead that never reached a partner needs a human even after the operator notice is
      // delivered, so this branch is not cleared by a successful notification.
      `SELECT l.id AS leadId, 'no_active_partner' AS reason, r.decided_at AS since, NULL AS detail
         FROM leads l
         JOIN lead_routes r ON r.lead_id = l.id AND r.outcome = 'no_active_partner'

        UNION ALL

       SELECT l.id AS leadId, 'delivery_not_enqueued' AS reason, MAX(e.created_at) AS since, NULL AS detail
         FROM leads l
         JOIN lead_events e ON e.lead_id = l.id AND e.event_type = 'delivery_enqueue_failed'
        WHERE NOT EXISTS (
          SELECT 1 FROM lead_events d WHERE d.lead_id = l.id AND d.event_type = 'delivery_enqueued')
        GROUP BY l.id

        UNION ALL

       SELECT l.id AS leadId, 'delivery_failed_permanently' AS reason, MAX(e.created_at) AS since,
              MAX(e.created_at || '|' || e.payload_json) AS detail
         FROM leads l
         JOIN lead_events e ON e.lead_id = l.id AND e.event_type = 'delivery_failed_permanent'
        GROUP BY l.id

        UNION ALL

       SELECT l.id AS leadId, 'delivery_retry_pending' AS reason, MAX(e.created_at) AS since, NULL AS detail
         FROM leads l
         JOIN lead_events e ON e.lead_id = l.id AND e.event_type = 'delivery_failed_retryable'
        WHERE NOT EXISTS (
          SELECT 1 FROM lead_events s WHERE s.lead_id = l.id AND s.event_type = 'delivery_succeeded')
          AND NOT EXISTS (
          SELECT 1 FROM lead_events t WHERE t.lead_id = l.id AND t.event_type = 'delivery_failed_permanent')
        GROUP BY l.id

        ORDER BY since DESC, leadId ASC`,
    )
    .all<{ leadId: string; reason: AttentionReason; since: string; detail: string | null }>();

  return results.map((row) => ({
    leadId: row.leadId,
    reason: row.reason,
    since: row.since,
    detail: extractReason(row.detail),
  }));
}

/**
 * Explicit contact lookup for the protected operational layer. Separate from the listing on
 * purpose: reading homeowner PII is always a deliberate, auditable call.
 */
export async function getLeadContactForOperator(db: SqlDatabase, leadId: string): Promise<ContactRow | null> {
  return getContactByLead(db, leadId);
}

/** Pulls the `reason` code out of the packed "<timestamp>|<payload json>" value, if present. */
function extractReason(packed: string | null): string | null {
  if (!packed) return null;
  const json = packed.slice(packed.indexOf('|') + 1);
  try {
    const value: unknown = JSON.parse(json);
    const reason = typeof value === 'object' && value !== null ? (value as Record<string, unknown>)['reason'] : null;
    return typeof reason === 'string' ? reason : null;
  } catch {
    return null;
  }
}
