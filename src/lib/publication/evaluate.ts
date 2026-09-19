/**
 * Pure, deterministic indexability evaluator.
 *
 *   effective_indexable =
 *       hard_gates_passed
 *       AND publication_threshold_passed
 *       AND required_evidence_current
 *       AND operator_index_approval_present
 *
 * (docs/05-BUILD-SPEC.md → Indexability calculation; implements the Indexing Gate
 * in docs/03-GOOGLE-RESILIENCE.md plus operator approval.)
 *
 * The record's `lifecycle` field is an editorial request, never a grant: a record
 * whose lifecycle says "indexable" is still non-indexable unless every check here
 * passes. There is intentionally no override parameter.
 */
import {
  EXPERT_REVIEW_WORKFLOW_STEP,
  MUNICIPALITY_CATEGORIES,
  MUNICIPALITY_MIN_AUTHORITATIVE_LOCAL,
  MUNICIPALITY_MIN_CATEGORIES,
  PRE_INDEX_WORKFLOW_STEPS,
  PUBLICATION_THRESHOLDS,
  RECORDED_HARD_GATES,
  SCORE_CRITERIA,
  SIMILARITY,
  WORKFLOW_STEPS,
  type ScoreCriterion,
} from './constants.ts';
import type { IndexApproval, PublicationRecord } from './schema.ts';

export type GateStatus = 'pass' | 'fail';
export interface GateResult {
  gate: string;
  status: GateStatus;
  reasons: string[];
}

export interface IndexabilityEvaluation {
  pageId: string;
  route: string;
  lifecycle: PublicationRecord['lifecycle'];
  /** True when the record's lifecycle asks for indexing. */
  requestsIndexing: boolean;
  gates: GateResult[];
  hardGatesPassed: boolean;
  score: {
    calculated: number | null;
    required: number | null;
    passed: boolean;
  };
  evidence: { current: boolean; staleSources: string[] };
  operatorApproval: { present: boolean; reason: string };
  effectiveIndexable: boolean;
  /** Human-readable reasons the page is not indexable (empty when indexable). */
  blockingReasons: string[];
}

/** Calculates the publication total from component scores. Never trusts a supplied total. */
export function calculatePublicationScore(components: Record<ScoreCriterion, number>): number {
  let total = 0;
  for (const [criterion, max] of Object.entries(SCORE_CRITERIA) as [ScoreCriterion, number][]) {
    const value = components[criterion];
    if (!Number.isInteger(value) || value < 0 || value > max) {
      throw new Error(`invalid score for ${criterion}: ${String(value)} (0–${max})`);
    }
    total += value;
  }
  return total;
}

export function requiredThreshold(pageType: PublicationRecord['pageType']): number | null {
  return pageType === 'utility' ? null : PUBLICATION_THRESHOLDS[pageType];
}

/** Location Page Quality Gate: ≥5 of 8 categories, including ≥2 authoritative local primary-source categories. */
export function evaluateMunicipalityGate(gate: NonNullable<PublicationRecord['municipalityGate']>): GateResult {
  let qualifying = 0;
  let authoritative = 0;
  for (const key of MUNICIPALITY_CATEGORIES) {
    const c = gate.categories[key];
    if (c.qualifies && c.evidenceRefs.length > 0) {
      qualifying += 1;
      if (c.authoritativeLocalPrimary) authoritative += 1;
    }
  }
  const reasons: string[] = [];
  if (qualifying < MUNICIPALITY_MIN_CATEGORIES) {
    reasons.push(`only ${qualifying} of 8 evidence categories qualify (minimum ${MUNICIPALITY_MIN_CATEGORIES})`);
  }
  if (authoritative < MUNICIPALITY_MIN_AUTHORITATIVE_LOCAL) {
    reasons.push(
      `only ${authoritative} authoritative local primary-source categories (minimum ${MUNICIPALITY_MIN_AUTHORITATIVE_LOCAL})`,
    );
  }
  return { gate: 'locationPageQualityGate', status: reasons.length ? 'fail' : 'pass', reasons };
}

