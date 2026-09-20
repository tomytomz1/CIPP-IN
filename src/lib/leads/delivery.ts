/**
 * Queue consumer: delivers a routed lead notification, exactly once in practice.
 *
 * Completes the locked path (docs/05 -> Queue / Notification Reliability):
 *   persist lead -> route -> enqueue identifier-only message -> queue consumer -> provider
 *
 * Cloudflare Queues deliver at least once, so every step here is idempotent and durable:
 *
 *  1. The message is parsed strictly. It carries identifiers only; anything else is rejected.
 *  2. The lead, the delivery event, and the IMMUTABLE historical route are loaded from D1.
 *     Routing is never re-run: a lead is delivered to the partner chosen at intake time, or to
 *     nobody. A lead is never silently handed to a different contractor.
 *  3. Terminal state short-circuits: an existing success (or permanent failure) means no send.
 *  4. A durable claim row (UNIQUE idempotency key in lead_events) is inserted before sending, so
 *     a concurrent duplicate delivery loses the race and does not send.
 *  5. Only then is the provider called, with a stable provider-side idempotency key so an
 *     uncertain timeout cannot become a duplicate notification.
 *  6. The outcome is appended as history; nothing is ever overwritten.
 *
 * No provider is configured and no queue exists, so nothing in this file sends anything today.
 */
import { leadQueueMessageSchema, type DeliveryChannel, type LeadQueueMessage } from './contract.ts';
import { defaultRuntime, isUniqueViolation, type Runtime, type SqlDatabase } from './db.ts';
import { safeLog } from './log.ts';
import {
  renderLeadSms,
  renderOperatorFallbackNotice,
  renderPartnerLeadNotice,
  type NotificationActivation,
} from './notifications.ts';
import { getEvent, getLead, getPartner, getRoute, insertEvent, listDeliveryEvents } from './repository.ts';
import type { EmailProvider, ProviderSendResult, SmsProvider } from './providers/types.ts';

/**
 * Attempts after which a message stops being retried and becomes operator follow-up. The queue's
 * own `max_retries` (default 3) would otherwise delete the message permanently when no
 * dead-letter queue is configured, so the application records a durable terminal state first.
 */
export const MAX_DELIVERY_ATTEMPTS = 5;
/** An unfinished attempt is treated as in flight for this long before another worker may retry. */
export const ATTEMPT_LEASE_SECONDS = 120;
/** Backoff used when asking the queue to redeliver. */
export const RETRY_DELAY_SECONDS = [30, 60, 300, 900, 1800] as const;

export type DeliveryStatus = 'delivered' | 'duplicate' | 'retry' | 'terminal';

export interface DeliveryOutcome {
  status: DeliveryStatus;
  /** Enum-like reason code. Never free text, never homeowner data. */
  reason: string;
  channel?: DeliveryChannel;
  retryDelaySeconds?: number;
}

export interface DeliveryDeps {
  db: SqlDatabase;
  activation: NotificationActivation;
  email?: EmailProvider | undefined;
  sms?: SmsProvider | undefined;
  runtime?: Runtime;
  /** Queue-reported attempt count (Cloudflare `message.attempts` starts at 1). */
  attempt?: number;
}

const EVENT = {
  started: 'delivery_attempt_started',
  succeeded: 'delivery_succeeded',
  failed: 'delivery_failed_retryable',
  terminal: 'delivery_failed_permanent',
  duplicate: 'delivery_duplicate_suppressed',
} as const;

/** Keys are stable per delivery + channel, so duplicates collide in the database. */
const claimKey = (deliveryId: string, channel: DeliveryChannel, lease: number): string =>
  `claim:${deliveryId}:${channel}:${lease}`;
const successKey = (deliveryId: string, channel: DeliveryChannel): string => `success:${deliveryId}:${channel}`;
const terminalKey = (deliveryId: string, channel: DeliveryChannel): string => `terminal:${deliveryId}:${channel}`;
/** Provider-side idempotency key: stable across retries of the same logical delivery. */
export const providerIdempotencyKey = (deliveryId: string, channel: DeliveryChannel): string =>
  `isr-delivery-${deliveryId}-${channel}`;

