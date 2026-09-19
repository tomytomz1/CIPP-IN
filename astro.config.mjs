// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { resolveSiteConfig } from './src/config/site.ts';
import { responseHeaders } from './src/integrations/response-headers.ts';

// Validated, fail-safe site configuration (SITE_ENV, PUBLIC_SITE_ORIGIN).
// Missing/unknown SITE_ENV => "development" => every page is noindex.
const site = resolveSiteConfig(process.env);

export default defineConfig({
  // Canonical origin only when explicitly configured; never a guessed production host.
  ...(site.origin ? { site: site.origin } : {}),
  trailingSlash: 'always',
  // No sessions: avoids the adapter's default Cloudflare KV "SESSION" binding. No KV namespace exists.
  session: false,
  build: {
    format: 'directory',
    // Keep all CSS in external files so the CSP can stay "style-src 'self'".
    inlineStylesheets: 'never',
  },
  // Static-first: every current route is prerendered. The Cloudflare adapter is present so
  // future on-demand Worker endpoints can be added without changing the architecture.
  adapter: cloudflare({ imageService: 'passthrough' }),
  integrations: [responseHeaders(site)],
  vite: {
    define: {
      __SITE_CONFIG__: JSON.stringify(site),
    },
  },
});
