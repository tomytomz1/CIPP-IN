/**
 * Core lead intake service. Testable without any HTTP route, Worker, or network.
 *
 * Order of operations is fixed (docs/05 → Queue / Notification Reliability):
 *   persist lead (+ contact, consent, events, routing decision) -> then enqueue delivery.
 * The lead is never rolled back because the queue is unavailable; an enqueue failure is
 * recorded as an event so it can be retried and surfaced to the operator.
 */
import {
  TEST_CONSENT_ARTIFACT_PREFIX,
  leadIntakeSchema,
  leadQueueMessageSchema,
  normalizeUsPhone,
  type ConsentArtifact,
  type LeadIntake,
  type LeadQueue,
} from './contract.ts';
import { defaultRuntime, isUniqueViolation, type Runtime, type SqlDatabase } from './db.ts';
import { safeLog } from './log.ts';
import {
  findLeadBySubmissionKey,
  insertConsent,
  insertContact,
  insertEvent,
  insertLead,
  insertRoute,
  listRoutes,
} from './repository.ts';
import { decideRoute } from './routing.ts';

export interface IntakeOptions {
  db: SqlDatabase;
  /** Absent queue = nothing is enqueued; the lead is still persisted and flagged for follow-up. */
  queue?: LeadQueue | undefined;
  consentArtifact: ConsentArtifact;
  source?: 'web_form' | 'test';
  captureContext?: string | undefined;
  runtime?: Runtime;
}

export interface IntakeResult {
  leadId: string;
  routeId: string;
  routeOutcome: 'assigned' | 'no_active_partner';
  partnerId: string | null;
  /** True when this submission key already existed: no new lead was created. */
  duplicate: boolean;
  enqueued: boolean;
  enqueueError?: string;
}

export class IntakeValidationError extends Error {
  constructor(readonly issues: { path: string; message: string }[]) {
    super('lead intake validation failed');
    this.name = 'IntakeValidationError';
  }
}

