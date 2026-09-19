/**
 * Structured publication-record and index-approval schemas.
 * Implements docs/05-BUILD-SPEC.md → Publication / Indexing Architecture.
 *
 * Records are strict: unknown keys are rejected, so a record cannot smuggle in
 * a hand-typed publication total, a "force indexable" flag, or an approval.
 */
import { z } from 'zod';
import {
  EXPERT_REVIEW_WORKFLOW_STEP,
  INDEX_APPROVAL_OPERATOR,
  LIFECYCLE_STATES,
  MUNICIPALITY_CATEGORIES,
  PAGE_TYPES,
  RECORDED_HARD_GATES,
  SCORE_CRITERIA,
  SIMILARITY,
  WORKFLOW_STEPS,
  type MunicipalityCategory,
  type RecordedHardGate,
  type ScoreCriterion,
} from './constants.ts';

const isoDate = z.iso.date();
const isoDateTime = z.iso.datetime({ offset: true });
const nonEmpty = z.string().trim().min(1);
const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase kebab-case id');
/** Site-relative route: starts and ends with "/", no query/fragment. */
export const routeSchema = z
  .string()
  .regex(/^\/(?:[a-z0-9-]+\/)*$/, 'route must be "/" or "/segment/…/" (lowercase, trailing slash)');

export const lifecycleSchema = z.enum(LIFECYCLE_STATES);
export const pageTypeSchema = z.enum(PAGE_TYPES);

const workflowStepStatus = z.enum(['not_started', 'in_progress', 'complete', 'not_applicable']);
const workflowStepKeys = Object.keys(WORKFLOW_STEPS) as (keyof typeof WORKFLOW_STEPS & string)[];
const workflowSchema = z.strictObject(
  Object.fromEntries(
    workflowStepKeys.map((k) => [
      k,
      z.strictObject({ status: workflowStepStatus, note: z.string().optional() }),
    ]),
  ) as Record<string, z.ZodType<{ status: z.infer<typeof workflowStepStatus>; note?: string | undefined }>>,
);

const primarySourceSchema = z.strictObject({
  id: nonEmpty,
  title: nonEmpty,
  url: z.url().optional(),
  /** Research record id, e.g. an id in research/sources/*.json. */
  researchRecordId: nonEmpty.optional(),
  lastVerified: isoDate,
  /** The date by which the source must be re-verified; after it, evidence is stale. */
  reverifyBy: isoDate,
});

const evidenceSchema = z.strictObject({
  packageRefs: z.array(nonEmpty),
  primarySources: z.array(primarySourceSchema),
});

const claimSchema = z
  .strictObject({
    id: nonEmpty,
    classification: z.enum(['FACT', 'INFERENCE', 'ESTIMATE']),
    evidenceRefs: z.array(nonEmpty),
    note: z.string().optional(),
  })
  .refine((c) => c.classification !== 'FACT' || c.evidenceRefs.length > 0, {
    message: 'FACT claims must cite at least one evidence/source reference',
  });

const expertReviewSchema = z
  .strictObject({
    required: z.boolean(),
    reviewer: z
      .strictObject({ name: nonEmpty, credential: nonEmpty, context: z.string().optional() })
      .nullable(),
    scope: z.string().nullable(),
    date: isoDate.nullable(),
    outcome: z.enum(['approved', 'changes_required', 'rejected']).nullable(),
  })
  .refine((e) => e.outcome === null || (e.reviewer !== null && e.date !== null && e.scope !== null), {
    message: 'an expert-review outcome requires a real reviewer, scope, and date',
  });

const similarityComparisonSchema = z.strictObject({
  comparisonRef: nonEmpty,
  comparisonKind: z.enum(['site_page', 'competitor_page']),
  comparisonHash: nonEmpty.nullable(),
  cosine: z.number().min(-1).max(1),
  sentenceDuplicationPercent: z.number().min(0).max(100),
  headingArchitecturePercent: z.number().min(0).max(100),
  manualReview: z
    .strictObject({ outcome: z.enum(['cleared', 'blocked']), reason: nonEmpty, reviewer: nonEmpty, date: isoDate })
    .nullable(),
});

const similarityRunSchema = z.strictObject({
  model: nonEmpty,
  tooling: nonEmpty,
  runAt: isoDateTime,
  candidateHash: nonEmpty,
  comparisonCorpus: nonEmpty,
  comparisons: z.array(similarityComparisonSchema),
});

const scoreComponentsSchema = z.strictObject(
  Object.fromEntries(
    (Object.entries(SCORE_CRITERIA) as [ScoreCriterion, number][]).map(([k, max]) => [
      k,
      z.number().int().min(0).max(max),
    ]),
  ) as Record<ScoreCriterion, z.ZodNumber>,
);

const publicationScoreSchema = z.strictObject({
  components: scoreComponentsSchema,
  scorer: nonEmpty,
  date: isoDate,
});

