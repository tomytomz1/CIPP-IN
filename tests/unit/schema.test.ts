/** Schema rejection tests. All inputs are ARTIFICIAL FIXTURES. */
import { describe, expect, it } from 'vitest';
import { indexApprovalRegistrySchema, publicationRecordSchema } from '../../src/lib/publication/schema.ts';
import { LIFECYCLE_STATES, MUNICIPALITY_CATEGORIES } from '../../src/lib/publication/constants.ts';
import { passingInput } from '../fixtures/records.ts';

const ok = (o: Record<string, unknown> = {}) => publicationRecordSchema.safeParse(passingInput(o)).success;

describe('publication record schema', () => {
  it('accepts the passing fixture', () => {
    expect(ok()).toBe(true);
  });

  it('has exactly the five locked lifecycle states', () => {
    expect(LIFECYCLE_STATES).toEqual(['draft', 'review', 'published_noindex', 'index_candidate', 'indexable']);
    expect(ok({ lifecycle: 'published' })).toBe(false);
    expect(ok({ lifecycle: 'approved' })).toBe(false);
  });

  it('rejects a hand-typed publication total', () => {
    const score = passingInput()['publicationScore'] as Record<string, unknown>;
    expect(ok({ publicationScore: { ...score, total: 100 } })).toBe(false);
    expect(ok({ publicationScore: { ...score, components: { ...(score['components'] as object), total: 100 } } })).toBe(false);
  });

  it('rejects out-of-range score components', () => {
    const score = passingInput()['publicationScore'] as Record<string, unknown>;
    expect(ok({ publicationScore: { ...score, components: { ...(score['components'] as object), conversionUsefulness: 6 } } })).toBe(false);
  });

  it('rejects unknown top-level keys (e.g. a force-index flag or an embedded approval)', () => {
    expect(ok({ forceIndexable: true })).toBe(false);
    expect(ok({ operatorApproved: true })).toBe(false);
  });

  it('rejects missing required fields and malformed routes', () => {
    const input = passingInput();
    delete input['hardGates'];
    expect(publicationRecordSchema.safeParse(input).success).toBe(false);
    expect(ok({ route: '/No-Trailing' })).toBe(false);
    expect(ok({ route: 'relative/' })).toBe(false);
  });

  it('rejects FACT claims without evidence and unknown claim classes', () => {
    expect(ok({ claims: [{ id: 'c', classification: 'FACT', evidenceRefs: [] }] })).toBe(false);
    expect(ok({ claims: [{ id: 'c', classification: 'OPINION', evidenceRefs: ['x'] }] })).toBe(false);
  });

  it('rejects expert-review outcomes without a real reviewer', () => {
    expect(ok({ expertReview: { required: true, reviewer: null, scope: 'x', date: '2026-09-18', outcome: 'approved' } })).toBe(false);
  });

  it('rejects non-locked similarity models', () => {
    const run = (passingInput()['similarity'] as Record<string, unknown>[])[0]!;
    expect(ok({ similarity: [{ ...run, model: 'text-embedding-3-large' }] })).toBe(false);
  });

  it('allows not_applicable only for step 13 and only when review is not required', () => {
    const wf = passingInput()['workflow'] as Record<string, unknown>;
    expect(ok({ workflow: { ...wf, '5': { status: 'not_applicable' } } })).toBe(false);
    expect(
      ok({
        workflow: { ...wf, '13': { status: 'not_applicable' } },
        expertReview: { required: true, reviewer: null, scope: null, date: null, outcome: null },
      }),
    ).toBe(false);
  });

  it('requires a municipality gate for location pages only', () => {
    expect(ok({ pageType: 'location', municipalityGate: null })).toBe(false);
  });

  it('rejects qualifying municipality categories without evidence', () => {
    const cat = { qualifies: true, authoritativeLocalPrimary: false, evidenceRefs: [] };
    const gate = { municipality: 'FIXTURE', categories: Object.fromEntries(MUNICIPALITY_CATEGORIES.map((k) => [k, cat])) };
    expect(ok({ pageType: 'location', municipalityGate: gate })).toBe(false);
  });
});

describe('index approval registry schema', () => {
  const entry = { pageId: 'fixture-general', route: '/fixture-general/', approved: true, approvedBy: 'tomytomz1', approvedAt: '2026-09-18' };
  const parse = (approvals: unknown[]) => indexApprovalRegistrySchema.safeParse({ schemaVersion: 1, approvals }).success;

  it('accepts a valid operator approval', () => {
    expect(parse([entry])).toBe(true);
  });
  it('rejects false or unknown approval values', () => {
    expect(parse([{ ...entry, approved: false }])).toBe(false);
    expect(parse([{ ...entry, approved: 'yes' }])).toBe(false);
    const { approved: _omit, ...missing } = entry;
    expect(parse([missing])).toBe(false);
  });
  it('rejects approvals by anyone other than the operator', () => {
    expect(parse([{ ...entry, approvedBy: 'contractor-renter' }])).toBe(false);
  });
});
