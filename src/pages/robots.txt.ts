import type { APIRoute } from 'astro';
import { renderRobotsTxt } from '../lib/seo/firewall.ts';
import { siteConfig } from '../lib/publication/load-astro.ts';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(renderRobotsTxt(siteConfig), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