const municipalityCategorySchema = z
  .strictObject({
    qualifies: z.boolean(),
    authoritativeLocalPrimary: z.boolean(),
    evidenceRefs: z.array(nonEmpty),
  })
  .refine((c) => !c.qualifies || c.evidenceRefs.length > 0, {
    message: 'a qualifying municipality category must cite evidence',
  })
  .refine((c) => !c.authoritativeLocalPrimary || c.qualifies, {
    message: 'authoritativeLocalPrimary is only meaningful for a qualifying category',
  });

const municipalityGateSchema = z.strictObject({
  municipality: nonEmpty,
  categories: z.strictObject(
    Object.fromEntries(MUNICIPALITY_CATEGORIES.map((k) => [k, municipalityCategorySchema])) as Record<
      MunicipalityCategory,
      typeof municipalityCategorySchema
    >,
  ),
});

const gateResultSchema = z.strictObject({
  result: z.enum(['pass', 'fail', 'not_run']),
  checkedBy: z.string().nullable(),
  date: isoDate.nullable(),
  note: z.string().optional(),
});

const hardGatesSchema = z.strictObject(
  Object.fromEntries(RECORDED_HARD_GATES.map((g) => [g, gateResultSchema])) as Record<
    RecordedHardGate,
    typeof gateResultSchema
  >,
);

const qualityClassificationSchema = z.strictObject({
  classification: z.enum(['KEEP', 'IMPROVE', 'CONSOLIDATE', 'NOINDEX', 'DELETE/REDIRECT']),
  date: isoDate,
  reasoning: nonEmpty,
});

export const publicationRecordSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    /** Must be true only for artificial test fixtures; never for project pages. */
    fixture: z.boolean().default(false),
    id,
    route: routeSchema,
    pageType: pageTypeSchema,
    title: nonEmpty,
    description: nonEmpty,
    targetIntent: nonEmpty,
    owner: z.string().nullable(),
    lifecycle: lifecycleSchema,
    workflow: workflowSchema,
    evidence: evidenceSchema,
    claims: z.array(claimSchema),
    expertReview: expertReviewSchema,
    similarity: z.array(similarityRunSchema),
    publicationScore: publicationScoreSchema.nullable(),
    municipalityGate: municipalityGateSchema.nullable(),
    hardGates: hardGatesSchema,
    siteQuality: z.array(qualityClassificationSchema).default([]),
  })
  .superRefine((r, ctx) => {
    if (r.pageType === 'location' && r.municipalityGate === null) {
      ctx.addIssue({ code: 'custom', path: ['municipalityGate'], message: 'location pages require a municipalityGate record' });
    }
    if (r.pageType !== 'location' && r.municipalityGate !== null) {
      ctx.addIssue({ code: 'custom', path: ['municipalityGate'], message: 'municipalityGate applies only to location pages' });
    }
    const step13 = (r.workflow as Record<string, { status: string }>)[String(EXPERT_REVIEW_WORKFLOW_STEP)];
    for (const [step, value] of Object.entries(r.workflow as Record<string, { status: string }>)) {
      if (value.status === 'not_applicable' && step !== String(EXPERT_REVIEW_WORKFLOW_STEP)) {
        ctx.addIssue({ code: 'custom', path: ['workflow', step], message: 'only step 13 may be not_applicable' });
      }
    }
    if (step13?.status === 'not_applicable' && r.expertReview.required) {
      ctx.addIssue({ code: 'custom', path: ['workflow', '13'], message: 'step 13 cannot be not_applicable when expert review is required' });
    }
    for (const [i, run] of r.similarity.entries()) {
      if (run.model !== SIMILARITY.lockedEmbeddingModel) {
        ctx.addIssue({
          code: 'custom',
          path: ['similarity', i, 'model'],
          message: `similarity model must be the locked model "${SIMILARITY.lockedEmbeddingModel}" (scores across models are not comparable)`,
        });
      }
    }
  });

export type PublicationRecord = z.infer<typeof publicationRecordSchema>;
export type PublicationRecordInput = z.input<typeof publicationRecordSchema>;

/** Operator index-approval registry (governance/index-approvals.json). CODEOWNERS-protected. */
export const indexApprovalSchema = z.strictObject({
  pageId: id,
  route: routeSchema,
  approved: z.literal(true),
  approvedBy: z.literal(INDEX_APPROVAL_OPERATOR),
  approvedAt: isoDate,
  note: z.string().optional(),
});
export const indexApprovalRegistrySchema = z.strictObject({
  $comment: z.string().optional(),
  schemaVersion: z.literal(1),
  approvals: z.array(indexApprovalSchema),
});
export type IndexApproval = z.infer<typeof indexApprovalSchema>;
export type IndexApprovalRegistry = z.infer<typeof indexApprovalRegistrySchema>;
