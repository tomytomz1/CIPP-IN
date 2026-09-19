/**
 * Live-intake activation boundary.
 *
 * Live homeowner lead collection is DISABLED and must stay disabled until legal review of the
 * privacy policy, sharing consent, retention, and disclosure is complete (docs/05 → Privacy /
 * Consent, OPEN) and the production infrastructure exists.
 *
 * Activation fails closed: intake is enabled only when EVERY requirement below is satisfied by
 * explicit configuration that does not exist in this repository. No default, fallback, or
 * synthetic value can enable it, and no code path infers legal approval.
 */
import { TEST_CONSENT_ARTIFACT_PREFIX, consentArtifactSchema, type ConsentArtifact, type LeadQueue } from './contract.ts';
import type { SqlDatabase } from './db.ts';

export interface IntakeEnvironment {
  /** Must be exactly "true". */
  LEAD_INTAKE_ENABLED?: unknown;
  /** Reference to the completed legal review (e.g. a dated approval record id). */
  LEAD_LEGAL_REVIEW_REF?: unknown;
  /** Consent artifact actually presented to the homeowner. */
  LEAD_CONSENT_ARTIFACT_ID?: unknown;
  LEAD_CONSENT_ARTIFACT_VERSION?: unknown;
  /** Turnstile secret (Wrangler secret; never committed). */
  TURNSTILE_SECRET_KEY?: unknown;
  /** Bindings, present only once the resources are provisioned. */
  DB?: unknown;
  LEAD_QUEUE?: unknown;
  SITE_ENV?: unknown;
}

export type IntakeActivation =
  | {
      enabled: true;
      db: SqlDatabase;
      queue: LeadQueue;
      consentArtifact: ConsentArtifact;
      turnstileSecret: string;
      legalReviewRef: string;
    }
  | { enabled: false; reasons: string[] };

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function resolveIntakeActivation(env: IntakeEnvironment): IntakeActivation {
  const reasons: string[] = [];

  if (str(env.LEAD_INTAKE_ENABLED) !== 'true') reasons.push('LEAD_INTAKE_ENABLED is not "true"');
  const legalReviewRef = str(env.LEAD_LEGAL_REVIEW_REF);
  if (!legalReviewRef) reasons.push('LEAD_LEGAL_REVIEW_REF is missing (legal review of consent/privacy is OPEN)');

  const artifactParsed = consentArtifactSchema.safeParse({
    artifactId: str(env.LEAD_CONSENT_ARTIFACT_ID),
    artifactVersion: str(env.LEAD_CONSENT_ARTIFACT_VERSION),
  });
  if (!artifactParsed.success) reasons.push('consent artifact id/version are not configured');

  const turnstileSecret = str(env.TURNSTILE_SECRET_KEY);
  if (!turnstileSecret) reasons.push('TURNSTILE_SECRET_KEY is missing');

  const db = env.DB as SqlDatabase | undefined;
  if (!db || typeof db.prepare !== 'function') reasons.push('D1 binding DB is missing');
  const queue = env.LEAD_QUEUE as LeadQueue | undefined;
  if (!queue || typeof queue.send !== 'function') reasons.push('Queue binding LEAD_QUEUE is missing');

  // A synthetic/test consent artifact must never be used to collect real homeowner consent.
  if (artifactParsed.success && artifactParsed.data.artifactId.startsWith(TEST_CONSENT_ARTIFACT_PREFIX) && str(env.SITE_ENV) === 'production') {
    reasons.push('a TEST-ONLY consent artifact cannot be used in production');
  }

  if (reasons.length > 0 || !artifactParsed.success || !db || !queue) return { enabled: false, reasons };

  return {
    enabled: true,
    db,
    queue,
    consentArtifact: artifactParsed.data,
    turnstileSecret,
    legalReviewRef,
  };
}
