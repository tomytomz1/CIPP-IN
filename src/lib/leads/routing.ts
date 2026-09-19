/**
 * Configuration-driven partner routing (docs/05 → Partner / Renter Switching).
 * Selection is deterministic and reads only current configuration. The decision is snapshotted
 * into an immutable lead_routes row by the intake service, so changing the active renter later
 * affects future routing only.
 */
import type { SqlDatabase } from './db.ts';

export interface RoutingCandidate {
  ruleId: string;
  partnerId: string;
  partnerName: string;
  priority: number;
  municipality: string | null;
}

export type RoutingDecision =
  | { outcome: 'assigned'; ruleId: string; partnerId: string; snapshot: Record<string, unknown> }
  | { outcome: 'no_active_partner'; reason: string; snapshot: Record<string, unknown> };

/**
 * Picks the active rule of an active partner that is effective now, preferring a municipality-
 * specific rule over a catch-all, then lowest priority number, then oldest rule.
 */
export async function decideRoute(
  db: SqlDatabase,
  input: { municipality: string; at: Date },
): Promise<RoutingDecision> {
  const nowIso = input.at.toISOString();
  const { results } = await db
    .prepare(
      `SELECT r.id AS ruleId, r.partner_id AS partnerId, p.display_name AS partnerName,
              r.priority AS priority, r.municipality AS municipality
         FROM routing_rules r
         JOIN partners p ON p.id = r.partner_id
        WHERE r.status = 'active'
          AND p.status = 'active'
          AND r.effective_from <= ?1
          AND (r.effective_to IS NULL OR r.effective_to > ?1)
          AND (r.municipality IS NULL OR lower(r.municipality) = lower(?2))
        ORDER BY (r.municipality IS NULL) ASC, r.priority ASC, r.created_at ASC, r.id ASC
        LIMIT 1`,
    )
    .bind(nowIso, input.municipality)
    .all<RoutingCandidate>();

  const chosen = results[0];
  if (!chosen) {
    return {
      outcome: 'no_active_partner',
      reason: 'no active routing rule matched an active partner',
      snapshot: { evaluatedAt: nowIso, municipality: input.municipality, matchedRules: 0 },
    };
  }
  return {
    outcome: 'assigned',
    ruleId: chosen.ruleId,
    partnerId: chosen.partnerId,
    snapshot: {
      evaluatedAt: nowIso,
      municipality: input.municipality,
      ruleId: chosen.ruleId,
      rulePriority: chosen.priority,
      ruleMunicipality: chosen.municipality,
      partnerId: chosen.partnerId,
      partnerName: chosen.partnerName,
    },
  };
}
