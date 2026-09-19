/** Noindex / sitemap / canonical / robots.txt firewall tests. ARTIFICIAL FIXTURES only. */
import { describe, expect, it } from 'vitest';
import { evaluateIndexability } from '../../src/lib/publication/evaluate.ts';
import {
  INDEX,
  NOINDEX,
  NOINDEX_FOLLOW,
  assertShippable,
  canonicalUrl,
  renderRobotsTxt,
  renderSitemap,
  robotsDirective,
  sitemapUrls,
} from '../../src/lib/seo/firewall.ts';
import type { RegistryEntry } from '../../src/lib/publication/registry.ts';
import { FIXTURE_DEV, FIXTURE_NOW, FIXTURE_PREVIEW, FIXTURE_PROD, approvalFor, parse, passingInput } from '../fixtures/records.ts';

function entry(overrides: Record<string, unknown> = {}, approve = true): RegistryEntry {
  const record = parse(passingInput(overrides));
  return { record, evaluation: evaluateIndexability(record, approve ? [approvalFor(record)] : [], { now: FIXTURE_NOW }) };
}

describe('robots directive', () => {
  it('non-indexable lifecycle states resolve to noindex in every environment', () => {
    for (const lifecycle of ['draft', 'review', 'published_noindex', 'index_candidate']) {
      const e = entry({ lifecycle });
      expect(robotsDirective(e, FIXTURE_PROD)).toBe(NOINDEX_FOLLOW);
      expect(robotsDirective(e, FIXTURE_PREVIEW)).toBe(NOINDEX);
      expect(robotsDirective(e, FIXTURE_DEV)).toBe(NOINDEX);
    }
  });

  it('a record whose lifecycle says "indexable" but fails the evaluator is noindex', () => {
    const e = entry({ lifecycle: 'indexable' }, false);
    expect(e.evaluation.effectiveIndexable).toBe(false);
    expect(robotsDirective(e, FIXTURE_PROD)).toBe(NOINDEX_FOLLOW);
  });

  it('an effectively indexable page is indexable only in production', () => {
    const e = entry();
    expect(robotsDirective(e, FIXTURE_PROD)).toBe(INDEX);
    expect(robotsDirective(e, FIXTURE_PREVIEW)).toBe(NOINDEX);
    expect(robotsDirective(e, FIXTURE_DEV)).toBe(NOINDEX);
  });

  it('production without a canonical origin cannot index', () => {
    expect(robotsDirective(entry(), { environment: 'production', origin: null, indexingAllowed: true })).toBe(NOINDEX_FOLLOW);
  });
});

describe('sitemap', () => {
  const all = [
    entry({ id: 'fx-a', route: '/fx-a/' }),
    entry({ id: 'fx-b', route: '/fx-b/', lifecycle: 'draft' }),
    entry({ id: 'fx-c', route: '/fx-c/', lifecycle: 'review' }),
    entry({ id: 'fx-d', route: '/fx-d/', lifecycle: 'published_noindex' }),
    entry({ id: 'fx-e', route: '/fx-e/', lifecycle: 'index_candidate' }),
    entry({ id: 'fx-f', route: '/fx-f/' }, false),
    entry({ id: 'fx-g', route: '/fx-g/', publicationScore: null }),
  ];

  it('includes only effectively indexable canonical production URLs', () => {
    expect(sitemapUrls(all, FIXTURE_PROD)).toEqual(['https://fixture-origin.invalid/fx-a/']);
  });
  it('is empty in preview and development', () => {
    expect(sitemapUrls(all, FIXTURE_PREVIEW)).toEqual([]);
    expect(sitemapUrls(all, FIXTURE_DEV)).toEqual([]);
  });
  it('renders valid XML and escapes', () => {
    const xml = renderSitemap(['https://fixture-origin.invalid/a/?x=1&y=2']);
    expect(xml).toContain('<loc>https://fixture-origin.invalid/a/?x=1&amp;y=2</loc>');
    expect(renderSitemap([])).toContain('<urlset');
  });
});

describe('canonicals', () => {
  it('are generated centrally from the configured origin', () => {
    expect(canonicalUrl('/a/b/', FIXTURE_PROD)).toBe('https://fixture-origin.invalid/a/b/');
    expect(canonicalUrl('/', FIXTURE_DEV)).toBeNull();
    expect(() => canonicalUrl('/Bad', FIXTURE_PROD)).toThrow();
  });
});

describe('robots.txt', () => {
  it('never uses Disallow as a substitute for noindex, and advertises a sitemap only in production', () => {
    const preview = renderRobotsTxt(FIXTURE_PREVIEW);
    expect(preview).not.toMatch(/Disallow/);
    expect(preview).not.toMatch(/Sitemap:/);
    const prod = renderRobotsTxt(FIXTURE_PROD);
    expect(prod).not.toMatch(/Disallow/);
    expect(prod).toContain('Sitemap: https://fixture-origin.invalid/sitemap.xml');
  });
});

describe('draft shipping guard', () => {
  it('refuses to build draft pages for production only', () => {
    const d = entry({ lifecycle: 'draft' });
    expect(() => assertShippable(d, FIXTURE_PROD)).toThrow(/draft/);
    expect(() => assertShippable(d, FIXTURE_PREVIEW)).not.toThrow();
  });
});
