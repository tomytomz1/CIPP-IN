/** Indexability evaluator tests. All records are ARTIFICIAL FIXTURES (tests/fixtures/records.ts). */
import { describe, expect, it } from 'vitest';
import { evaluateIndexability, calculatePublicationScore } from '../../src/lib/publication/evaluate.ts';
import {
  PUBLICATION_THRESHOLDS,
  SIMILARITY,
  MUNICIPALITY_MIN_CATEGORIES,
  MUNICIPALITY_MIN_AUTHORITATIVE_LOCAL,
} from '../../src/lib/publication/constants.ts';
import {
  FIXTURE_NOW,
  approvalFor,
  componentsSumming,
  municipalityGate,
  parse,
  passingInput,
} from '../fixtures/records.ts';

function scoreOf(total: number) {
  return { components: componentsSumming(total), scorer: 'fixture-scorer', date: '2026-09-18' };
}
function evalFixture(overrides: Record<string, unknown> = {}, opts: { approve?: boolean } = {}) {
  const record = parse(passingInput(overrides));
  const approvals = opts.approve === false ? [] : [approvalFor(record)];
  return evaluateIndexability(record, approvals, { now: FIXTURE_NOW });
}
const locationOverrides = (total: number, n = 6, primary = 3) => ({
  id: 'fixture-location',
  route: '/fixture-location/',
  pageType: 'location',
  publicationScore: scoreOf(total),
  municipalityGate: municipalityGate(n, primary),
});

describe('locked thresholds are unchanged', () => {
  it('matches docs/03', () => {
    expect(PUBLICATION_THRESHOLDS).toEqual({ general: 80, money: 85, location: 85 });
    expect(SIMILARITY.manualReviewCosine).toBe(0.82);
    expect(SIMILARITY.blockedCosine).toBe(0.88);
    expect(SIMILARITY.presumedDuplicateCosine).toBe(0.92);
    expect(SIMILARITY.sentenceNearDuplicationPercent).toBe(20);
    expect(SIMILARITY.headingArchitecturePercent).toBe(70);
    expect(SIMILARITY.lockedEmbeddingModel).toBe('text-embedding-3-small');
    expect(MUNICIPALITY_MIN_CATEGORIES).toBe(5);
    expect(MUNICIPALITY_MIN_AUTHORITATIVE_LOCAL).toBe(2);
  });
});

describe('required evaluator scenarios', () => {
  it('1. complete general page passes at 80+', () => {
    const r = evalFixture({ publicationScore: scoreOf(80) });
    expect(r.score).toEqual({ calculated: 80, required: 80, passed: true });
    expect(r.effectiveIndexable).toBe(true);
  });

  it('2. general page fails at 79', () => {
    const r = evalFixture({ publicationScore: scoreOf(79) });
    expect(r.score).toEqual({ calculated: 79, required: 80, passed: false });
    expect(r.effectiveIndexable).toBe(false);
    expect(r.blockingReasons.join()).toMatch(/79 < required 80/);
  });

  it('3. location page fails at 84', () => {
    const r = evalFixture(locationOverrides(84));
    expect(r.score).toEqual({ calculated: 84, required: 85, passed: false });
    expect(r.effectiveIndexable).toBe(false);
  });

  it('4. location page passes score but fails municipality gate', () => {
    const r = evalFixture(locationOverrides(95, 4, 4));
    expect(r.score.passed).toBe(true);
    expect(r.gates.find((g) => g.gate === 'locationPageQualityGate')?.status).toBe('fail');
    expect(r.effectiveIndexable).toBe(false);
  });

  it('5. page scores 100 but fails Commodity Content Test', () => {
    const base = passingInput();
    const r = evalFixture({
      publicationScore: scoreOf(100),
      hardGates: { ...(base['hardGates'] as object), commodityContentTest: { result: 'fail', checkedBy: 'fixture', date: '2026-09-18' } },
    });
    expect(r.score.calculated).toBe(100);
    expect(r.hardGatesPassed).toBe(false);
    expect(r.effectiveIndexable).toBe(false);
    expect(r.blockingReasons.join()).toMatch(/commodityContentTest/);
  });

  it('6. otherwise passes but lacks expert review when required', () => {
    const r = evalFixture({ expertReview: { required: true, reviewer: null, scope: null, date: null, outcome: null } });
    expect(r.gates.find((g) => g.gate === 'expertReview')?.status).toBe('fail');
    expect(r.effectiveIndexable).toBe(false);
  });

  it('7. otherwise passes but evidence is stale', () => {
    const r = evalFixture({
      evidence: {
        packageRefs: ['fixture-evidence-package'],
        primarySources: [{ id: 'fixture-old', title: 'FIXTURE', lastVerified: '2025-01-01', reverifyBy: '2026-09-18' }],
      },
    });
    expect(r.evidence).toEqual({ current: false, staleSources: ['fixture-old'] });
    expect(r.effectiveIndexable).toBe(false);
  });

  it('8. otherwise passes but lacks operator approval', () => {
    const r = evalFixture({}, { approve: false });
    expect(r.hardGatesPassed).toBe(true);
    expect(r.operatorApproval.present).toBe(false);
    expect(r.effectiveIndexable).toBe(false);
  });

  it('9. otherwise passes but similarity QA is blocked', () => {
    const base = passingInput();
    const run = (base['similarity'] as Record<string, unknown>[])[0]!;
    const r = evalFixture({
      similarity: [{ ...run, comparisons: [{ ...(run['comparisons'] as object[])[0], cosine: 0.9, manualReview: null }] }],
    });
    expect(r.gates.find((g) => g.gate === 'semanticSimilarityQa')?.status).toBe('fail');
    expect(r.effectiveIndexable).toBe(false);
  });

  it('10. valid indexable record passes', () => {
    const r = evalFixture(locationOverrides(90, 5, 2));
    expect(r.hardGatesPassed).toBe(true);
    expect(r.score).toEqual({ calculated: 90, required: 85, passed: true });
    expect(r.evidence.current).toBe(true);
    expect(r.operatorApproval.present).toBe(true);
    expect(r.effectiveIndexable).toBe(true);
    expect(r.blockingReasons).toEqual([]);
  });
});

