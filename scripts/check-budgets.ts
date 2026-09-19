/**
 * Build-time (lab) performance budgets on dist/client (docs/05 → Performance Budget).
 * Enforced now: first-party JS and CSS transfer size (gzip), third-party requests, custom fonts.
 * Core Web Vitals field p75 (LCP/CLS/INP) can only be measured with real-user data after launch;
 * lab LCP/CLS are measured separately in the Playwright job. Nothing here fabricates RUM data.
 */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { attrValues, builtPages, resolveBuiltPath, walk, DIST } from './lib/dist.ts';

const KB = 1024;
export const BUDGETS = {
  editorialJsTargetBytes: 0,
  editorialJsHardBytes: 35 * KB,
  leadFormJsHardBytes: 75 * KB,
  cssBytes: 40 * KB,
} as const;
/** Third-party origins permitted by docs/05 (Cloudflare Web Analytics; Turnstile on lead/form pages only). */
const ALLOWED_THIRD_PARTY = [/^https:\/\/static\.cloudflareinsights\.com\//, /^https:\/\/challenges\.cloudflare\.com\//];

const errors: string[] = [];
const warnings: string[] = [];
const gz = (buf: Buffer | string) => gzipSync(buf, { level: 9 }).length;

for (const font of walk(DIST).filter((f) => /\.(woff2?|ttf|otf|eot)$/i.test(f))) {
  errors.push(`custom font file shipped (system fonts only at launch): ${font}`);
}

const rows: string[] = [];
for (const page of builtPages()) {
  const { html, route } = page;
  let jsBytes = 0;
  let cssBytes = 0;

  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] ?? '';
    if (/type="application\/ld\+json"/i.test(attrs)) continue;
    const src = /\ssrc="([^"]+)"/i.exec(attrs)?.[1];
    if (src) {
      if (/^(https?:)?\/\//i.test(src)) continue; // third-party, checked below
      const file = resolveBuiltPath(src);
      if (file) jsBytes += gz(readFileSync(file));
    } else if ((m[2] ?? '').trim()) {
      jsBytes += gz(m[2] ?? '');
    }
  }

  for (const href of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/gi)].map((m) => m[1] ?? '')) {
    if (/^(https?:)?\/\//i.test(href)) continue;
    const file = resolveBuiltPath(href);
    if (!file) continue;
    const css = readFileSync(file, 'utf8');
    if (/@font-face/i.test(css)) errors.push(`${route}: @font-face found in ${href} (system fonts only at launch)`);
    cssBytes += gz(css);
  }
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) cssBytes += gz(m[1] ?? '');

  const external = [...attrValues(html, 'script', 'src'), ...attrValues(html, 'link', 'href'), ...attrValues(html, 'img', 'src'), ...attrValues(html, 'iframe', 'src')]
    .filter((u) => /^(https?:)?\/\//i.test(u));
  // Canonical links are not requests.
  const canonical = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]*)"/gi)].map((m) => m[1]);
  for (const url of external.filter((u) => !canonical.includes(u))) {
    if (!ALLOWED_THIRD_PARTY.some((re) => re.test(url))) errors.push(`${route}: third-party request not permitted: ${url}`);
  }

  // Phase 2A has no lead/form pages; every page uses the editorial budget.
  if (jsBytes > BUDGETS.editorialJsHardBytes) errors.push(`${route}: first-party JS ${jsBytes} B gzip > ${BUDGETS.editorialJsHardBytes} B hard budget`);
  else if (jsBytes > BUDGETS.editorialJsTargetBytes) warnings.push(`${route}: first-party JS ${jsBytes} B gzip exceeds the 0 KB editorial target`);
  if (cssBytes > BUDGETS.cssBytes) errors.push(`${route}: CSS ${cssBytes} B gzip > ${BUDGETS.cssBytes} B budget`);
  rows.push(`  ${route.padEnd(30)} js=${String(jsBytes).padStart(6)} B gz   css=${String(cssBytes).padStart(6)} B gz`);
}

console.log(`Budgets: editorial JS target 0 B / hard ${BUDGETS.editorialJsHardBytes} B; lead-form JS ${BUDGETS.leadFormJsHardBytes} B (no form pages yet); CSS ${BUDGETS.cssBytes} B (gzip)`);
console.log(rows.join('\n'));
for (const w of warnings) console.warn(`WARN ${w}`);
if (errors.length) {
  console.error(`\ncheck-budgets FAILED (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('OK: build-time performance budgets passed.');