/** Semantic Similarity QA per docs/03 thresholds. Any flagged comparison needs a recorded "cleared" manual review. */
export function evaluateSimilarity(runs: PublicationRecord['similarity']): GateResult {
  const reasons: string[] = [];
  if (runs.length === 0) {
    reasons.push('no similarity QA run recorded');
  }
  for (const run of runs) {
    if (run.model !== SIMILARITY.lockedEmbeddingModel) {
      reasons.push(`run ${run.runAt} used model "${run.model}", not the locked "${SIMILARITY.lockedEmbeddingModel}"`);
    }
    for (const c of run.comparisons) {
      const flags: string[] = [];
      if (c.cosine > SIMILARITY.presumedDuplicateCosine) flags.push(`cosine ${c.cosine} > ${SIMILARITY.presumedDuplicateCosine} (presumed duplication)`);
      else if (c.cosine > SIMILARITY.blockedCosine) flags.push(`cosine ${c.cosine} > ${SIMILARITY.blockedCosine} (blocked pending review)`);
      else if (c.cosine >= SIMILARITY.manualReviewCosine) flags.push(`cosine ${c.cosine} ≥ ${SIMILARITY.manualReviewCosine} (manual review)`);
      if (c.sentenceDuplicationPercent >= SIMILARITY.sentenceNearDuplicationPercent) {
        flags.push(`sentence near-duplication ${c.sentenceDuplicationPercent}% ≥ ${SIMILARITY.sentenceNearDuplicationPercent}%`);
      }
      if (c.headingArchitecturePercent >= SIMILARITY.headingArchitecturePercent) {
        flags.push(`heading architecture ${c.headingArchitecturePercent}% ≥ ${SIMILARITY.headingArchitecturePercent}%`);
      }
      if (flags.length > 0 && c.manualReview?.outcome !== 'cleared') {
        reasons.push(`vs ${c.comparisonRef}: ${flags.join('; ')} without a cleared manual review`);
      }
      if (c.manualReview?.outcome === 'blocked') {
        reasons.push(`vs ${c.comparisonRef}: manual review blocked publication (${c.manualReview.reason})`);
      }
    }
  }
  return { gate: 'semanticSimilarityQa', status: reasons.length ? 'fail' : 'pass', reasons };
}

function evaluateWorkflow(record: PublicationRecord): GateResult {
  const reasons: string[] = [];
  const wf = record.workflow as Record<string, { status: string }>;
  for (const step of PRE_INDEX_WORKFLOW_STEPS) {
    const status = wf[String(step)]?.status;
    const okNa = step === EXPERT_REVIEW_WORKFLOW_STEP && status === 'not_applicable' && !record.expertReview.required;
    if (status !== 'complete' && !okNa) {
      reasons.push(`workflow step ${step} (${WORKFLOW_STEPS[step]}) is "${status ?? 'missing'}"`);
    }
  }
  return { gate: 'workflowSteps1to19', status: reasons.length ? 'fail' : 'pass', reasons };
}

function evaluateClaims(record: PublicationRecord): GateResult {
  const reasons: string[] = [];
  if (record.claims.length === 0) reasons.push('no material claims recorded');
  for (const c of record.claims) {
    if (c.classification === 'FACT' && c.evidenceRefs.length === 0) reasons.push(`claim ${c.id} is FACT without evidence`);
  }
  return { gate: 'materialClaims', status: reasons.length ? 'fail' : 'pass', reasons };
}

function evaluateExpertReview(record: PublicationRecord): GateResult {
  const e = record.expertReview;
  const reasons: string[] = [];
  if (e.required) {
    if (!e.reviewer) reasons.push('expert review required but no reviewer recorded');
    if (e.outcome !== 'approved') reasons.push(`expert review required but outcome is "${e.outcome ?? 'none'}"`);
  }
  return { gate: 'expertReview', status: reasons.length ? 'fail' : 'pass', reasons };
}

