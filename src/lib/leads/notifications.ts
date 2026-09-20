/**
 * Notification activation boundary and operational message templates.
 *
 * Notification delivery is DISABLED. It is deliberately governed by its own configuration, not
 * by the homeowner intake flag (docs/05 -> Privacy / Consent and Security): enabling lead
 * collection must never implicitly enable outbound sending, and vice versa.
 *
 * Activation fails closed. It requires explicit configuration that does not exist in this
 * repository (no Resend account or key, no Twilio account, token, or number), and synthetic
 * test values can never activate production.
 */
import { z } from 'zod';
import { TEST_CONSENT_ARTIFACT_PREFIX, type DeliveryChannel } from './contract.ts';
import type { SqlDatabase } from './db.ts';

export interface NotificationEnvironment {
  /** Must be exactly "true". */
  NOTIFICATIONS_ENABLED?: unknown;
  /** Resend API key (Worker secret; never committed). */
  RESEND_API_KEY?: unknown;
  /** Verified sending identity for the resource (not a contractor identity). */
  NOTIFICATION_FROM_EMAIL?: unknown;
  /** Operator mailbox used for fallback/follow-up notices. */
  OPERATOR_NOTIFICATION_EMAIL?: unknown;
  /** Optional SMS channel: all three are required together, or none. */
  TWILIO_ACCOUNT_SID?: unknown;
  TWILIO_AUTH_TOKEN?: unknown;
  TWILIO_FROM_NUMBER?: unknown;
  DB?: unknown;
  SITE_ENV?: unknown;
}

