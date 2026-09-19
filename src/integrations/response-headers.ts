/**
 * Writes a Cloudflare static-assets `_headers` file at build time.
 * - Baseline security headers for every environment.
 * - Non-production builds add `X-Robots-Tag: noindex, nofollow` to every response,
 *   so preview/development deployments are globally non-indexable even for non-HTML files.
 * HSTS is intentionally deferred until the production domain exists (docs/05 → Security).
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

export function renderHeadersFile(site: SiteConfig): string {
  const lines = [
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    `  Content-Security-Policy: ${CONTENT_SECURITY_POLICY}`,
    '  X-Frame-Options: DENY',
  ];
  if (!site.indexingAllowed) lines.push('  X-Robots-Tag: noindex, nofollow');
  return `${lines.join('\n')}\n`;
}

export function responseHeaders(site: SiteConfig): AstroIntegration {
  return {
    name: 'isr-response-headers',
    hooks: {
      'astro:build:done': ({ dir }) => {
        // Append to (never overwrite) any _headers written by the Cloudflare adapter.
        const target = new URL('_headers', dir);
        const existing = existsSync(target) ? readFileSync(target, 'utf8').trimEnd() : '';
        writeFileSync(target, `${existing ? `${existing}

` : ''}${renderHeadersFile(site)}`);
        console.log(`[isr-response-headers] wrote _headers to ${fileURLToPath(dir)} (env=${site.environment})`);
      },
    },
  };
}
