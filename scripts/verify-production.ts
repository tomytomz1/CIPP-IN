/**
 * Live production smoke test against the deployed site.
 *
 *   node scripts/verify-production.ts [origin]
 *
 * Asserts the things that matter for a public-but-non-indexable deployment:
 *   - every page returns 200 over HTTPS on the canonical host
 *   - every page carries `noindex` in BOTH the robots meta tag and the X-Robots-Tag header
 *   - canonicals point at the canonical origin, and no page canonicalizes to www
 *   - the sitemap is reachable and contains zero URLs
 *   - robots.txt does not disallow crawling (a crawler must be able to see the noindex)
 *   - the lead intake endpoint is closed (503), so nothing can be submitted
 *   - security headers are present
 *
 * Read-only: it makes GET/HEAD requests and changes nothing.
 */
import { PRODUCTION_ORIGIN } from '../src/config/brand.ts';

const origin = (process.argv[2] ?? PRODUCTION_ORIGIN).replace(/\/$/, '');
const pages = ['/', '/lawrence-sewer-lateral-repair/', '/about/'];

const failures: string[] = [];
const fail = (message: string) => failures.push(message);
const ok = (message: string) => console.log(`  ok  ${message}`);

async function get(path: string): Promise<{ status: number; headers: Headers; body: string; url: string }> {
  const response = await fetch(`${origin}${path}`, { redirect: 'follow' });
  return { status: response.status, headers: response.headers, body: await response.text(), url: response.url };
}

console.log(`Verifying ${origin}\n`);

if (!origin.startsWith('https://')) fail(`origin must be https: ${origin}`);

for (const path of pages) {
  console.log(`${path}`);
  let page;
  try {
    page = await get(path);
  } catch (err) {
    fail(`${path}: request failed (${err instanceof Error ? err.message : 'unknown error'})`);
    continue;
  }

  if (page.status !== 200) fail(`${path}: HTTP ${page.status}`);
  else ok(`HTTP 200`);

  if (!page.url.startsWith(`${origin}/`)) fail(`${path}: ended at ${page.url} instead of the canonical host`);
  else ok('served on the canonical host without an unexpected redirect');

  const robotsMeta = /<meta\s+name="robots"\s+content="([^"]*)"/i.exec(page.body)?.[1] ?? '';
  if (!robotsMeta.includes('noindex')) fail(`${path}: robots meta is "${robotsMeta}", expected noindex`);
  else ok(`robots meta: ${robotsMeta}`);

  const robotsHeader = page.headers.get('x-robots-tag') ?? '';
  if (!robotsHeader.includes('noindex')) fail(`${path}: X-Robots-Tag header is "${robotsHeader}", expected noindex`);
  else ok(`X-Robots-Tag: ${robotsHeader}`);

  const canonical = /<link\s+rel="canonical"\s+href="([^"]*)"/i.exec(page.body)?.[1] ?? '';
  if (canonical !== `${origin}${path}`) fail(`${path}: canonical is "${canonical}", expected "${origin}${path}"`);
  else ok(`canonical: ${canonical}`);

  for (const [header, expected] of [
    ['x-content-type-options', 'nosniff'],
    ['referrer-policy', 'strict-origin-when-cross-origin'],
    ['x-frame-options', 'DENY'],
  ] as const) {
    const value = page.headers.get(header) ?? '';
    if (!value.toLowerCase().includes(expected.toLowerCase())) fail(`${path}: ${header} is "${value}", expected ${expected}`);
  }
  if (!(page.headers.get('content-security-policy') ?? '').includes("default-src 'self'")) {
    fail(`${path}: missing or unexpected Content-Security-Policy`);
  } else ok('security headers present (CSP, nosniff, referrer policy, frame options)');

  if (/<form\b/i.test(page.body)) fail(`${path}: a form element is present; this site collects nothing`);
  const scripts = [...page.body.matchAll(/<script\b([^>]*)>/gi)].filter((m) => !/application\/ld\+json/i.test(m[1] ?? ''));
  if (scripts.length > 0) fail(`${path}: unexpected script tag(s): ${scripts.length}`);
  else ok('no forms, no client JavaScript');
  console.log('');
}

console.log('/sitemap.xml and /robots.txt');
try {
  const sitemap = await get('/sitemap.xml');
  const locs = [...sitemap.body.matchAll(/<loc>/g)].length;
  if (sitemap.status !== 200) fail(`/sitemap.xml: HTTP ${sitemap.status}`);
  if (locs !== 0) fail(`/sitemap.xml lists ${locs} URL(s); expected 0 while no page is indexable`);
  else ok('sitemap contains 0 URLs');

  const robots = await get('/robots.txt');
  if (robots.status !== 200) fail(`/robots.txt: HTTP ${robots.status}`);
  if (/^Disallow:\s*\/\s*$/m.test(robots.body)) fail('/robots.txt disallows the whole site; noindex must be visible to crawlers');
  else ok('robots.txt allows crawling so the noindex directive is visible');
} catch (err) {
  fail(`sitemap/robots check failed: ${err instanceof Error ? err.message : 'unknown error'}`);
}

console.log('\n/api/lead-intake (must be closed)');
try {
  const response = await fetch(`${origin}/api/lead-intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ probe: true }),
  });
  if (response.status !== 503) fail(`/api/lead-intake returned HTTP ${response.status}; expected 503 (lead intake disabled)`);
  else ok('HTTP 503: live lead intake is disabled');
} catch (err) {
  fail(`/api/lead-intake check failed: ${err instanceof Error ? err.message : 'unknown error'}`);
}

if (failures.length > 0) {
  console.error(`\nverify-production FAILED (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('\nOK: the deployment is public, non-indexable, collects nothing, and serves 0 sitemap URLs.');
