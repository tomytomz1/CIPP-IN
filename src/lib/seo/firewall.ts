/**
 * Indexing firewall: robots directives, canonicals, sitemap eligibility, robots.txt.
 * Everything derives from (a) the evaluator result and (b) the site environment.
 * Nothing becomes indexable by accident; there is no per-page override.
 */
import type { SiteConfig } from '../../config/site.ts';
import type { RegistryEntry } from '../publication/registry.ts';

export const NOINDEX = 'noindex, nofollow';
export const NOINDEX_FOLLOW = 'noindex, follow';
export const INDEX = 'index, follow';

/** True only when the environment allows indexing, the evaluator passed, and a canonical origin exists. */
export function isEffectivelyIndexable(entry: RegistryEntry, site: SiteConfig): boolean {
  return site.indexingAllowed && site.origin !== null && entry.evaluation.effectiveIndexable;
}

/**
 * Robots meta directive for a page.
 * - Non-production (development/preview): globally "noindex, nofollow".
 * - Production, not effectively indexable: "noindex, follow" (published_noindex pages may
 *   still pass link equity to indexable pages; they are simply never indexed).
 * - Production, effectively indexable: "index, follow".
 */
export function robotsDirective(entry: RegistryEntry, site: SiteConfig): string {
  if (!site.indexingAllowed) return NOINDEX;
  return isEffectivelyIndexable(entry, site) ? INDEX : NOINDEX_FOLLOW;
}

/** Central canonical URL, or null when no origin is configured. Routes come only from records. */
export function canonicalUrl(route: string, site: SiteConfig): string | null {
  if (!site.origin) return null;
  if (!/^\/(?:[a-z0-9-]+\/)*$/.test(route)) throw new Error(`invalid route for canonical: ${route}`);
  return `${site.origin}${route}`;
}

/** Production XML sitemap URLs: effectively indexable canonical URLs only. */
export function sitemapUrls(entries: readonly RegistryEntry[], site: SiteConfig): string[] {
  if (!site.indexingAllowed || !site.origin) return [];
  return entries
    .filter((e) => isEffectivelyIndexable(e, site))
    .map((e) => canonicalUrl(e.record.route, site))
    .filter((u): u is string => u !== null)
    .sort();
}

export function renderSitemap(urls: readonly string[]): string {
  const body = urls.map((u) => `  <url><loc>${escapeXml(u)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}${body ? '\n' : ''}</urlset>\n`;
}

/**
 * robots.txt. Crawling is deliberately NOT disallowed in non-production: a crawler must be
 * able to fetch pages to see their noindex directive. Non-indexability is enforced by
 * per-page noindex (and the X-Robots-Tag header in non-production builds), never by robots.txt.
 */
export function renderRobotsTxt(site: SiteConfig): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (site.indexingAllowed && site.origin) {
    lines.push(`Sitemap: ${site.origin}/sitemap.xml`);
  } else {
    lines.push('# Non-production build: every page is served with noindex. No sitemap is advertised.');
  }
  return `${lines.join('\n')}\n`;
}

/** Draft pages must not ship to production at all. */
export function assertShippable(entry: RegistryEntry, site: SiteConfig): void {
  if (site.environment === 'production' && entry.record.lifecycle === 'draft') {
    throw new Error(
      `page "${entry.record.id}" is in lifecycle "draft" and must not be built for production (see docs/05-BUILD-SPEC.md, Robots).`,
    );
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
