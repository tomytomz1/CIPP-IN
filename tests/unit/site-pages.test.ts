/**
 * Phase 2D guards for the real (non-fixture) pages.
 *
 * These assert the project's own content records, not fixtures: every published page stays
 * non-indexable, the Lawrence page records the gaps it actually has, navigation cannot point at
 * a page that does not exist, and no reviewer or approval was invented.
 */
import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, PRODUCTION_ORIGIN } from '../../src/config/brand.ts';
import { buildRegistry } from '../../src/lib/publication/registry.ts';
import { loadRawApprovals, loadRawRecords } from '../../scripts/lib/load-project.ts';
import { isEffectivelyIndexable, robotsDirective } from '../../src/lib/seo/firewall.ts';

const registry = buildRegistry(loadRawRecords(), loadRawApprovals(), { now: new Date() });
const production = { environment: 'production' as const, origin: PRODUCTION_ORIGIN, indexingAllowed: true };

describe('real site pages', () => {
  it('ship the three Phase 2D pages and nothing unexpected', () => {
    expect(registry.entries.map((e) => e.record.id).sort()).toEqual(['about', 'home', 'lawrence-sewer-lateral-repair']);
    for (const { record } of registry.entries) {
      expect({ id: record.id, fixture: record.fixture }).toEqual({ id: record.id, fixture: false });
      expect(['draft', 'published_noindex']).toContain(record.lifecycle);
    }
  });

  it('are not indexable, even in a production build on the registered domain', () => {
    expect(registry.approvals).toHaveLength(0);
    for (const entry of registry.entries) {
      expect({ id: entry.record.id, indexable: isEffectivelyIndexable(entry, production) }).toEqual({
        id: entry.record.id,
        indexable: false,
      });
      // Owning the domain changes the canonical host, not the robots directive.
      expect(robotsDirective(entry, production)).toBe('noindex, follow');
    }
  });

  it('records the Lawrence page gaps honestly instead of forcing the gate', () => {
    const entry = registry.byId('lawrence-sewer-lateral-repair');
    expect(entry).toBeDefined();
    const { record, evaluation } = entry!;

    // Expert review is required and has not happened. No reviewer was invented.
    expect(record.expertReview.required).toBe(true);
    expect(record.expertReview.reviewer).toBeNull();
    expect(record.expertReview.outcome).toBeNull();

    // Exactly the five categories the current evidence supports, all authoritative local primary.
    const gate = record.municipalityGate!;
    const qualifying = Object.entries(gate.categories).filter(([, c]) => c.qualifies);
    expect(qualifying.map(([k]) => k).sort()).toEqual([
      'municipalCippLiningBurstingRule',
      'municipalHousingPipeFailureEvidence',
      'municipalInfrastructureInformation',
      'municipalPermitRepairRequirement',
      'verifiedLateralResponsibility',
    ]);
    expect(qualifying.every(([, c]) => c.authoritativeLocalPrimary && c.evidenceRefs.length > 0)).toBe(true);
    // Categories without genuine evidence stay false; the count is never padded to clear the gate.
    expect(gate.categories.originalMunicipalVisualDataAsset.qualifies).toBe(false);
    expect(gate.categories.originalFirstPartyInterviewData.qualifies).toBe(false);
    expect(gate.categories.municipalCostPermitProjectEvidence.qualifies).toBe(false);

    // The publication score is recorded honestly and is below the money/location threshold.
    expect(evaluation.score.calculated).toBeLessThan(evaluation.score.required!);
    expect(record.publicationScore!.components.expertVerification).toBe(0);
    expect(record.publicationScore!.components.proprietaryFirstPartyData).toBe(0);

    // The blocking reasons name the real problems.
    const reasons = evaluation.blockingReasons.join(' | ');
    expect(reasons).toMatch(/expert review required but no reviewer recorded/);
    expect(reasons).toMatch(/no similarity QA run recorded/);
    expect(reasons).toMatch(/no operator index approval recorded/);
    expect(reasons).toMatch(/lifecycle is "published_noindex"/);
    // The location gate now passes on evidence, and the page is still not indexable.
    expect(reasons).not.toMatch(/evidence categories qualify/);
  });

  it('cites only evidence that exists in the repository, with re-verification dates', () => {
    const { record } = registry.byId('lawrence-sewer-lateral-repair')!;
    expect(record.evidence.packageRefs).toContain('research/sources/lawrence-primary-sources.json');
    expect(record.evidence.primarySources.length).toBeGreaterThanOrEqual(3);
    for (const source of record.evidence.primarySources) {
      expect(source.reverifyBy > source.lastVerified).toBe(true);
    }
    // Every FACT claim cites evidence; the uncited method descriptions stay an INFERENCE.
    for (const claim of record.claims) {
      if (claim.classification === 'FACT') expect(claim.evidenceRefs.length).toBeGreaterThan(0);
    }
    // Method mechanics moved from an uncited INFERENCE to a cited FACT in Phase 2E.
    const mechanics = record.claims.find((c) => c.id === 'repair-method-mechanics');
    expect(mechanics?.classification).toBe('FACT');
    expect(mechanics?.evidenceRefs).toContain('tech-001');
    // Reasoning about what a camera can and cannot settle stays an INFERENCE.
    expect(record.claims.find((c) => c.id === 'cctv-limits')?.classification).toBe('INFERENCE');
  });

  it('never points navigation at a page that does not exist', () => {
    const routes = new Set(registry.entries.map((e) => e.record.route));
    for (const item of NAV_ITEMS) expect({ href: item.href, known: routes.has(item.href) }).toEqual({ href: item.href, known: true });
  });
});