/** Persists a validated lead and then attempts delivery enqueue. Input is parsed strictly. */
export async function submitLead(rawInput: unknown, options: IntakeOptions): Promise<IntakeResult> {
  const parsed = leadIntakeSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new IntakeValidationError(parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  const input: LeadIntake = parsed.data;
  const runtime = options.runtime ?? defaultRuntime;
  const db = options.db;
  const source = options.source ?? 'web_form';

  const existing = await findLeadBySubmissionKey(db, input.submissionKey);
  if (existing) return existingResult(db, existing.id);

  const now = runtime.now();
  const nowIso = now.toISOString();
  const leadId = runtime.newId();
  const contactId = runtime.newId();
  const routeId = runtime.newId();
  const deliveryId = runtime.newId();

  const decision = await decideRoute(db, { municipality: input.municipality, at: now });
  const phoneE164 = input.phone ? normalizeUsPhone(input.phone) : null;
  const email = input.email ?? null;

  const statements = [
    insertLead(db, {
      id: leadId,
      submission_key: input.submissionKey,
      source,
      municipality: input.municipality,
      zip: input.zip,
      problem_category: input.problemCategory,
      description: input.description ?? null,
      urgency: input.urgency,
      camera_inspection: input.cameraInspection,
      decision_maker: input.decisionMaker,
      created_at: nowIso,
    }),
    insertContact(db, {
      id: contactId,
      lead_id: leadId,
      first_name: input.firstName,
      phone_input: input.phone ?? null,
      phone_e164: phoneE164,
      email,
      email_normalized: email ? email.toLowerCase() : null,
      preferred_contact: input.preferredContact,
      created_at: nowIso,
    }),
    insertConsent(db, {
      id: runtime.newId(),
      lead_id: leadId,
      contact_id: contactId,
      consent_type: 'contractor_sharing',
      artifact_id: options.consentArtifact.artifactId,
      artifact_version: options.consentArtifact.artifactVersion,
      accepted: 1,
      accepted_at: nowIso,
      capture_channel: source,
      capture_context: options.captureContext ?? null,
      created_at: nowIso,
    }),
    insertEvent(db, {
      id: runtime.newId(),
      lead_id: leadId,
      event_type: 'lead_created',
      actor: 'system',
      payload: { source, municipality: input.municipality, problemCategory: input.problemCategory, urgency: input.urgency },
      created_at: nowIso,
    }),
    insertEvent(db, {
      id: runtime.newId(),
      lead_id: leadId,
      event_type: 'consent_recorded',
      actor: 'system',
      payload: {
        consentType: 'contractor_sharing',
        artifactId: options.consentArtifact.artifactId,
        artifactVersion: options.consentArtifact.artifactVersion,
        accepted: true,
      },
      created_at: nowIso,
    }),
    insertEvent(db, {
      id: runtime.newId(),
      lead_id: leadId,
      event_type: 'routing_evaluated',
      actor: 'system',
      payload: { outcome: decision.outcome, ...decision.snapshot },
      created_at: nowIso,
    }),
    insertRoute(db, {
      id: routeId,
      lead_id: leadId,
      outcome: decision.outcome,
      partner_id: decision.outcome === 'assigned' ? decision.partnerId : null,
      routing_rule_id: decision.outcome === 'assigned' ? decision.ruleId : null,
      snapshot: decision.snapshot,
      decided_at: nowIso,
    }),
    insertEvent(db, {
      id: runtime.newId(),
      lead_id: leadId,
      event_type: decision.outcome === 'assigned' ? 'route_assigned' : 'route_unavailable',
      actor: 'system',
      payload:
        decision.outcome === 'assigned'
          ? { routeId, partnerId: decision.partnerId, ruleId: decision.ruleId }
          : { routeId, reason: decision.reason },
      created_at: nowIso,
    }),
    insertEvent(db, {
      id: deliveryId,
      lead_id: leadId,
      event_type: 'delivery_pending',
      actor: 'system',
      payload: { routeId, kind: decision.outcome === 'assigned' ? 'deliver_to_partner' : 'operator_follow_up' },
      created_at: nowIso,
    }),
  ];

  try {
    // D1 batch = one transaction: either every row lands or none does.
    await db.batch(statements);
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Concurrent submission with the same idempotency key won the race.
      const winner = await findLeadBySubmissionKey(db, input.submissionKey);
      if (winner) return existingResult(db, winner.id);
    }
    throw err;
  }

  // Persistence is complete and durable. Anything below may fail without losing the lead.
  const message = leadQueueMessageSchema.parse({
    schemaVersion: 1,
    kind: decision.outcome === 'assigned' ? 'deliver_to_partner' : 'operator_follow_up',
    leadId,
    routeId,
    deliveryId,
  });

  const base: IntakeResult = {
    leadId,
    routeId,
    routeOutcome: decision.outcome,
    partnerId: decision.outcome === 'assigned' ? decision.partnerId : null,
    duplicate: false,
    enqueued: false,
  };

  if (!options.queue) {
    await appendDeliveryEvent(db, runtime, leadId, 'delivery_enqueue_failed', { deliveryId, reason: 'queue_unavailable' });
    safeLog('warn', 'lead.delivery.not_enqueued', { leadId, reason: 'queue_unavailable' });
    return { ...base, enqueueError: 'queue_unavailable' };
  }

  try {
    await options.queue.send(message);
  } catch (err) {
    const reason = err instanceof Error ? err.name || 'queue_send_failed' : 'queue_send_failed';
    await appendDeliveryEvent(db, runtime, leadId, 'delivery_enqueue_failed', { deliveryId, reason });
    safeLog('warn', 'lead.delivery.enqueue_failed', { leadId, reason });
    return { ...base, enqueueError: reason };
  }

  await appendDeliveryEvent(db, runtime, leadId, 'delivery_enqueued', { deliveryId });
  return { ...base, enqueued: true };
}

async function appendDeliveryEvent(
  db: SqlDatabase,
  runtime: Runtime,
  leadId: string,
  type: 'delivery_enqueued' | 'delivery_enqueue_failed',
  payload: Record<string, unknown>,
): Promise<void> {
  await insertEvent(db, {
    id: runtime.newId(),
    lead_id: leadId,
    event_type: type,
    actor: 'system',
    payload,
    created_at: runtime.now().toISOString(),
  }).run();
}

async function existingResult(db: SqlDatabase, leadId: string): Promise<IntakeResult> {
  const routes = await listRoutes(db, leadId);
  const route = routes[0];
  return {
    leadId,
    routeId: route?.id ?? '',
    routeOutcome: (route?.outcome as 'assigned' | 'no_active_partner') ?? 'no_active_partner',
    partnerId: route?.partner_id ?? null,
    duplicate: true,
    enqueued: false,
  };
}

/** True when the consent artifact is a synthetic/test artifact. Never allowed in production. */
export function isTestConsentArtifact(artifact: ConsentArtifact): boolean {
  return artifact.artifactId.startsWith(TEST_CONSENT_ARTIFACT_PREFIX);
}
