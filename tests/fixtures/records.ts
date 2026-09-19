/**
 * ARTIFICIAL TEST FIXTURES — NOT PROJECT DATA.
 * Every value below is invented solely to exercise the evaluator. None of it is a fact
 * about Lawrence, Indianapolis, any contractor, reviewer, source, or page, and none of it
 * may ever be copied into content/, governance/, research/, or any published page.
 * All fixture records carry `fixture: true`, which the project registry rejects.
 */
import { publicationRecordSchema, type IndexApproval, type PublicationRecord } from '../../src/lib/publication/schema.ts';
import { MUNICIPALITY_CATEGORIES, WORKFLOW_STEPS } from '../../src/lib/publication/constants.ts';
import type { SiteConfig } from '../../src/config/site.ts';

export const FIXTURE_NOW = new Date('2026-09-19T12:00:00Z');
export const FIXTURE_ORIGIN = 'https://fixture-origin.invalid';
export const FIXTURE_PROD: SiteConfig = { environment: 'production', origin: FIXTURE_ORIGIN, indexingAllowed: true };
export const FIXTURE_PREVIEW: SiteConfig = { environment: 'preview', origin: FIXTURE_ORIGIN, indexingAllowed: false };
export const FIXTURE_DEV: SiteConfig = { environment: 'development', origin: null, indexingAllowed: false };

const passGate = { result: 'pass', checkedBy: 'fixture-checker', date: '2026-09-18' } as const;

/** A fixture record that passes every gate (general page, score 80). */
export function passingInput(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    fixture: true,
    id: 'fixture-general',
    route: '/fixture-general/',
    pageType: 'general',
    title: 'FIXTURE general page',
    description: 'FIXTURE — artificial test data, not a real page.',
    targetIntent: 'FIXTURE intent',
    owner: 'fixture-owner',
    lifecycle: 'indexable',
    workflow: Object.fromEntries(Object.keys(WORKFLOW_STEPS).map((k) => [k, { status: 'complete' }])),
    evidence: {
      packageRefs: ['fixture-evidence-package'],
      primarySources: [
        { id: 'fixture-src-1', title: 'FIXTURE source', lastVerified: '2026-09-01', reverifyBy: '2027-03-01' },
      ],
    },
    claims: [{ id: 'fixture-claim-1', classification: 'FACT', evidenceRefs: ['fixture-src-1'] }],
    expertReview: { required: false, reviewer: null, scope: null, date: null, outcome: null },
    similarity: [
      {
        model: 'text-embedding-3-small',
        tooling: 'fixture-tooling',
        runAt: '2026-09-18T10:00:00Z',
        candidateHash: 'fixture-hash-a',
        comparisonCorpus: 'fixture-corpus',
        comparisons: [
          {
            comparisonRef: 'fixture-other-page',
            comparisonKind: 'site_page',
            comparisonHash: 'fixture-hash-b',
            cosine: 0.5,
            sentenceDuplicationPercent: 2,
            headingArchitecturePercent: 10,
            manualReview: null,
          },
        ],
      },
    ],
    publicationScore: {
      // Totals exactly 80.
      components: {
        originalLocalInformation: 16,
        primarySourceEvidence: 8,
        homeownerDecisionUtility: 12,
        expertVerification: 8,
        originalMediaTool: 8,
        proprietaryFirstPartyData: 8,
        nonCommodityDistinctiveness: 8,
        technicalInternalLinkQuality: 4,
        transparencyTrust: 4,
        conversionUsefulness: 4,
      },
      scorer: 'fixture-scorer',
      date: '2026-09-18',
    },
    municipalityGate: null,
    hardGates: {
      commodityContentTest: passGate,
      perfectAiDetectionTest: passGate,
      doorwayPageFirewall: passGate,
      technicalSeoQa: passGate,
      internalLinkingQa: passGate,
      conversionQa: passGate,
    },
    siteQuality: [],
    ...overrides,
  };
}

export function parse(input: Record<string, unknown>): PublicationRecord {
  return publicationRecordSchema.parse(input);
}

export function approvalFor(record: { id: string; route: string }): IndexApproval {
  return { pageId: record.id, route: record.route, approved: true, approvedBy: 'tomytomz1', approvedAt: '2026-09-18' };
}

/** Municipality gate fixture with `n` qualifying categories, the first `primary` of them authoritative. */
export function municipalityGate(n: number, primary: number) {
  return {
    municipality: 'FIXTURE-TOWN',
    categories: Object.fromEntries(
      MUNICIPALITY_CATEGORIES.map((k, i) => [
        k,
        {
          qualifies: i < n,
          authoritativeLocalPrimary: i < n && i < primary,
          evidenceRefs: i < n ? [`fixture-evidence-${i}`] : [],
        },
      ]),
    ),
  };
}

/** Score components summing to `total` (for 80–100 ranges used in tests). */
export function componentsSumming(total: number) {
  const max = {
    originalLocalInformation: 20,
    primarySourceEvidence: 10,
    homeownerDecisionUtility: 15,
    expertVerification: 10,
    originalMediaTool: 10,
    proprietaryFirstPartyData: 10,
    nonCommodityDistinctiveness: 10,
    technicalInternalLinkQuality: 5,
    transparencyTrust: 5,
    conversionUsefulness: 5,
  } as Record<string, number>;
  let remaining = 100 - total;
  const out: Record<string, number> = {};
  for (const [k, m] of Object.entries(max)) {
    const take = Math.min(remaining, m);
    out[k] = m - take;
    remaining -= take;
  }
  return out;
}
