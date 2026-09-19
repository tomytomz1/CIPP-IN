/**
 * Lead intake endpoint — DISABLED.
 *
 * With the current configuration this route always returns 503: live lead collection requires
 * legal review (OPEN) plus production bindings that do not exist. Deploying this repository
 * does NOT start collecting leads. See src/lib/leads/activation.ts.
 *
 * There is no public lead form; this route exists to make the activation boundary explicit
 * and testable. The core intake service is tested directly, without HTTP.
 */
import type { APIRoute } from 'astro';
import type { IntakeEnvironment } from '../../lib/leads/activation.ts';
import { handleLeadIntakeRequest } from '../../lib/leads/http.ts';

export const prerender = false;

/** Worker environment (bindings + vars). Absent outside the Cloudflare runtime, which fails closed. */
async function readEnv(): Promise<IntakeEnvironment> {
  try {
    const mod = (await import('cloudflare:workers')) as { env?: IntakeEnvironment };
    return mod.env ?? {};
  } catch {
    return {};
  }
}

export const ALL: APIRoute = async ({ request }) => handleLeadIntakeRequest(request, { env: await readEnv() });
