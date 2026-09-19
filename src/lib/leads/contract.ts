/**
 * Strict server-side contracts for the lead backend (docs/05 → Lead Funnel, Lead Database Schema).
 * Unknown fields are rejected everywhere. The public intake contract contains ONLY the approved
 * minimum fields; enrichment is separate and never part of intake.
 */
import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().min(1).max(max);
/** Letters (incl. accented), spaces, apostrophes, hyphens, periods. */
const nameLike = (max: number) =>
  trimmed(max).regex(/^[\p{L}][\p{L} .'’-]*$/u, 'contains unsupported characters');

export const PROBLEM_CATEGORIES = [
  'backup_or_slow_drains',
  'root_intrusion',
  'camera_found_defect',
  'break_or_collapse',
  'under_driveway_or_foundation',
  'repair_quote_comparison',
  'other',
] as const;
export const URGENCY = ['emergency_now', 'within_days', 'within_weeks', 'researching'] as const;
export const CAMERA_INSPECTION = ['yes', 'no', 'unsure'] as const;
export const DECISION_MAKER = ['homeowner_decision_maker', 'homeowner_shared_decision', 'not_homeowner'] as const;
export const PREFERRED_CONTACT = ['phone', 'text', 'email'] as const;

/** US phone: 10 digits, optionally prefixed with country code 1. Returns E.164 or null. */
export function normalizeUsPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  // NANP: area code and exchange cannot start with 0 or 1.
  if (/^[01]/.test(national) || /^[01]/.test(national.slice(3))) return null;
  return `+1${national}`;
}

export const leadIntakeSchema = z
  .strictObject({
    /** Client-generated idempotency key (UUID). Retries reuse it; a new submission uses a new one. */
    submissionKey: z.uuid(),
    firstName: nameLike(60),
    phone: trimmed(32).optional(),
    email: z.string().trim().max(254).pipe(z.email()).optional(),
    preferredContact: z.enum(PREFERRED_CONTACT),
    municipality: nameLike(80),
    zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'ZIP must be 5 digits or ZIP+4'),
    problemCategory: z.enum(PROBLEM_CATEGORIES),
    description: z.string().trim().max(1000).optional(),
    urgency: z.enum(URGENCY),
    cameraInspection: z.enum(CAMERA_INSPECTION),
    decisionMaker: z.enum(DECISION_MAKER),
    /** Explicit acceptance of the (legally reviewed, OPEN) contractor-sharing consent. */
    sharingConsentAccepted: z.literal(true, { error: 'contractor-sharing consent must be explicitly accepted' }),
  })
  .superRefine((v, ctx) => {
    if (!v.phone && !v.email) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'at least one of phone or email is required' });
    }
    if (v.phone && normalizeUsPhone(v.phone) === null) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'phone must be a valid US number' });
    }
    if (v.preferredContact === 'email' && !v.email) {
      ctx.addIssue({ code: 'custom', path: ['preferredContact'], message: 'email preferred but no email given' });
    }
    if (v.preferredContact !== 'email' && !v.phone) {
      ctx.addIssue({ code: 'custom', path: ['preferredContact'], message: `${v.preferredContact} preferred but no phone given` });
    }
  });
export type LeadIntake = z.infer<typeof leadIntakeSchema>;

/**
 * The consent artifact presented to the homeowner. Supplied by server configuration, never by
 * the client. No production artifact exists yet (legal wording is OPEN).
 */
export const consentArtifactSchema = z.strictObject({
  artifactId: trimmed(100),
  artifactVersion: trimmed(40),
});
export type ConsentArtifact = z.infer<typeof consentArtifactSchema>;
/** Prefix every synthetic/test consent artifact must carry; rejected in production activation. */
export const TEST_CONSENT_ARTIFACT_PREFIX = 'TEST-ONLY-';

/**
 * Queue message contract. Identifiers only: no names, phone numbers, emails, or descriptions.
 * The consumer reads what it needs from D1 server-side.
 */
