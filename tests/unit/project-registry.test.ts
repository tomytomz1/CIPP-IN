/** Tests against the REAL project registry (not fixtures). Phase 2A: nothing may be indexable. */
import { describe, expect, it } from 'vitest';
import { buildRegistry } from '../../src/lib/publication/registry.ts';
import { sitemapUrls } from '../../src/lib/seo/firewall.ts';
import { loadRawApprovals, loadRawRecords } from '../../scripts/lib/load-project.ts';
import { FIXTURE_NOW, FIXTURE_PROD, approvalFor, passingInput } from '../fixtures/records.ts';

describe('project registry', () => {
  const registry = buildRegistry(loadRawRecords(), loadRawApprovals(), { now: new Date() });

  it('validates every real record and the approval registry', () => {
    expect(registry.entries.length).toBeGreaterThan(0);
  });
  it('contains zero effectively indexable project pages and zero approvals', () => {
    expect(registry.entries.filter((e) => e.evaluation.effectiveIndexable)).toEqual([]);
    expect(registry.approvals).toEqual([]);
  });
  it('would produce an empty production sitemap', () => {
    expect(sitemapUrls(registry.entries, FIXTURE_PROD)).toEqual([]);
  });
  it('contains no fixture records', () => {
    expect(registry.entries.some((e) => e.record.fixture)).toBe(false);
  });
});

describe('registry validation (fixtures)', () => {
  const noApprovals = { schemaVersion: 1, approvals: [] };
  const draft = () => passingInput({ lifecycle: 'draft' });

  it('rejects fixture records in the project registry', () => {
    expect(() => buildRegistry([{ source: 'fx', data: passingInput() }], noApprovals, { now: FIXTURE_NOW })).toThrow(
      /fixtures must never/,
    );
  });
  it('fails when a record requests "indexable" but fails the gate (no silent downgrade)', () => {
    expect(() =>
      buildRegistry([{ source: 'fx', data: passingInput() }], noApprovals, { now: FIXTURE_NOW, allowFixtures: true }),
    ).toThrow(/requests lifecycle "indexable" but fails/);
  });
  it('passes when gates and operator approval are present', () => {
    const data = passingInput();
    const approvals = { schemaVersion: 1, approvals: [approvalFor({ id: 'fixture-general', route: '/fixture-general/' })] };
    const reg = buildRegistry([{ source: 'fx', data }], approvals, { now: FIXTURE_NOW, allowFixtures: true });
    expect(reg.entries[0]!.evaluation.effectiveIndexable).toBe(true);
  });
  it('rejects duplicate ids/routes', () => {
    expect(() =>
      buildRegistry([{ source: 'a', data: draft() }, { source: 'b', data: draft() }], noApprovals, { now: FIXTURE_NOW, allowFixtures: true }),
    ).toThrow(/duplicate/);
  });
  it('rejects approvals for unknown pages', () => {
    const approvals = { schemaVersion: 1, approvals: [approvalFor({ id: 'ghost', route: '/ghost/' })] };
    expect(() => buildRegistry([{ source: 'a', data: draft() }], approvals, { now: FIXTURE_NOW, allowFixtures: true })).toThrow(
      /unknown page id/,
    );
  });
});
