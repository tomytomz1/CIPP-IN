/**
 * Read-only live evidence. No JS execution, cookies, indexing calls, or form submissions.
 * Headers and canonical values come from actual HTTP responses, never a browser model summary.
 */
const origin = 'https://indysewerresource.com';
const paths = ['/', '/about/', '/lawrence-sewer-lateral-repair/', '/sitemap.xml', '/robots.txt'];
const evidence: Array<Record<string, unknown>> = [];
for (const path of paths) {
  const response = await fetch(origin + path, { redirect: 'manual' });
  const html = await response.text();
  const robots = /<meta\s+name="robots"\s+content="([^"]*)"/i.exec(html)?.[1] ?? null;
  const canonical = /<link\s+rel="canonical"\s+href="([^"]*)"/i.exec(html)?.[1] ?? null;
  const header = response.headers.get('x-robots-tag');
  const row = { path, status: response.status, canonical, robots, robotsHeader: header,
    csp: response.headers.get('content-security-policy'), hsts: response.headers.get('strict-transport-security'),
    cloudflareBeaconInjected: html.includes('static.cloudflareinsights.com'),
    ga4Bootstrap: html.includes('/analytics.js'),
    sitemapUrls: path === '/sitemap.xml' ? [...html.matchAll(/<loc>/g)].length : null };
  evidence.push(row);
  if (response.status !== 200) throw new Error(JSON.stringify(row));
  if (path.endsWith('/')) {
    if (canonical !== origin + path || !robots?.includes('noindex') || !header?.includes('noindex')) throw new Error(JSON.stringify(row));
  }
  if (path === '/sitemap.xml' && row.sitemapUrls !== 0) throw new Error('Unexpected sitemap URL; publication status must be reviewed.');
  if (path === '/robots.txt' && /^Disallow:\s*\/\s*$/m.test(html)) throw new Error('Crawling blocked globally.');
}
for (const url of ['http://indysewerresource.com/about/', 'https://www.indysewerresource.com/about/', 'http://www.indysewerresource.com/about/']) {
  const response = await fetch(url, { redirect: 'manual' });
  const location = response.headers.get('location');
  evidence.push({ url, status: response.status, location });
  if (response.status !== 301 || location !== origin + '/about/') throw new Error('Unexpected redirect: ' + JSON.stringify(evidence.at(-1)));
}
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), evidence }, null, 2));

export {};
