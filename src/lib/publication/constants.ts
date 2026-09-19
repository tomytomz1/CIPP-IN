/**
 * Locked quality constants. Every value here is copied from, and must stay
 * identical to, the authoritative documents:
 *   - docs/03-GOOGLE-RESILIENCE.md (thresholds, gates, score weights)
 *   - docs/04-CONTENT-EDITORIAL-SYSTEM.md (mandatory workflow)
 *   - docs/05-BUILD-SPEC.md (lifecycle, similarity model)
 * Changing any value requires explicit operator approval. This directory is
 * CODEOWNERS-protected.
 */

/** Exactly the five locked lifecycle states (05 → Publication / Indexing Architecture). */
export const LIFECYCLE_STATES = [
  'draft',
  'review',
  'published_noindex',
  'index_candidate',
  'indexable',
] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];

/**
 * Page types.
 * - general: general indexable page, threshold 80 (03 → Publication Score).
 * - money / location: threshold 85; location pages must also pass the
 *   Location Page Quality Gate.
 * - utility: support/legal/development pages; never eligible for indexing
 *   (03 → Site Quality Firewall "NOINDEX" class).
 */
export const PAGE_TYPES = ['general', 'money', 'location', 'utility'] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const PUBLICATION_THRESHOLDS = {
  general: 80,
  money: 85,
  location: 85,
} as const satisfies Record<Exclude<PageType, 'utility'>, number>;

/** Publication score criteria and maximum points (03 → Publication Score). Total = 100. */
export const SCORE_CRITERIA = {
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
} as const;
export type ScoreCriterion = keyof typeof SCORE_CRITERIA;
export const SCORE_MAX_TOTAL = 100;

/** Location Page Quality Gate categories (03 → Location Page Quality Gate). */
export const MUNICIPALITY_CATEGORIES = [
  'verifiedLateralResponsibility',
  'municipalPermitRepairRequirement',
  'municipalCippLiningBurstingRule',
  'municipalInfrastructureInformation',
  'municipalHousingPipeFailureEvidence',
  'municipalCostPermitProjectEvidence',
  'originalMunicipalVisualDataAsset',
  'originalFirstPartyInterviewData',
] as const;
export type MunicipalityCategory = (typeof MUNICIPALITY_CATEGORIES)[number];
export const MUNICIPALITY_MIN_CATEGORIES = 5;
export const MUNICIPALITY_MIN_AUTHORITATIVE_LOCAL = 2;

/** Semantic Similarity QA heuristics (03 → Semantic Similarity QA). */
export const SIMILARITY = {
  lockedEmbeddingModel: 'text-embedding-3-small',
  /** At or above: mandatory manual review. */
  manualReviewCosine: 0.82,
  /** Above: publication blocked pending review. */
  blockedCosine: 0.88,
  /** Above: presumed city-swap/duplication unless proven otherwise. */
  presumedDuplicateCosine: 0.92,
  /** Percent. At or above: flag for review. */
  sentenceNearDuplicationPercent: 20,
  /** Percent. At or above: flag for review. */
  headingArchitecturePercent: 70,
} as const;

/** Mandatory content workflow steps (04 → Mandatory Content Workflow). */
export const WORKFLOW_STEPS = {
  1: 'User Problem Definition',
  2: 'Search Intent Analysis',
  3: 'Competitor Evidence Dossier',
  4: 'Primary Source Research',
  5: 'Local Evidence Package',
  6: 'Proprietary Data Check',
  7: 'Expert Input Requirement',
  8: 'Page Architecture',
  9: 'AI-Assisted Draft',
  10: 'Material Claim Verification',
  11: 'Human Editorial Restructuring',
  12: 'Original Asset Insertion',
  13: 'Expert Review Where Required',
  14: 'Similarity QA',
  15: 'Commodity Content Test',
  16: 'Publication Score',
  17: 'Technical SEO QA',
  18: 'Internal Linking QA',
  19: 'Conversion QA',
  20: 'Index Approval',
  21: 'Monitor',
  22: '90/180-Day Review',
} as const;
/** Steps that must be complete before a page can be indexable (03 → Indexing Gate item 1). */
export const PRE_INDEX_WORKFLOW_STEPS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
] as const;
/** The only step that may be "not_applicable", and only when expert review is not required. */
export const EXPERT_REVIEW_WORKFLOW_STEP = 13;

/** Hard gates recorded per page (03 → Indexing Gate; 05 → Per-page publication record). */
export const RECORDED_HARD_GATES = [
  'commodityContentTest',
  'perfectAiDetectionTest',
  'doorwayPageFirewall',
  'technicalSeoQa',
  'internalLinkingQa',
  'conversionQa',
] as const;
export type RecordedHardGate = (typeof RECORDED_HARD_GATES)[number];

/** The only GitHub account permitted to record index approvals. */
export const INDEX_APPROVAL_OPERATOR = 'tomytomz1';
