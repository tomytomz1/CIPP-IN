/**
 * Writes a Cloudflare static-assets `_headers` file at build time.
 * - Baseline security headers for every environment.
 * - `X-Robots-Tag: noindex, nofollow` is written for every response whenever the build is
 *   non-production OR no page is effectively indexable. The production site is public but
 *   non-indexable, and this makes that true for every response, not only for HTML that carries
 *   a robots meta tag. The header disappears on its own once a page genuinely passes the
 *   Indexing Gate and has operator approval; it is never toggled by hand.
 * - HSTS is emitted in production only, now that the production domain exists (docs/05 → Security).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { SiteConfig } from '../config/site.ts';

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** Exact-host exception reviewed in docs/05; no wildcard, inline script or eval permission. */
export function analyticsCsp(enabled: boolean): string {
  if (!enabled) return CONTENT_SECURITY_POLICY;
  return CONTENT_SECURITY_POLICY
    .replace("script-src 'self'", "script-src 'self' https://www.googletagmanager.com/gtag/js")
    .replace("connect-src 'self'", "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com")
    .replace("img-src 'self' data:", "img-src 'self' data: https://www.google-analytics.com https://region1.google-analytics.com");
}

/** One year. No includeSubDomains/preload: subdomain use is undecided. */
export const HSTS_VALUE = 'max-age=31536000';

export interface HeadersOptions {
  /** How many pages the evaluator considers effectively indexable in this build. */
  indexablePages?: number;
  /** Enabled only by the explicit production analytics release switch. */
  ga4Enabled?: boolean;
}

export function renderHeadersFile(site: SiteConfig, options: HeadersOptions = {}): string {
  const indexablePages = options.indexablePages ?? 0;
  const lines = [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    `  Content-Security-Policy: ${analyticsCsp(site.environment === 'production' && options.ga4Enabled === true)}`,
    '  X-Frame-Options: DENY',
  ];
  if (site.environment === 'production') lines.push(`  Strict-Transport-Security: ${HSTS_VALUE}`);
  if (!site.indexingAllowed || indexablePages === 0) lines.push('  X-Robots-Tag: noindex, nofollow');
  return `${lines.join('\n')}\n`;
}

export function responseHeaders(site: SiteConfig, options: HeadersOptions = {}): AstroIntegration {
  return {
    name: 'isr-response-headers',
    hooks: {
      'astro:build:done': ({ dir }) => {
        // Append to (never overwrite) any _headers written by the Cloudflare adapter.
        const target = new URL('_headers', dir);
        const existing = existsSync(target) ? readFileSync(target, 'utf8').trimEnd() : '';
        writeFileSync(target, `${existing ? `${existing}

` : ''}${renderHeadersFile(site, options)}`);
        console.log(`[isr-response-headers] wrote _headers to ${fileURLToPath(dir)} (env=${site.environment}, indexable pages=${options.indexablePages ?? 0})`);
      },
    },
  };
}
