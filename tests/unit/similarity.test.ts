/**
 * Similarity QA runner tests (docs/03 -> Semantic Similarity QA; docs/04 workflow step 14).
 *
 * The deterministic checks must be exactly that - deterministic - and the embedding check must
 * fail closed without an API key. No network call is made: `fetch` is stubbed to throw, and the
 * embedding transport is injected.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOCKED_EMBEDDING_MODEL,
  OPENAI_EMBEDDINGS_URL,
  contentHash,
  cosineSimilarity,
  embedTexts,
  headingArchitecturePercent,
  headings,
  mainContent,
  runSimilarityQa,
  sentenceDuplicationPercent,
  sentences,
  visibleText,
} from '../../scripts/lib/similarity.ts';
import { SIMILARITY } from '../../src/lib/publication/constants.ts';

let networkCalls = 0;
beforeEach(() => {
  networkCalls = 0;
  vi.stubGlobal('fetch', () => {
    networkCalls += 1;
    throw new Error('network access is not allowed in tests');
  });
});
afterEach(() => {
  expect(networkCalls).toBe(0);
  vi.unstubAllGlobals();
});

const thresholds = {
  manualReviewCosine: SIMILARITY.manualReviewCosine,
  blockedCosine: SIMILARITY.blockedCosine,
  presumedDuplicateCosine: SIMILARITY.presumedDuplicateCosine,
  sentenceNearDuplicationPercent: SIMILARITY.sentenceNearDuplicationPercent,
  headingArchitecturePercent: SIMILARITY.headingArchitecturePercent,
};

const page = (main: string) =>
  `<!doctype html><html><head><title>t</title></head><body>` +
  `<a class="skip-link" href="#main">Skip to main content</a>` +
  `<header><p>Indy Sewer Resource</p></header>` +
  `<main id="main" tabindex="-1">${main}</main>` +
  `<footer><p>Independent resource. It is not a plumbing company and performs no repairs at all.</p></footer>` +
  `</body></html>`;

const PARAGRAPH_A =
  '<h2>Who is responsible</h2><p>The property owner is responsible for the building sewer all the way to the public main in Lawrence.</p>' +
  '<p>A permit is required before a repair, and the utility must approve the finished work on video.</p>';
const PARAGRAPH_B =
  '<h2>How this resource works</h2><p>Sources are used in a fixed order, beginning with the ordinance and the utility policy manual.</p>' +
  '<p>Nothing is published as fact unless a cited document actually supports the statement being made.</p>';

describe('deterministic text extraction', () => {
  it('isolates the page body from shared site chrome', () => {
    const html = page(PARAGRAPH_A);
    const text = visibleText(mainContent(html));
    expect(text).toContain('building sewer');
    // Guards a real defect: without this, every page "duplicates" every other page's footer.
    expect(text).not.toContain('Skip to main content');
    expect(text).not.toContain('not a plumbing company');
    // A document with no <main> falls back to the whole document rather than returning nothing.
    expect(visibleText(mainContent('<p>No main element here at all, just a paragraph.</p>'))).toContain('No main element');
  });

  it('hashes content stably and ignores insignificant whitespace', () => {
    expect(contentHash('a b c')).toBe(contentHash('a   b\n c '));
    expect(contentHash('a b c')).not.toBe(contentHash('a b d'));
    expect(contentHash('a b c')).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('keeps only sentences long enough to be meaningful, normalized and de-duplicated', () => {
    const list = sentences('Short one. The property owner is responsible for the building sewer to the public main. The property owner is responsible for the building sewer to the public main.');
    expect(list).toHaveLength(1);
    expect(list[0]).toBe('the property owner is responsible for the building sewer to the public main');
  });
});

describe('deterministic duplication checks', () => {
  it('scores identical text 100% and unrelated text 0%', () => {
    const a = sentences(visibleText(mainContent(page(PARAGRAPH_A))));
    const b = sentences(visibleText(mainContent(page(PARAGRAPH_B))));
    expect(sentenceDuplicationPercent(a, a)).toBe(100);
    expect(sentenceDuplicationPercent(a, b)).toBe(0);
    expect(sentenceDuplicationPercent([], a)).toBe(0);
  });

  it('detects near-duplicates, not only exact repeats', () => {
    const original = sentences('The property owner is responsible for the building sewer all the way to the public main.');
    const reworded = sentences('The property owner is responsible for the building sewer all the way to the public sewer main.');
    expect(sentenceDuplicationPercent(original, reworded)).toBe(100);
  });

  it('compares heading architecture by level and wording', () => {
    const a = headings(mainContent(page('<h2>Who is responsible</h2><h3>Permits</h3>')));
    const b = headings(mainContent(page('<h2>Who is responsible</h2><h3>Permits</h3>')));
    const c = headings(mainContent(page('<h2>What a camera settles</h2><h3>Video</h3>')));
    const wrongLevel = headings(mainContent(page('<h3>Who is responsible</h3>')));
    expect(headingArchitecturePercent(a, b)).toBe(100);
    expect(headingArchitecturePercent(a, c)).toBe(0);
    expect(headingArchitecturePercent(wrongLevel, a)).toBe(0);
    expect(headingArchitecturePercent([], a)).toBe(0);
  });

  it('computes cosine similarity correctly', () => {
    expect(cosineSimilarity([1, 0, 1], [1, 0, 1])).toBeCloseTo(1, 10);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
    expect(cosineSimilarity([1, 1], [0, 0])).toBe(0);
    expect(() => cosineSimilarity([1, 2], [1])).toThrow(/equal, non-zero length/);
  });
});

describe('embedding check fails closed', () => {
  it('does not run, and does not call out, without an API key', async () => {
    const result = await embedTexts(['text'], {});
    expect(result).toMatchObject({ ok: false, status: 'not_run' });
    if (!result.ok) expect(result.reason).toMatch(/OPENAI_API_KEY/);
    expect(networkCalls).toBe(0);
  });

  it('refuses any model other than the locked one', async () => {
    const fetchImpl = vi.fn();
    const result = await embedTexts(['text'], { apiKey: 'TEST-ONLY-key', model: 'some-other-model', fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result).toMatchObject({ ok: false, status: 'not_run' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(LOCKED_EMBEDDING_MODEL).toBe('text-embedding-3-small');
  });

  it('parses a synthetic response from the documented endpoint', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = ((url: string, init: RequestInit) => {
      calls.push({ url, init });
      return Promise.resolve(
        new Response(JSON.stringify({ data: [{ embedding: [0, 1] }, { embedding: [1, 0] }] }), { status: 200 }),
      );
    }) as unknown as typeof fetch;

    const result = await embedTexts(['a', 'b'], { apiKey: 'TEST-ONLY-key', fetchImpl });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.vectors).toEqual([[0, 1], [1, 0]]);
    expect(calls[0]?.url).toBe(OPENAI_EMBEDDINGS_URL);
    expect(JSON.parse(String(calls[0]?.init.body))).toMatchObject({ model: LOCKED_EMBEDDING_MODEL, input: ['a', 'b'] });
  });

  it('treats a bad response as not_run rather than inventing a score', async () => {
    for (const response of [
      new Response('nope', { status: 500 }),
      new Response(JSON.stringify({ data: [{ embedding: [0, 1] }] }), { status: 200 }),
      new Response(JSON.stringify({ data: [{ embedding: ['x', 'y'] }, { embedding: [1, 0] }] }), { status: 200 }),
    ]) {
      const result = await embedTexts(['a', 'b'], {
        apiKey: 'TEST-ONLY-key',
        fetchImpl: (() => Promise.resolve(response)) as unknown as typeof fetch,
      });
      expect(result).toMatchObject({ ok: false, status: 'not_run' });
    }
  });
});

describe('similarity QA run', () => {
  const candidate = { ref: '/candidate/', kind: 'site_page' as const, html: page(PARAGRAPH_A) };

  it('reports scores, hashes, and an honest not_run embedding state', async () => {
    const report = await runSimilarityQa(candidate, [{ ref: '/other/', kind: 'site_page', html: page(PARAGRAPH_B) }], thresholds, {
      now: new Date('2026-09-20T04:00:00.000Z'),
    });

    expect(report.model).toBe(LOCKED_EMBEDDING_MODEL);
    expect(report.runAt).toBe('2026-09-20T04:00:00.000Z');
    expect(report.candidateHash).toMatch(/^sha256:/);
    expect(report.embedding.status).toBe('not_run');
    expect(report.comparisons).toHaveLength(1);
    expect(report.comparisons[0]).toMatchObject({
      comparisonRef: '/other/',
      comparisonKind: 'site_page',
      cosine: null,
      sentenceDuplicationPercent: 0,
      headingArchitecturePercent: 0,
      flags: [],
    });
    expect(report.requiresManualReview).toEqual([]);
  });

  it('flags a page that repackages another page', async () => {
    const report = await runSimilarityQa(candidate, [{ ref: '/copy/', kind: 'site_page', html: page(PARAGRAPH_A) }], thresholds);
    expect(report.comparisons[0]?.sentenceDuplicationPercent).toBe(100);
    expect(report.comparisons[0]?.headingArchitecturePercent).toBe(100);
    expect(report.comparisons[0]?.flags.join(' ')).toMatch(/sentence near-duplication/);
    expect(report.requiresManualReview).toEqual(['/copy/']);
  });

  it('records competitor comparisons by reference and hash only, never their text', async () => {
    const competitorBody = 'Call us today for the best sewer repair prices in central Indiana and a free estimate.';
    const report = await runSimilarityQa(
      candidate,
      [{ ref: 'https://competitor.example/repair', kind: 'competitor_page', html: page(`<p>${competitorBody}</p>`) }],
      thresholds,
    );
    const serialized = JSON.stringify(report);
    expect(serialized).toContain('https://competitor.example/repair');
    expect(serialized).toContain('sha256:');
    expect(serialized).not.toContain('free estimate');
    expect(serialized).not.toContain(competitorBody);
  });

  it('produces cosine scores when an embedding transport is available', async () => {
    const fetchImpl = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [{ embedding: [1, 0] }, { embedding: [0.9, 0.436] }] }), { status: 200 }),
      )) as unknown as typeof fetch;
    const report = await runSimilarityQa(candidate, [{ ref: '/other/', kind: 'site_page', html: page(PARAGRAPH_B) }], thresholds, {
      embedding: { apiKey: 'TEST-ONLY-key', fetchImpl },
    });
    expect(report.embedding.status).toBe('run');
    expect(report.comparisons[0]?.cosine).toBeCloseTo(0.9, 2);
    // 0.9 is above the blocked threshold, so it must be flagged for manual review.
    expect(report.comparisons[0]?.flags.join(' ')).toMatch(/blocked pending review/);
  });
});
