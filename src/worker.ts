/**
 * Cloudflare Worker entrypoint.
 *
 * It does exactly two things:
 *   1. redirects any non-canonical host (today: `www`) permanently to the apex, so `www` never
 *      becomes a second serving host;
 *   2. hands everything else to the Astro Cloudflare adapter, which serves the static assets
 *      and the (disabled) on-demand routes exactly as it would without this file.
 *
 * No bindings, no state, no cookies, no tracking. The indexing firewall, robots directives, and
 * canonical URLs are all decided at build time; nothing here can change them.
 */
import { handle } from '@astrojs/cloudflare/handler';
import { CANONICAL_REDIRECT_STATUS, canonicalRedirect } from './lib/seo/canonical-host.ts';

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const redirectTo = canonicalRedirect(request.url);
    if (redirectTo !== null) {
      return new Response(null, {
        status: CANONICAL_REDIRECT_STATUS,
        headers: {
          Location: redirectTo,
          // A redirect is not content, and must not be indexed on the non-canonical host.
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store',
        },
      });
    }
    return handle(request, env, context);
  },
};
