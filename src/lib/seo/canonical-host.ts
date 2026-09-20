/**
 * Canonical-host and scheme policy.
 *
 * The apex over https is the only way this site is served. Any other host the Worker is
 * reachable on (today: `www`), and any plain-http request, answers with a permanent redirect to
 * the same path on `https://<apex>`, so there is never a second host serving the same content
 * (docs/05 -> Domain / Brand, Canonicals) and no page is served in the clear.
 *
 * Pure and testable: the Worker entrypoint only applies the decision made here. Note that the
 * Worker must be configured to run before static assets (`assets.run_worker_first`), otherwise
 * asset requests are served directly and this policy never executes.
 */
import { APEX_HOST } from '../../config/brand.ts';

/** Hosts that must redirect to the apex instead of serving content. */
export const REDIRECTING_HOSTS = [`www.${APEX_HOST}`] as const;

/** 301: the move is permanent, and the apex is the canonical host for good. */
export const CANONICAL_REDIRECT_STATUS = 301;

/**
 * The absolute URL this request should be redirected to, or null when it is already canonical
 * (apex + https). Path, query, and fragment are preserved.
 */
export function canonicalRedirect(requestUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }
  const wrongHost = (REDIRECTING_HOSTS as readonly string[]).includes(url.hostname);
  const wrongScheme = url.protocol === 'http:' && (wrongHost || url.hostname === APEX_HOST);
  if (!wrongHost && !wrongScheme) return null;
  url.protocol = 'https:';
  if (wrongHost) url.hostname = APEX_HOST;
  url.port = '';
  return url.toString();
}