/** Processes one queue message. Never throws for expected failures; always returns an outcome. */
export async function processDeliveryMessage(raw: unknown, deps: DeliveryDeps): Promise<DeliveryOutcome> {
  const runtime = deps.runtime ?? defaultRuntime;
  const db = deps.db;
  const attempt = deps.attempt ?? 1;

  // 1. Strict contract. Unknown fields (including any PII a producer might add) are rejected,
  // and a malformed message never touches lead data.
  const parsed = leadQueueMessageSchema.safeParse(raw);
  if (!parsed.success) {
    safeLog('warn', 'lead.delivery.malformed_message', { reason: 'schema_rejected', count: parsed.error.issues.length });
    return { status: 'terminal', reason: 'malformed_message' };
  }
  const message: LeadQueueMessage = parsed.data;

  if (!deps.activation.enabled || !deps.activation.email) {
    safeLog('warn', 'lead.delivery.disabled', { deliveryId: message.deliveryId, count: deps.activation.reasons.length });
    return { status: 'retry', reason: 'notifications_disabled', retryDelaySeconds: retryDelay(attempt) };
  }

  // 2. Durable context. Everything is read from D1 by identifier; nothing comes from the message.
  const lead = await getLead(db, message.leadId);
  if (!lead) {
    safeLog('warn', 'lead.delivery.unknown_lead', { leadId: message.leadId, deliveryId: message.deliveryId });
    return { status: 'terminal', reason: 'lead_not_found' };
  }
  const deliveryEvent = await getEvent(db, message.deliveryId);
  if (!deliveryEvent || deliveryEvent.lead_id !== message.leadId || deliveryEvent.event_type !== 'delivery_pending') {
    safeLog('warn', 'lead.delivery.unknown_delivery', { leadId: message.leadId, deliveryId: message.deliveryId });
    return { status: 'terminal', reason: 'delivery_not_found' };
  }
  const route = await getRoute(db, message.routeId);
  if (!route || route.lead_id !== message.leadId) {
    // The historical route is missing or does not belong to this lead: never re-route, never
    // guess a contractor. Record durable follow-up state instead.
    return finish(db, runtime, message, 'email', EVENT.terminal, {
      reason: 'route_not_found',
      operatorFollowUp: true,
    });
  }

  // 3. Historical route only. Partner identity comes from the immutable routing decision.
  const resolution = await resolveDestination(db, route, deps);
  if (!resolution.ok) {
    return finish(db, runtime, message, resolution.channel, EVENT.terminal, {
      reason: resolution.reason,
      operatorFollowUp: true,
    });
  }
  const channel = resolution.channel;

  // 4. Idempotency: durable terminal states short-circuit before any provider call.
  const history = await listDeliveryEvents(db, message.deliveryId);
  const relevant = history.filter((e) => (payloadOf(e)['channel'] ?? channel) === channel);
  if (relevant.some((e) => e.event_type === EVENT.succeeded)) {
    await appendEvent(db, runtime, message, EVENT.duplicate, { channel, reason: 'already_delivered' });
    safeLog('info', 'lead.delivery.duplicate_suppressed', { deliveryId: message.deliveryId, channel });
    return { status: 'duplicate', reason: 'already_delivered', channel };
  }
  if (relevant.some((e) => e.event_type === EVENT.terminal)) {
    return { status: 'terminal', reason: 'already_failed_permanently', channel };
  }

  // Out of attempts: stop retrying and hand the lead to the operator (no infinite retry loop,
  // and no reliance on a dead-letter queue that does not exist yet).
  if (attempt > MAX_DELIVERY_ATTEMPTS) {
    return finish(db, runtime, message, channel, EVENT.terminal, { reason: 'max_attempts_exhausted', operatorFollowUp: true });
  }

  // 5. Claim the attempt. A concurrent duplicate loses the UNIQUE race and does not send.
  const started = relevant.filter((e) => e.event_type === EVENT.started);
  const settled = relevant.filter((e) => e.event_type === EVENT.failed).length;
  const lastStarted = started[started.length - 1];
  if (lastStarted && started.length > settled) {
    const ageSeconds = (runtime.now().getTime() - Date.parse(lastStarted.created_at)) / 1000;
    if (ageSeconds < ATTEMPT_LEASE_SECONDS) {
      safeLog('info', 'lead.delivery.in_flight', { deliveryId: message.deliveryId, channel, attempt });
      return { status: 'retry', reason: 'attempt_in_flight', channel, retryDelaySeconds: retryDelay(attempt) };
    }
  }

  const lease = started.length;
  try {
    await appendEvent(db, runtime, message, EVENT.started, { channel, attempt, lease }, claimKey(message.deliveryId, channel, lease));
  } catch (err) {
    if (isUniqueViolation(err)) {
      safeLog('info', 'lead.delivery.claim_lost', { deliveryId: message.deliveryId, channel });
      return { status: 'retry', reason: 'claim_lost', channel, retryDelaySeconds: retryDelay(attempt) };
    }
    throw err;
  }

  // 6. Send. The provider idempotency key is stable, so an uncertain response cannot duplicate.
  const result = await send(message, route, resolution, deps);

  if (result.ok) {
    await appendEvent(
      db,
      runtime,
      message,
      EVENT.succeeded,
      { channel, attempt, provider: resolution.providerName, providerMessageId: result.providerMessageId },
      successKey(message.deliveryId, channel),
    );
    safeLog('info', 'lead.delivery.succeeded', { deliveryId: message.deliveryId, channel, attempt });
    return { status: 'delivered', reason: 'provider_accepted', channel };
  }

  if (result.retryable && attempt < MAX_DELIVERY_ATTEMPTS) {
    await appendEvent(db, runtime, message, EVENT.failed, { channel, attempt, reason: result.code });
    safeLog('warn', 'lead.delivery.retryable_failure', { deliveryId: message.deliveryId, channel, reason: result.code });
    return { status: 'retry', reason: result.code, channel, retryDelaySeconds: retryDelay(attempt) };
  }

  await appendEvent(db, runtime, message, EVENT.failed, { channel, attempt, reason: result.code });
  return finish(db, runtime, message, channel, EVENT.terminal, {
    reason: result.retryable ? 'max_attempts_exhausted' : result.code,
    operatorFollowUp: true,
  });
}

