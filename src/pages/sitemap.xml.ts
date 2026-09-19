import type { APIRoute } from 'astro';
import { renderSitemap, sitemapUrls } from '../lib/seo/firewall.ts';
import { getRegistry, siteConfig } from '../lib/publication/load-astro.ts';

export const prerender = true;

/** Contains only effectively indexable canonical production URLs. Phase 2A: none. */
export const GET: APIRoute = () =>
  new Response(renderSitemap(sitemapUrls(getRegistry().entries, siteConfig)), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
