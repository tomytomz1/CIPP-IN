/**
 * HTTP adapter for lead intake. Deliberately thin: the core service (intake.ts) is testable
 * without it. The route exists so the activation boundary is explicit and testable, NOT so that
 * deploying the repository starts collecting leads.
 *
 * Behavior with the current configuration (nothing configured): every request returns 503.
 */
import { resolveIntakeActivation, type IntakeEnvironment } from './activation.ts';
import { IntakeValidationError, submitLead } from './intake.ts';
import { safeLog } from './log.ts';
import { verifyTurnstile } from './turnstile.ts';

/** Bounded request body: the approved intake fields are small. */
export const MAX_INTAKE_BODY_BYTES = 8 * 1024;

export interface IntakeRequestDeps {
  env: IntakeEnvironment;
  fetchImpl?: typeof fetch;
}

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export async function handleLeadIntakeRequest(request: Request, deps: IntakeRequestDeps): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  // Fail closed BEFORE reading any submitted data.
  const activation = resolveIntakeActivation(deps.env);
  if (!activation.enabled) {
    safeLog('warn', 'lead.intake.disabled', { count: activation.reasons.length });
    return json(503, {
      error: 'lead_intake_disabled',
      detail: 'Live lead collection is not enabled. Legal review and production configuration are required.',
      reasons: activation.reasons,
    });
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_INTAKE_BODY_BYTES) return json(413, { error: 'payload_too_large' });

  let payload: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_INTAKE_BODY_BYTES) return json(413, { error: 'payload_too_large' });
    payload = JSON.parse(text);
  } catch {
    return json(400, { error: 'invalid_json' });
  }
  if (typeof payload !== 'object' || payload === null) return json(400, { error: 'invalid_body' });

  const { turnstileToken, lead } = payload as { turnstileToken?: unknown; lead?: unknown };
  if (typeof turnstileToken !== 'string' || turnstileToken.length === 0) {
    return json(400, { error: 'missing_turnstile_token' });
  }

  const verification = await verifyTurnstile({
    secret: activation.turnstileSecret,
    token: turnstileToken,
    remoteIp: request.headers.get('cf-connecting-ip') ?? undefined,
    ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
  });
  if (!verification.ok) {
    safeLog('warn', 'lead.intake.turnstile_failed', { reason: verification.errorCodes[0] ?? 'unknown' });
    return json(403, { error: 'turnstile_verification_failed' });
  }

  try {
    const result = await submitLead(lead, {
      db: activation.db,
      queue: activation.queue,
      consentArtifact: activation.consentArtifact,
      source: 'web_form',
      captureContext: `legal_review_ref=${activation.legalReviewRef}`,
    });
    safeLog('info', 'lead.intake.accepted', { leadId: result.leadId, routeId: result.routeId, status: result.duplicate ? 'duplicate' : 'created' });
    return json(result.duplicate ? 200 : 201, { leadId: result.leadId, duplicate: result.duplicate });
  } catch (err) {
    if (err instanceof IntakeValidationError) return json(422, { error: 'validation_failed', issues: err.issues });
    safeLog('error', 'lead.intake.failed', { reason: err instanceof Error ? err.name : 'unknown' });
    return json(500, { error: 'intake_failed' });
  }
}