describe('additional firewall rules', () => {
  it('lifecycle text alone cannot bypass the evaluator', () => {
    const r = evalFixture({ lifecycle: 'indexable', publicationScore: null });
    expect(r.requestsIndexing).toBe(true);
    expect(r.effectiveIndexable).toBe(false);
  });

  it('a fully passing page that is not in lifecycle "indexable" stays non-indexable', () => {
    for (const lifecycle of ['draft', 'review', 'published_noindex', 'index_candidate']) {
      expect(evalFixture({ lifecycle }).effectiveIndexable).toBe(false);
    }
  });

  it('utility pages are never indexable', () => {
    expect(evalFixture({ pageType: 'utility' }).effectiveIndexable).toBe(false);
  });

  it('money pages require 85', () => {
    expect(evalFixture({ pageType: 'money', publicationScore: scoreOf(84) }).effectiveIndexable).toBe(false);
    expect(evalFixture({ pageType: 'money', publicationScore: scoreOf(85) }).effectiveIndexable).toBe(true);
  });

  it('municipality gate is exactly ≥5 of 8 with ≥2 authoritative local', () => {
    expect(evalFixture(locationOverrides(90, 5, 1)).effectiveIndexable).toBe(false);
    expect(evalFixture(locationOverrides(90, 4, 4)).effectiveIndexable).toBe(false);
    expect(evalFixture(locationOverrides(90, 5, 2)).effectiveIndexable).toBe(true);
    expect(evalFixture(locationOverrides(90, 8, 8)).effectiveIndexable).toBe(true);
  });

  it('approval for a different route does not count', () => {
    const record = parse(passingInput());
    const r = evaluateIndexability(record, [{ ...approvalFor(record), route: '/elsewhere/' }], { now: FIXTURE_NOW });
    expect(r.operatorApproval.present).toBe(false);
    expect(r.effectiveIndexable).toBe(false);
  });

  it('incomplete workflow blocks indexing; step 13 may be not_applicable only when review is not required', () => {
    const wf = passingInput()['workflow'] as Record<string, unknown>;
    expect(evalFixture({ workflow: { ...wf, '7': { status: 'in_progress' } } }).effectiveIndexable).toBe(false);
    expect(evalFixture({ workflow: { ...wf, '13': { status: 'not_applicable' } } }).effectiveIndexable).toBe(true);
  });

  it('no claims recorded blocks indexing', () => {
    expect(evalFixture({ claims: [] }).effectiveIndexable).toBe(false);
  });
});

describe('semantic similarity thresholds', () => {
  const base = passingInput();
  const run = (base['similarity'] as Record<string, unknown>[])[0]!;
  const cmp = (run['comparisons'] as Record<string, unknown>[])[0]!;
  const withCmp = (c: Record<string, unknown>) => evalFixture({ similarity: [{ ...run, comparisons: [{ ...cmp, ...c }] }] });
  const cleared = { outcome: 'cleared', reason: 'FIXTURE reviewed', reviewer: 'fixture-reviewer', date: '2026-09-18' };

  it('cosine below 0.82 passes without review', () => {
    expect(withCmp({ cosine: 0.8199 }).effectiveIndexable).toBe(true);
  });
  it('cosine 0.82 requires manual review', () => {
    expect(withCmp({ cosine: 0.82 }).effectiveIndexable).toBe(false);
    expect(withCmp({ cosine: 0.82, manualReview: cleared }).effectiveIndexable).toBe(true);
  });
  it('cosine above 0.92 is presumed duplication unless a manual review clears it', () => {
    expect(withCmp({ cosine: 0.95 }).blockingReasons.join()).toMatch(/presumed duplication/);
  });
  it('a blocked manual review blocks even below thresholds', () => {
    expect(withCmp({ cosine: 0.5, manualReview: { ...cleared, outcome: 'blocked' } }).effectiveIndexable).toBe(false);
  });
  it('sentence duplication ≥20% and heading architecture ≥70% are flagged', () => {
    expect(withCmp({ sentenceDuplicationPercent: 20 }).effectiveIndexable).toBe(false);
    expect(withCmp({ sentenceDuplicationPercent: 19.9 }).effectiveIndexable).toBe(true);
    expect(withCmp({ headingArchitecturePercent: 70 }).effectiveIndexable).toBe(false);
    expect(withCmp({ headingArchitecturePercent: 69.9 }).effectiveIndexable).toBe(true);
  });
  it('no similarity run blocks indexing', () => {
    expect(evalFixture({ similarity: [] }).effectiveIndexable).toBe(false);
  });
});

describe('publication score calculation', () => {
  it('is calculated from components', () => {
    expect(calculatePublicationScore(componentsSumming(87) as never)).toBe(87);
  });
  it('rejects out-of-range components', () => {
    expect(() => calculatePublicationScore({ ...componentsSumming(80), originalLocalInformation: 21 } as never)).toThrow();
  });
});
