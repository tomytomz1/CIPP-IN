/**
 * Similarity QA runner (docs/04 workflow step 14; docs/03 -> Semantic Similarity QA).
 *
 * Compares every built site page against every other built site page, and optionally against
 * competitor pages listed in a local file that is NEVER committed.
 *
 *   node scripts/similarity-qa.ts                     # site pages only
 *   node scripts/similarity-qa.ts --competitors f.txt # plus URLs listed one per line
 *   node scripts/similarity-qa.ts --write             # also write the report file
 *
 * Embeddings use the locked model and only run when OPENAI_API_KEY is present in the
 * environment. Without it the run is honestly reported as "not_run" and the Similarity QA gate
 * stays unsatisfied, so no page can become indexable on the strength of the deterministic checks
 * alone. No key is read from, or written to, the repository, and no competitor page body is
 * stored: a comparison keeps a reference, a hash, and scores.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { SIMILARITY } from '../src/lib/publication/constants.ts';
import { builtPages } from './lib/dist.ts';
import { runSimilarityQa, type ComparisonInput, type SimilarityReport } from './lib/similarity.ts';

const REPORT_PATH = new URL('../content/similarity/latest.json', import.meta.url);

const thresholds = {
  manualReviewCosine: SIMILARITY.manualReviewCosine,
  blockedCosine: SIMILARITY.blockedCosine,
  presumedDuplicateCosine: SIMILARITY.presumedDuplicateCosine,
  sentenceNearDuplicationPercent: SIMILARITY.sentenceNearDuplicationPercent,
  headingArchitecturePercent: SIMILARITY.headingArchitecturePercent,
};

const args = process.argv.slice(2);
const write = args.includes('--write');
const competitorFile = args[args.indexOf('--competitors') + 1];
const wantsCompetitors = args.includes('--competitors') && typeof competitorFile === 'string';

const pages = builtPages();
if (pages.length === 0) {
  console.error('No built pages found. Run `npm run build` first.');
  process.exit(1);
}

/** Competitor bodies are fetched into memory only; nothing is written to disk. */
async function loadCompetitors(): Promise<ComparisonInput[]> {
  if (!wantsCompetitors) return [];
  const urls = readFileSync(competitorFile, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
  const loaded: ComparisonInput[] = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'IndySewerResource-SimilarityQA/1.0' } });
      if (!response.ok) {
        console.warn(`  skipped ${url}: HTTP ${response.status}`);
        continue;
      }
      loaded.push({ ref: url, kind: 'competitor_page', html: await response.text() });
    } catch {
      console.warn(`  skipped ${url}: request failed`);
    }
  }
  return loaded;
}

const competitors = await loadCompetitors();
const reports: SimilarityReport[] = [];

for (const page of pages) {
  const others: ComparisonInput[] = pages
    .filter((other) => other.route !== page.route)
    .map((other) => ({ ref: other.route, kind: 'site_page', html: other.html }));
  reports.push(
    await runSimilarityQa(
      { ref: page.route, kind: 'site_page', html: page.html },
      [...others, ...competitors],
      thresholds,
      { embedding: { apiKey: process.env['OPENAI_API_KEY'] } },
    ),
  );
}

let flagged = 0;
for (const report of reports) {
  console.log(`\n${report.candidateRef}  (${report.candidateHash.slice(0, 19)}…)`);
  console.log(`  embeddings: ${report.embedding.status}${report.embedding.reason ? ` — ${report.embedding.reason}` : ''}`);
  for (const c of report.comparisons) {
    const cosine = c.cosine === null ? 'cosine n/a' : `cosine ${c.cosine.toFixed(3)}`;
    console.log(
      `  vs ${c.comparisonRef}: ${cosine}, sentences ${c.sentenceDuplicationPercent}%, headings ${c.headingArchitecturePercent}%` +
        (c.flags.length ? `  FLAGGED: ${c.flags.join('; ')}` : ''),
    );
    if (c.flags.length) flagged += 1;
  }
}

const embeddingRuns = reports.filter((r) => r.embedding.status === 'run').length;
console.log(
  `\nPages: ${reports.length}; competitor comparisons: ${competitors.length}; flagged comparisons: ${flagged};` +
    ` embedding runs: ${embeddingRuns}/${reports.length} (model ${SIMILARITY.lockedEmbeddingModel}).`,
);
if (embeddingRuns < reports.length) {
  console.log(
    'Similarity QA is INCOMPLETE: the embedding check did not run, so workflow step 14 stays unsatisfied\n' +
      'and no page can pass the Indexing Gate on the deterministic checks alone.',
  );
}

if (write) {
  mkdirSync(dirname(REPORT_PATH.pathname.replace(/^\//, '')), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify({ schemaVersion: 1, reports }, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${REPORT_PATH.pathname}`);
}

// Deterministic duplication is a hard failure: it means two pages are repackaging each other.
if (flagged > 0) {
  console.error('\nsimilarity-qa FAILED: flagged comparisons require a recorded manual review before publication.');
  process.exitCode = 1;
}