export const leadQueueMessageSchema = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.enum(['deliver_to_partner', 'operator_follow_up']),
  leadId: z.uuid(),
  routeId: z.uuid(),
  deliveryId: z.uuid(),
});
export type LeadQueueMessage = z.infer<typeof leadQueueMessageSchema>;

/** Producer side of the future Cloudflare Queue binding (same shape as Queue#send). */
export interface LeadQueue {
  send(message: LeadQueueMessage): Promise<void>;
}

const optionalIso = z.iso.datetime({ offset: true }).optional();
const REPAIR_METHODS = [
  'cipp_lining', 'sectional_point_liner', 'pipe_bursting', 'open_cut_excavation', 'spot_repair', 'cleaning_only', 'other', 'none',
] as const;

/** Contractor/operator outcome entry. Every field optional; nothing is required or inferred. */
export const outcomeEntrySchema = z
  .strictObject({
    leadId: z.uuid(),
    routeId: z.uuid().optional(),
    reportedBy: z.enum(['operator', 'partner']),
    firstContactAt: optionalIso,
    appointmentStatus: z.enum(['scheduled', 'held', 'cancelled', 'no_show']).optional(),
    appointmentAt: optionalIso,
    qualification: z.enum(['qualified', 'unqualified']).optional(),
    diagnosis: z.string().trim().max(500).optional(),
    proposedMethod: z.enum(REPAIR_METHODS).optional(),
    quoteBand: z.enum(['under_5k', '5k_10k', '10k_20k', '20k_35k', 'over_35k', 'not_provided']).optional(),
    result: z.enum(['open', 'won', 'lost']).optional(),
    lostReason: z.string().trim().max(300).optional(),
    finalMethod: z.enum(REPAIR_METHODS).optional(),
    /** Only when the homeowner/partner voluntarily provides it. Never estimated. */
    finalProjectValueCents: z.number().int().nonnegative().optional(),
    valueVoluntarilyProvided: z.boolean().optional(),
    completedAt: optionalIso,
  })
  .superRefine((v, ctx) => {
    if (v.finalProjectValueCents !== undefined && v.valueVoluntarilyProvided !== true) {
      ctx.addIssue({ code: 'custom', path: ['valueVoluntarilyProvided'], message: 'a final project value requires valueVoluntarilyProvided: true' });
    }
    if (v.lostReason !== undefined && v.result !== 'lost') {
      ctx.addIssue({ code: 'custom', path: ['lostReason'], message: 'lostReason only applies when result is "lost"' });
    }
  });
export type OutcomeEntry = z.infer<typeof outcomeEntrySchema>;

/** Future call-tracking metadata. There is no recording field: recording cannot be enabled. */
export const callRecordSchema = z.strictObject({
  provider: z.literal('twilio'),
  providerCallId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  leadId: z.uuid().optional(),
  partnerId: z.uuid().optional(),
  routeId: z.uuid().optional(),
  startedAt: z.iso.datetime({ offset: true }),
  endedAt: optionalIso,
  durationSeconds: z.number().int().nonnegative().max(86_400).optional(),
  disposition: z.enum(['answered', 'missed', 'voicemail', 'busy', 'failed', 'spam']).optional(),
});
export type CallRecord = z.infer<typeof callRecordSchema>;

/** Future upload metadata. File content is never accepted; only a storage key reference. */
export const uploadMetadataSchema = z.strictObject({
  leadId: z.uuid(),
  storageKey: z.string().regex(/^leads\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,100}$/, 'storage key must be leads/<leadId>/<name>'),
  category: z.enum(['camera_image', 'camera_video', 'camera_report']),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']),
  byteSize: z.number().int().nonnegative().max(500 * 1024 * 1024).optional(),
  status: z.enum(['pending', 'stored', 'rejected']),
});
export type UploadMetadata = z.infer<typeof uploadMetadataSchema>;