export interface NotificationActivation {
  enabled: boolean;
  reasons: string[];
  email: { from: string; operatorTo: string; apiKey: string } | null;
  sms: { accountSid: string; authToken: string; from: string } | null;
  db: SqlDatabase | null;
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const emailSchema = z.string().max(254).pipe(z.email());
const e164 = /^\+1\d{10}$/;

/** Markers that identify synthetic values. None of them may ever activate production. */
const TEST_VALUE_PATTERNS = [/^TEST-ONLY-/i, new RegExp(`^${TEST_CONSENT_ARTIFACT_PREFIX}`, 'i'), /^re_test_/i, /^FIXTURE-/i];
const TEST_DOMAIN_PATTERN = /@(?:[\w.-]+\.)?(?:invalid|example\.com|example\.org|test)$/i;

const isTestValue = (value: string): boolean => TEST_VALUE_PATTERNS.some((p) => p.test(value));

export function resolveNotificationActivation(env: NotificationEnvironment): NotificationActivation {
  const reasons: string[] = [];
  const production = str(env.SITE_ENV) === 'production';

  if (str(env.NOTIFICATIONS_ENABLED) !== 'true') reasons.push('NOTIFICATIONS_ENABLED is not "true"');

  const apiKey = str(env.RESEND_API_KEY);
  if (!apiKey) reasons.push('RESEND_API_KEY is missing');

  const from = str(env.NOTIFICATION_FROM_EMAIL);
  if (!emailSchema.safeParse(from).success) reasons.push('NOTIFICATION_FROM_EMAIL is missing or invalid');

  const operatorTo = str(env.OPERATOR_NOTIFICATION_EMAIL);
  if (!emailSchema.safeParse(operatorTo).success) reasons.push('OPERATOR_NOTIFICATION_EMAIL is missing or invalid');

  const db = env.DB as SqlDatabase | undefined;
  if (!db || typeof db.prepare !== 'function') reasons.push('D1 binding DB is missing');

  if (production) {
    if (apiKey && isTestValue(apiKey)) reasons.push('a test-only RESEND_API_KEY cannot be used in production');
    for (const [name, value] of [
      ['NOTIFICATION_FROM_EMAIL', from],
      ['OPERATOR_NOTIFICATION_EMAIL', operatorTo],
    ] as const) {
      if (value && (isTestValue(value) || TEST_DOMAIN_PATTERN.test(value))) {
        reasons.push(`a test-only ${name} cannot be used in production`);
      }
    }
  }

  // Optional SMS channel: configured completely, or not at all. Partial configuration is an
  // error rather than a silent downgrade.
  const accountSid = str(env.TWILIO_ACCOUNT_SID);
  const authToken = str(env.TWILIO_AUTH_TOKEN);
  const smsFrom = str(env.TWILIO_FROM_NUMBER);
  const smsParts = [accountSid, authToken, smsFrom].filter((v) => v.length > 0).length;
  let sms: NotificationActivation['sms'] = null;
  if (smsParts > 0 && smsParts < 3) {
    reasons.push('Twilio SMS configuration is incomplete (account SID, auth token, and from number are required together)');
  } else if (smsParts === 3) {
    if (!e164.test(smsFrom)) reasons.push('TWILIO_FROM_NUMBER must be E.164 (+1XXXXXXXXXX)');
    else if (production && (isTestValue(accountSid) || isTestValue(authToken))) {
      reasons.push('test-only Twilio credentials cannot be used in production');
    } else sms = { accountSid, authToken, from: smsFrom };
  }

  if (reasons.length > 0) return { enabled: false, reasons, email: null, sms: null, db: null };
  return { enabled: true, reasons: [], email: { from, operatorTo, apiKey }, sms, db: db ?? null };
}

/**
 * Minimal operational templates.
 *
 * Final partner-disclosure and homeowner-facing wording is OPEN pending legal review, so these
 * are explicitly marked non-production. They carry identifiers and an action prompt only: the
 * recipient retrieves homeowner details through the protected operational layer, so no contact
 * PII is handed to an email or SMS provider.
 */
export const TEST_TEMPLATE_MARKER = '[NON-PRODUCTION TEST TEMPLATE]';

/** Truthful sender framing: the resource is not a plumbing contractor (/AGENTS.md 4.2). */
const IDENTITY_LINE = 'Indy Sewer Resource is an independent information resource. It does not perform plumbing work.';

export interface NoticeContext {
  leadId: string;
  routeId: string;
  deliveryId: string;
  channel: DeliveryChannel;
}

export function renderPartnerLeadNotice(ctx: NoticeContext): { subject: string; text: string } {
  return {
    subject: `${TEST_TEMPLATE_MARKER} New sewer lead ${shortId(ctx.leadId)}`,
    text: [
      TEST_TEMPLATE_MARKER,
      'A homeowner request has been routed to you.',
      `Lead: ${ctx.leadId}`,
      `Route: ${ctx.routeId}`,
      `Delivery: ${ctx.deliveryId}`,
      'Homeowner contact details are available only through the protected operational layer.',
      IDENTITY_LINE,
    ].join('\n'),
  };
}

export function renderOperatorFallbackNotice(ctx: NoticeContext & { reason: string }): { subject: string; text: string } {
  return {
    subject: `${TEST_TEMPLATE_MARKER} Lead ${shortId(ctx.leadId)} needs operator follow-up`,
    text: [
      TEST_TEMPLATE_MARKER,
      'A lead could not be delivered to a partner and requires operator follow-up.',
      `Lead: ${ctx.leadId}`,
      `Route: ${ctx.routeId}`,
      `Delivery: ${ctx.deliveryId}`,
      `Reason: ${ctx.reason}`,
      IDENTITY_LINE,
    ].join('\n'),
  };
}

/** SMS carries identifiers and a prompt only; never homeowner details. */
export function renderLeadSms(ctx: NoticeContext & { kind: 'partner' | 'operator' }): string {
  const what = ctx.kind === 'partner' ? 'New routed lead' : 'Lead needs operator follow-up';
  return `${TEST_TEMPLATE_MARKER} ${what}. Lead ${shortId(ctx.leadId)} / delivery ${shortId(ctx.deliveryId)}. Open the operational console for details.`;
}

const shortId = (id: string): string => id.slice(0, 8);
