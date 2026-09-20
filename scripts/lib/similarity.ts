/**
 * Semantic Similarity QA primitives (docs/03-GOOGLE-RESILIENCE.md -> Semantic Similarity QA,
 * docs/05-BUILD-SPEC.md -> Publication-Quality Enforcement).
 *
 * Three independent checks, exactly as the locked documents describe them:
 *   1. sentence-level near-duplication (deterministic)
 *   2. heading-architecture similarity (deterministic)
 *   3. embedding cosine similarity (OpenAI text-embedding-3-small, the locked model)
 *
 * The deterministic checks never need a network call or an API key, so they always run. The
 * embedding check fails CLOSED: with no API key it is reported as "not_run", which leaves the
 * Similarity QA gate unsatisfied and the page non-indexable.
 *
 * Nothing here stores third-party page bodies. A comparison keeps only a reference, a content
 * hash, and the resulting scores.
 */
import { createHash } from 'node:crypto';

export const LOCKED_EMBEDDING_MODEL = 'text-embedding-3-small';
export const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';
/** A sentence shorter than this (in words) is boilerplate-prone and is ignored. */
export const MIN_SENTENCE_WORDS = 6;
/** Token-overlap (Jaccard) at or above this counts two sentences as near-duplicates. */
export const NEAR_DUPLICATE_JACCARD = 0.8;

export interface Heading {
  level: number;
  text: string;
}

/** SHA-256 of the normalized text. Stable across runs and machines. */
export function contentHash(text: string): string {
  return `sha256:${createHash('sha256').update(normalizeWhitespace(text), 'utf8').digest('hex')}`;
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * The page's own content: the <main> element when present, otherwise the whole document.
 *
 * Site chrome (navigation, the site-wide disclosure footer, the pre-publication status line) is
 * identical on every page by design. Counting it would report duplication that says nothing about
 * the editorial content, which is what docs/03 -> Semantic Similarity QA is about.
 */
export function mainContent(html: string): string {
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  return main?.[1] ?? html;
}

/** Visible text of an HTML document: script, style, and markup removed. */
export function visibleText(html: string): string {
  const withoutBlocks = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const text = withoutBlocks.replace(/<[^>]+>/g, ' ');
  return normalizeWhitespace(decodeEntities(text));
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&[a-z]+;/gi, ' ');
}

/** Heading architecture (h1-h6) in document order. */
export function headings(html: string): Heading[] {
  const found: Heading[] = [];
  for (const match of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const level = Number(match[1]);
    const text = normalizeForCompare(visibleText(match[2] ?? ''));
    if (text) found.push({ level, text });
  }
  return found;
}