/**
 * Cloudflare Queues consumer entry point. Matches the documented `queue(batch, env, ctx)`
 * handler shape; wiring it to a real queue requires infrastructure that does not exist yet
 * (see docs/05 -> Implementation Record: Phase 2C).
 */
export interface QueueLikeMessage {
  readonly id?: string;
  readonly body: unknown;
  readonly attempts?: number;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

export interface QueueLikeBatch {
  readonly messages: readonly QueueLikeMessage[];
}

export async function handleDeliveryBatch(
  batch: QueueLikeBatch,
  deps: Omit<DeliveryDeps, 'attempt'>,
): Promise<DeliveryOutcome[]> {
  const outcomes: DeliveryOutcome[] = [];
  for (const message of batch.messages) {
    let outcome: DeliveryOutcome;
    try {
      outcome = await processDeliveryMessage(message.body, { ...deps, attempt: message.attempts ?? 1 });
    } catch (err) {
      // Unexpected failure (for example D1 unavailable): keep the message, never drop a lead.
      safeLog('error', 'lead.delivery.unexpected_error', { reason: err instanceof Error ? err.name : 'unknown' });
      outcome = { status: 'retry', reason: 'unexpected_error', retryDelaySeconds: retryDelay(message.attempts ?? 1) };
    }
    if (outcome.status === 'retry') message.retry({ delaySeconds: outcome.retryDelaySeconds ?? RETRY_DELAY_SECONDS[0] });
    else message.ack();
    outcomes.push(outcome);
  }
  return outcomes;
}

type Destination =
  | {
      ok: true;
      channel: DeliveryChannel;
      kind: 'partner' | 'operator';
      providerName: string;
      emailTo?: string;
      smsTo?: string;
    }
  | { ok: false; channel: DeliveryChannel; reason: string };

/** Resolves where this notification goes, using the historical route's partner only. */
async function resolveDestination(db: SqlDatabase, route: { outcome: string; partner_id: string | null }, deps: DeliveryDeps): Promise<Destination> {
  const email = deps.activation.email;
  if (!email) return { ok: false, channel: 'email', reason: 'notifications_disabled' };

  // No partner was active at intake time: this is an operator follow-up, not a reroute.
  if (route.outcome !== 'assigned' || !route.partner_id) {
    return { ok: true, channel: 'email', kind: 'operator', providerName: deps.email?.name ?? 'none', emailTo: email.operatorTo };
  }

  const partner = await getPartner(db, route.partner_id);
  if (!partner) return { ok: false, channel: 'email', reason: 'partner_missing' };
  // The partner recorded in history is no longer active, or has no usable destination. Fail to
  // operator follow-up; never substitute a different contractor.
  if (partner.status !== 'active') return { ok: false, channel: 'email', reason: 'partner_inactive' };
  if (partner.notify_email_enabled === 1 && partner.notification_email) {
    return { ok: true, channel: 'email', kind: 'partner', providerName: deps.email?.name ?? 'none', emailTo: partner.notification_email };
  }
  if (partner.notify_sms_enabled === 1 && partner.notification_phone_e164 && deps.sms && deps.activation.sms) {
    return { ok: true, channel: 'sms', kind: 'partner', providerName: deps.sms.name, smsTo: partner.notification_phone_e164 };
  }
  return { ok: false, channel: 'email', reason: 'partner_notification_unconfigured' };
}

async function send(
  message: LeadQueueMessage,
  route: { outcome: string },
  destination: Extract<Destination, { ok: true }>,
  deps: DeliveryDeps,
): Promise<ProviderSendResult> {
  const ctx = { leadId: message.leadId, routeId: message.routeId, deliveryId: message.deliveryId, channel: destination.channel };
  const idempotencyKey = providerIdempotencyKey(message.deliveryId, destination.channel);

  if (destination.channel === 'sms') {
    if (!deps.sms || !deps.activation.sms) return { ok: false, retryable: false, code: 'sms_not_configured' };
    return deps.sms.send({
      to: destination.smsTo ?? '',
      from: deps.activation.sms.from,
      body: renderLeadSms({ ...ctx, kind: destination.kind }),
      idempotencyKey,
    });
  }

  if (!deps.email || !deps.activation.email) return { ok: false, retryable: false, code: 'email_not_configured' };
  const content =
    destination.kind === 'partner'
      ? renderPartnerLeadNotice(ctx)
      : renderOperatorFallbackNotice({ ...ctx, reason: route.outcome === 'assigned' ? 'delivery_fallback' : 'no_active_partner' });
  return deps.email.send({
    from: deps.activation.email.from,
    to: destination.emailTo ?? deps.activation.email.operatorTo,
    subject: content.subject,
    text: content.text,
    idempotencyKey,
  });
}

/** Records a durable terminal state (and therefore operator follow-up) exactly once. */
async function finish(
  db: SqlDatabase,
  runtime: Runtime,
  message: LeadQueueMessage,
  channel: DeliveryChannel,
  type: typeof EVENT.terminal,
  payload: { reason: string; operatorFollowUp: boolean },
): Promise<DeliveryOutcome> {
  try {
    await appendEvent(db, runtime, message, type, { channel, ...payload }, terminalKey(message.deliveryId, channel));
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
  }
  safeLog('warn', 'lead.delivery.permanent_failure', { deliveryId: message.deliveryId, channel, reason: payload.reason });
  return { status: 'terminal', reason: payload.reason, channel };
}

async function appendEvent(
  db: SqlDatabase,
  runtime: Runtime,
  message: LeadQueueMessage,
  type: string,
  payload: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<void> {
  await insertEvent(db, {
    id: runtime.newId(),
    lead_id: message.leadId,
    event_type: type,
    actor: 'system',
    // Identifiers and reason codes only: event payloads never carry homeowner contact details.
    payload: { deliveryId: message.deliveryId, routeId: message.routeId, ...payload },
    created_at: runtime.now().toISOString(),
    idempotency_key: idempotencyKey ?? null,
  }).run();
}

const payloadOf = (event: { payload_json: string }): Record<string, unknown> => {
  try {
    const value: unknown = JSON.parse(event.payload_json);
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const retryDelay = (attempt: number): number =>
  RETRY_DELAY_SECONDS[Math.min(Math.max(attempt, 1), RETRY_DELAY_SECONDS.length) - 1] ?? RETRY_DELAY_SECONDS[0];
