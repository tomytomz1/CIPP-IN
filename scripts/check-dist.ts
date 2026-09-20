/**
 * Post-build SEO / indexing-firewall / link / structured-data checks on dist/client.
 * Uses the same site config (from env) and the same registry + evaluator as the build.
 * Fails on any violation. See docs/05 → Testing Requirements.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveSiteConfig } from '../src/config/site.ts';
import { buildRegistry } from '../src/lib/publication/registry.ts';
import { canonicalUrl, isEffectivelyIndexable, renderRobotsTxt, robotsDirective, sitemapUrls } from '../src/lib/seo/firewall.ts';
import { checkStructuredData } from '../src/lib/seo/structured-data.ts';
import { DIST, attrValues, builtPages, metaContent, resolveBuiltPath, walk } from './lib/dist.ts';
import { loadRawApprovals, loadRawRecords } from './lib/load-project.ts';

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

const site = resolveSiteConfig(process.env);
const registry = buildRegistry(loadRawRecords(), loadRawApprovals(), { now: new Date() });
const pages = builtPages();
console.log(`Environment: ${site.environment}; origin: ${site.origin ?? 'none'}; built HTML pages: ${pages.length}`);

const inboundLinks = new Map<string, number>();

for (const page of pages) {
  const where = `${page.route} (${page.file})`;
  const { html } = page;

  if (!/<html\b[^>]*\blang="[^"]+"/.test(html)) fail(`${where}: <html> missing lang`);
  if (!/<title>[^<]+<\/title>/.test(html)) fail(`${where}: missing <title>`);
  if (metaContent(html, 'description').length !== 1) fail(`${where}: must have exactly one meta description`);

  const ids = metaContent(html, 'isr:page-id');
  if (ids.length !== 1) {
    fail(`${where}: every page must be rendered through BaseLayout with exactly one publication record`);
    continue;
  }
  const entry = registry.byId(ids[0]!);
  if (!entry) {
    fail(`${where}: page id "${ids[0]}" has no publication record`);
    continue;
  }
  if (entry.record.route !== page.route) fail(`${where}: record route ${entry.record.route} does not match built route`);

  const robots = metaContent(html, 'robots');
  const expectedRobots = robotsDirective(entry, site);
  if (robots.length !== 1) fail(`${where}: must have exactly one meta robots (found ${robots.length})`);
  else if (robots[0] !== expectedRobots) fail(`${where}: robots "${robots[0]}" but evaluator requires "${expectedRobots}"`);
  if (!site.indexingAllowed && robots[0] && !robots[0].includes('noindex')) fail(`${where}: non-production page is not noindex`);
  if (robots[0] && !robots[0].includes('noindex') && !isEffectivelyIndexable(entry, site)) {
    fail(`${where}: page is indexable without passing the evaluator`);
  }

  const uniqueCanonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/gi)].map((m) => m[1] ?? '');
  const expectedCanonical = canonicalUrl(entry.record.route, site);
  if (expectedCanonical === null && uniqueCanonicals.length > 0) fail(`${where}: canonical emitted without a configured origin`);
  if (expectedCanonical !== null && (uniqueCanonicals.length !== 1 || uniqueCanonicals[0] !== expectedCanonical)) {
    fail(`${where}: canonical must be exactly ${expectedCanonical}`);
  }

  // Inline scripts other than JSON-LD would violate the CSP (script-src 'self').
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] ?? '';
    const body = (m[2] ?? '').trim();
    if (/type="application\/ld\+json"/i.test(attrs)) {
      try {
        const issues = checkStructuredData(JSON.parse(body));
        for (const i of issues) fail(`${where}: structured data ${i.path}: ${i.message}`);
      } catch {
        fail(`${where}: malformed JSON-LD`);
      }
    } else if (!/\ssrc="/i.test(attrs) && body.length > 0) {
      fail(`${where}: inline <script> is not allowed (CSP script-src 'self')`);
    }
  }

  // Internal links and assets must resolve; fragments must exist.
  const elementIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const refs = [...attrValues(html, 'a', 'href'), ...attrValues(html, 'link', 'href'), ...attrValues(html, 'script', 'src'), ...attrValues(html, 'img', 'src')];
  for (const ref of refs) {
    if (/^(https?:)?\/\//i.test(ref) || /^(mailto|tel|data):/i.test(ref)) continue;
    if (ref.startsWith('#')) {
      if (ref.length > 1 && !elementIds.has(ref.slice(1))) fail(`${where}: fragment link ${ref} has no target`);
      continue;
    }
    if (!ref.startsWith('/')) {
      fail(`${where}: use root-relative internal URLs (found "${ref}")`);
      continue;
    }
    if (!resolveBuiltPath(ref)) fail(`${where}: broken internal reference ${ref}`);
    const target = ref.split('#')[0]!.split('?')[0]!;
    if (target !== page.route) inboundLinks.set(target, (inboundLinks.get(target) ?? 0) + 1);
  }
}

// Every record's route that is shipped must be built, and nothing unrecorded may ship.
const builtRoutes = new Set(pages.map((p) => p.route));
for (const { record } of registry.entries) {
  if (!builtRoutes.has(record.route) && record.lifecycle !== 'draft') {
    fail(`record "${record.id}" (${record.route}, ${record.lifecycle}) has no built page`);
  }
}

// No orphan indexable page.
for (const e of registry.entries) {
  if (isEffectivelyIndexable(e, site) && e.record.route !== '/' && !inboundLinks.get(e.record.route)) {
    fail(`indexable page ${e.record.route} is orphaned (no internal links point to it)`);
  }
}

// Server-only lead code must never reach the browser bundle (docs/05 → Security).
for (const file of walk(DIST)) {
  const text = readFileSync(file, 'utf8');
  for (const marker of [
    'INSERT INTO leads', 'lead_contacts', 'INSERT INTO consents', 'cloudflare:workers', 'TURNSTILE_SECRET',
    // Phase 2C: notification provider code, endpoints, and secrets are server-only too.
    'RESEND_API_KEY', 'TWILIO_AUTH_TOKEN', 'api.resend.com', 'api.twilio.com', 'Idempotency-Key',
  ]) {
    if (text.includes(marker)) fail(`client asset ${file} contains server-only marker "${marker}"`);
  }
}

// Sitemap must equal exactly the evaluator's eligible set.
const sitemapXml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => (m[1] ?? '').replace(/&amp;/g, '&')).sort();
const expectedLocs = sitemapUrls(registry.entries, site);
if (JSON.stringify(locs) !== JSON.stringify(expectedLocs)) {
  fail(`sitemap.xml contains ${JSON.stringify(locs)} but the evaluator allows ${JSON.stringify(expectedLocs)}`);
}

// robots.txt must match the firewall and never Disallow as a noindex substitute.
const robotsTxt = readFileSync(join(DIST, 'robots.txt'), 'utf8');
if (robotsTxt !== renderRobotsTxt(site)) fail('robots.txt does not match the firewall output');
if (/Disallow:\s*\/\s*$/m.test(robotsTxt)) fail('robots.txt must not Disallow the whole site');

// Non-production builds must send X-Robots-Tag noindex on every response.
const headers = readFileSync(join(DIST, '_headers'), 'utf8');
if (!site.indexingAllowed && !/^\/\*\n(?:\s+.+\n)*?\s+X-Robots-Tag: noindex, nofollow$/m.test(headers)) {
  fail('_headers is missing the global X-Robots-Tag noindex rule for this non-production build');
}

console.log(`Sitemap URLs: ${locs.length}; effectively indexable pages: ${registry.entries.filter((e) => isEffectivelyIndexable(e, site)).length}`);
if (errors.length) {
  console.error(`\ncheck-dist FAILED (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('OK: SEO, indexing firewall, links, and structured data checks passed.');