/** Lowercase, strip punctuation and collapse spaces, so wording is compared and not formatting. */
export function normalizeForCompare(text: string): string {
  return normalizeWhitespace(
    text
      .toLowerCase()
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[^\p{L}\p{N}'\s]/gu, ' '),
  );
}

/** Sentences worth comparing: normalized, de-duplicated, and long enough to be meaningful. */
export function sentences(text: string): string[] {
  const raw = normalizeWhitespace(text).split(/(?<=[.!?])\s+(?=[A-Z0-9"'“])/);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const part of raw) {
    const normalized = normalizeForCompare(part);
    if (normalized.split(' ').filter(Boolean).length < MIN_SENTENCE_WORDS) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function tokens(sentence: string): Set<string> {
  return new Set(sentence.split(' ').filter(Boolean));
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Percentage of the candidate's sentences that have a near-duplicate in the comparison text.
 * Deterministic: identical text scores 100, unrelated text scores near 0.
 */
export function sentenceDuplicationPercent(candidate: string[], comparison: string[]): number {
  if (candidate.length === 0) return 0;
  const comparisonTokens = comparison.map(tokens);
  let duplicated = 0;
  for (const sentence of candidate) {
    const candidateTokens = tokens(sentence);
    const isDuplicate = comparison.some(
      (other, i) => other === sentence || jaccard(candidateTokens, comparisonTokens[i]!) >= NEAR_DUPLICATE_JACCARD,
    );
    if (isDuplicate) duplicated += 1;
  }
  return round1((duplicated / candidate.length) * 100);
}

/**
 * Percentage of the candidate's headings that appear in the comparison at the same level with the
 * same wording. This is the "identical heading architecture" check in docs/03.
 */
export function headingArchitecturePercent(candidate: Heading[], comparison: Heading[]): number {
  if (candidate.length === 0) return 0;
  const pool = comparison.map((h) => `${h.level}:${h.text}`);
  const used = new Set<number>();
  let matched = 0;
  for (const heading of candidate) {
    const key = `${heading.level}:${heading.text}`;
    const index = pool.findIndex((entry, i) => entry === key && !used.has(i));
    if (index >= 0) {
      used.add(index);
      matched += 1;
    }
  }
  return round1((matched / candidate.length) * 100);
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || a.length !== b.length) throw new Error('cosine similarity needs two vectors of equal, non-zero length');
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export type EmbeddingResult =
  | { ok: true; model: string; vectors: number[][] }
  | { ok: false; status: 'not_run'; reason: string };

export interface EmbeddingOptions {
  apiKey?: string | undefined;
  fetchImpl?: typeof fetch;
  model?: string;
  timeoutMs?: number;
}

/**
 * Embeds texts with the locked model. Fails closed: without an API key it returns
 * `not_run` rather than substituting another model, a cached value, or a fabricated score.
 * No key is ever read from, or written to, the repository.
 */
export async function embedTexts(texts: readonly string[], options: EmbeddingOptions = {}): Promise<EmbeddingResult> {
  const model = options.model ?? LOCKED_EMBEDDING_MODEL;
  if (model !== LOCKED_EMBEDDING_MODEL) {
    return { ok: false, status: 'not_run', reason: `model "${model}" is not the locked model "${LOCKED_EMBEDDING_MODEL}"` };
  }
  const apiKey = (options.apiKey ?? '').trim();
  if (!apiKey) return { ok: false, status: 'not_run', reason: 'OPENAI_API_KEY is not set (no embedding run; similarity QA stays unsatisfied)' };
  if (texts.length === 0) return { ok: false, status: 'not_run', reason: 'nothing to embed' };

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
  try {
    const response = await fetchImpl(OPENAI_EMBEDDINGS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: texts }),
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, status: 'not_run', reason: `embedding request failed with HTTP ${response.status}` };
    const body: unknown = await response.json();
    const data = (body as { data?: { embedding?: unknown }[] }).data;
    if (!Array.isArray(data) || data.length !== texts.length) {
      return { ok: false, status: 'not_run', reason: 'embedding response did not contain one vector per input' };
    }
    const vectors: number[][] = [];
    for (const item of data) {
      const vector = item?.embedding;
      if (!Array.isArray(vector) || vector.some((v) => typeof v !== 'number')) {
        return { ok: false, status: 'not_run', reason: 'embedding response contained a malformed vector' };
      }
      vectors.push(vector as number[]);
    }
    return { ok: true, model, vectors };
  } catch (err) {
    const aborted = controller.signal.aborted || (err instanceof Error && err.name === 'AbortError');
    return { ok: false, status: 'not_run', reason: aborted ? 'embedding request timed out' : 'embedding request could not be sent' };
  } finally {
    clearTimeout(timer);
  }
}

export interface ComparisonInput {
  /** Page id, route, or competitor URL. Never a page body. */
  ref: string;
  kind: 'site_page' | 'competitor_page';
  html: string;
}

export interface ComparisonResult {
  comparisonRef: string;
  comparisonKind: 'site_page' | 'competitor_page';
  comparisonHash: string;
  /** null until an embedding run happens; the gate stays unsatisfied while it is null. */
  cosine: number | null;
  sentenceDuplicationPercent: number;
  headingArchitecturePercent: number;
  flags: string[];
}

export interface SimilarityReport {
  model: string;
  tooling: string;
  runAt: string;
  candidateRef: string;
  candidateHash: string;
  comparisonCorpus: string;
  embedding: { status: 'run' | 'not_run'; reason?: string };
  comparisons: ComparisonResult[];
  /** Every comparison that needs a recorded manual review before publication. */
  requiresManualReview: string[];
}

export interface Thresholds {
  manualReviewCosine: number;
  blockedCosine: number;
  presumedDuplicateCosine: number;
  sentenceNearDuplicationPercent: number;
  headingArchitecturePercent: number;
}

/** Runs all three checks for one candidate against a corpus. Pure apart from the optional embedding call. */
export async function runSimilarityQa(
  candidate: ComparisonInput,
  corpus: readonly ComparisonInput[],
  thresholds: Thresholds,
  options: { now?: Date; tooling?: string; embedding?: EmbeddingOptions } = {},
): Promise<SimilarityReport> {
  const now = options.now ?? new Date();
  const candidateText = visibleText(mainContent(candidate.html));
  const candidateSentences = sentences(candidateText);
  const candidateHeadings = headings(mainContent(candidate.html));

  const embedding = await embedTexts(
    [candidateText, ...corpus.map((c) => visibleText(mainContent(c.html)))],
    options.embedding ?? {},
  );

  const comparisons: ComparisonResult[] = corpus.map((entry, index) => {
    const text = visibleText(mainContent(entry.html));
    const flags: string[] = [];
    const sentenceDup = sentenceDuplicationPercent(candidateSentences, sentences(text));
    const headingPercent = headingArchitecturePercent(candidateHeadings, headings(mainContent(entry.html)));
    const cosine = embedding.ok ? cosineSimilarity(embedding.vectors[0]!, embedding.vectors[index + 1]!) : null;

    if (cosine !== null) {
      if (cosine > thresholds.presumedDuplicateCosine) flags.push(`cosine ${cosine.toFixed(3)} > ${thresholds.presumedDuplicateCosine} (presumed duplication)`);
      else if (cosine > thresholds.blockedCosine) flags.push(`cosine ${cosine.toFixed(3)} > ${thresholds.blockedCosine} (blocked pending review)`);
      else if (cosine >= thresholds.manualReviewCosine) flags.push(`cosine ${cosine.toFixed(3)} >= ${thresholds.manualReviewCosine} (manual review)`);
    }
    if (sentenceDup >= thresholds.sentenceNearDuplicationPercent) flags.push(`sentence near-duplication ${sentenceDup}% >= ${thresholds.sentenceNearDuplicationPercent}%`);
    if (headingPercent >= thresholds.headingArchitecturePercent) flags.push(`heading architecture ${headingPercent}% >= ${thresholds.headingArchitecturePercent}%`);

    return {
      comparisonRef: entry.ref,
      comparisonKind: entry.kind,
      comparisonHash: contentHash(text),
      cosine,
      sentenceDuplicationPercent: sentenceDup,
      headingArchitecturePercent: headingPercent,
      flags,
    };
  });

  return {
    model: embedding.ok ? embedding.model : LOCKED_EMBEDDING_MODEL,
    tooling: options.tooling ?? 'scripts/similarity-qa.ts',
    runAt: now.toISOString(),
    candidateRef: candidate.ref,
    candidateHash: contentHash(candidateText),
    comparisonCorpus: corpus.map((c) => c.ref).join(', ') || 'none',
    embedding: embedding.ok ? { status: 'run' } : { status: 'not_run', reason: embedding.reason },
    comparisons,
    requiresManualReview: comparisons.filter((c) => c.flags.length > 0).map((c) => c.comparisonRef),
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