function evaluateRecordedGates(record: PublicationRecord): GateResult[] {
  return RECORDED_HARD_GATES.map((g) => {
    const r = record.hardGates[g];
    const reasons = r.result === 'pass' ? [] : [`${g} is "${r.result}"`];
    return { gate: g, status: reasons.length ? 'fail' : 'pass', reasons } satisfies GateResult;
  });
}

export function evaluateEvidenceFreshness(record: PublicationRecord, now: Date): { current: boolean; staleSources: string[]; reasons: string[] } {
  const today = now.toISOString().slice(0, 10);
  const staleSources = record.evidence.primarySources.filter((s) => s.reverifyBy < today).map((s) => s.id);
  const reasons: string[] = [];
  if (record.evidence.packageRefs.length === 0) reasons.push('no evidence package recorded');
  if (staleSources.length) reasons.push(`stale sources past reverifyBy: ${staleSources.join(', ')}`);
  return { current: reasons.length === 0, staleSources, reasons };
}

export function findApproval(record: PublicationRecord, approvals: readonly IndexApproval[]): { present: boolean; reason: string } {
  const matches = approvals.filter((a) => a.pageId === record.id);
  if (matches.length === 0) return { present: false, reason: 'no operator index approval recorded' };
  if (matches.length > 1) return { present: false, reason: 'multiple approval entries for this page (ambiguous)' };
  const a = matches[0]!;
  if (a.route !== record.route) return { present: false, reason: `approval is for route ${a.route}, record route is ${record.route}` };
  return { present: true, reason: `approved by ${a.approvedBy} on ${a.approvedAt}` };
}

export function evaluateIndexability(
  record: PublicationRecord,
  approvals: readonly IndexApproval[],
  options: { now: Date },
): IndexabilityEvaluation {
  const blockingReasons: string[] = [];
  const gates: GateResult[] = [];

  if (record.pageType === 'utility') {
    gates.push({ gate: 'pageType', status: 'fail', reasons: ['utility pages are never eligible for indexing'] });
  }

  gates.push(evaluateWorkflow(record));
  gates.push(evaluateClaims(record));
  gates.push(...evaluateRecordedGates(record));
  gates.push(evaluateSimilarity(record.similarity));
  gates.push(evaluateExpertReview(record));
  if (record.pageType === 'location') {
    gates.push(
      record.municipalityGate
        ? evaluateMunicipalityGate(record.municipalityGate)
        : { gate: 'locationPageQualityGate', status: 'fail', reasons: ['no municipality gate record'] },
    );
  }

  const hardGatesPassed = gates.every((g) => g.status === 'pass');
  for (const g of gates) blockingReasons.push(...g.reasons.map((r) => `[${g.gate}] ${r}`));

  const required = requiredThreshold(record.pageType);
  const calculated = record.publicationScore ? calculatePublicationScore(record.publicationScore.components) : null;
  const scorePassed = required !== null && calculated !== null && calculated >= required;
  if (calculated === null) blockingReasons.push('[publicationScore] no publication score recorded');
  else if (required !== null && !scorePassed) blockingReasons.push(`[publicationScore] ${calculated} < required ${required}`);

  const evidence = evaluateEvidenceFreshness(record, options.now);
  blockingReasons.push(...evidence.reasons.map((r) => `[evidence] ${r}`));

  const operatorApproval = findApproval(record, approvals);
  if (!operatorApproval.present) blockingReasons.push(`[operatorApproval] ${operatorApproval.reason}`);

  const requestsIndexing = record.lifecycle === 'indexable';
  if (!requestsIndexing) blockingReasons.push(`[lifecycle] lifecycle is "${record.lifecycle}", not "indexable"`);

  const effectiveIndexable =
    requestsIndexing && hardGatesPassed && scorePassed && evidence.current && operatorApproval.present;

  return {
    pageId: record.id,
    route: record.route,
    lifecycle: record.lifecycle,
    requestsIndexing,
    gates,
    hardGatesPassed,
    score: { calculated, required, passed: scorePassed },
    evidence: { current: evidence.current, staleSources: evidence.staleSources },
    operatorApproval,
    effectiveIndexable,
    blockingReasons: effectiveIndexable ? [] : blockingReasons,
  };
}
