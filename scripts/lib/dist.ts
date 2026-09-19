/** Helpers for inspecting the built static output (dist/client). */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST = fileURLToPath(new URL('../../dist/client/', import.meta.url));

export function walk(dir: string): string[] {
  if (!existsSync(dir)) throw new Error(`build output not found at ${dir}; run "npm run build" first`);
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

export interface BuiltPage {
  file: string;
  /** Site-relative route, e.g. "/" or "/a/b/". */
  route: string;
  html: string;
}

export function builtPages(): BuiltPage[] {
  return walk(DIST)
    .filter((f) => f.endsWith('.html'))
    .map((file) => {
      const rel = relative(DIST, file).split(sep).join('/');
      const route = rel === 'index.html' ? '/' : `/${rel.replace(/index\.html$/, '')}`;
      return { file, route, html: readFileSync(file, 'utf8') };
    });
}

/** Extracts attribute values of a tag; adequate for our own generated, well-formed output. */
export function attrValues(html: string, tag: string, attr: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*\\s${attr}="([^"]*)"`, 'gi');
  return [...html.matchAll(re)].map((m) => m[1] ?? '');
}

export function metaContent(html: string, name: string): string[] {
  const re = new RegExp(`<meta\\b[^>]*name="${name}"[^>]*content="([^"]*)"`, 'gi');
  return [...html.matchAll(re)].map((m) => m[1] ?? '');
}

/** Resolves a site-relative URL path to a file in dist/client, or null. */
export function resolveBuiltPath(pathname: string): string | null {
  const clean = decodeURIComponent(pathname.split('#')[0]!.split('?')[0]!);
  const candidates = clean.endsWith('/') ? [join(DIST, clean, 'index.html')] : [join(DIST, clean), join(DIST, clean, 'index.html')];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}
