/**
 * Build-time site configuration. Pure and fail-safe:
 * - Unknown/missing SITE_ENV resolves to "development" (never production).
 * - Only SITE_ENV=production can ever emit indexable pages.
 * - Production falls back to the registered brand domain when PUBLIC_SITE_ORIGIN is unset
 *   (the operator registered indysewerresource.com on 2026-09-19). Knowing the canonical
 *   origin changes nothing about indexability: the evaluator still decides that, and nothing
 *   is deployed to the domain.
 */
import { PRODUCTION_ORIGIN } from './brand.ts';
export const SITE_ENVIRONMENTS = ['development', 'preview', 'production'] as const;
export type SiteEnvironment = (typeof SITE_ENVIRONMENTS)[number];

export interface SiteConfig {
  environment: SiteEnvironment;
  /** Validated canonical origin (scheme + host, no trailing slash) or null. */
  origin: string | null;
  /** True only for production with a valid origin. Everything else is globally noindex. */
  indexingAllowed: boolean;
}

const BLOCKED_HOSTS = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\])$|\.(test|example|invalid|localhost|local)$|^example\.(com|net|org)$/;

/** Validates a canonical origin. Returns the normalized origin or throws with a reason. */
export function validateOrigin(raw: string, { allowNonProductionHosts = false } = {}): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`PUBLIC_SITE_ORIGIN is not a valid URL: "${raw}"`);
  }
  if (url.protocol !== 'https:') throw new Error(`PUBLIC_SITE_ORIGIN must use https: "${raw}"`);
  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password || url.port) {
    throw new Error(`PUBLIC_SITE_ORIGIN must be a bare origin (no path, query, port, or credentials): "${raw}"`);
  }
  if (!allowNonProductionHosts && BLOCKED_HOSTS.test(url.hostname)) {
    throw new Error(`PUBLIC_SITE_ORIGIN host "${url.hostname}" is not a production host`);
  }
  return url.origin;
}

export function resolveSiteConfig(env: Record<string, string | undefined>): SiteConfig {
  const rawEnv = (env['SITE_ENV'] ?? '').trim();
  const environment: SiteEnvironment = (SITE_ENVIRONMENTS as readonly string[]).includes(rawEnv)
    ? (rawEnv as SiteEnvironment)
    : 'development';
  const rawOrigin = (env['PUBLIC_SITE_ORIGIN'] ?? '').trim();

  if (environment === 'production') {
    return { environment, origin: validateOrigin(rawOrigin || PRODUCTION_ORIGIN), indexingAllowed: true };
  }
  const origin = rawOrigin ? validateOrigin(rawOrigin, { allowNonProductionHosts: true }) : null;
  return { environment, origin, indexingAllowed: false };
}
