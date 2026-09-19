/**
 * Builds the evaluated page registry from raw (unvalidated) record and approval data.
 * Used by both the Astro build and the Node validation scripts, so the same rules
 * apply everywhere. Invalid data throws: the build and CI fail closed.
 */
import { evaluateIndexability, type IndexabilityEvaluation } from './evaluate.ts';
import {
  indexApprovalRegistrySchema,
  publicationRecordSchema,
  type IndexApproval,
  type PublicationRecord,
} from './schema.ts';

export interface RegistryEntry {
  record: PublicationRecord;
  evaluation: IndexabilityEvaluation;
}

export interface PageRegistry {
  entries: RegistryEntry[];
  approvals: IndexApproval[];
  byId(id: string): RegistryEntry | undefined;
}

export interface RawRecord {
  source: string;
  data: unknown;
}

export function buildRegistry(
  rawRecords: readonly RawRecord[],
  rawApprovals: unknown,
  options: { now: Date; allowFixtures?: boolean },
): PageRegistry {
  const errors: string[] = [];

  const approvalsParsed = indexApprovalRegistrySchema.safeParse(rawApprovals);
  if (!approvalsParsed.success) {
    throw new Error(`index-approval registry is invalid:\n${approvalsParsed.error.message}`);
  }
  const approvals = approvalsParsed.data.approvals;

  const records: PublicationRecord[] = [];
  for (const raw of rawRecords) {
    const parsed = publicationRecordSchema.safeParse(raw.data);
    if (!parsed.success) {
      errors.push(`${raw.source}: invalid publication record\n${parsed.error.message}`);
      continue;
    }
    if (parsed.data.fixture && !options.allowFixtures) {
      errors.push(`${raw.source}: test fixtures must never be in the project registry`);
      continue;
    }
    records.push(parsed.data);
  }

  const seenIds = new Map<string, number>();
  const seenRoutes = new Map<string, number>();
  for (const r of records) {
    seenIds.set(r.id, (seenIds.get(r.id) ?? 0) + 1);
    seenRoutes.set(r.route, (seenRoutes.get(r.route) ?? 0) + 1);
  }
  for (const [k, n] of seenIds) if (n > 1) errors.push(`duplicate page id "${k}"`);
  for (const [k, n] of seenRoutes) if (n > 1) errors.push(`duplicate route "${k}"`);

  const approvalIds = new Map<string, number>();
  for (const a of approvals) {
    approvalIds.set(a.pageId, (approvalIds.get(a.pageId) ?? 0) + 1);
    if (!records.some((r) => r.id === a.pageId)) errors.push(`approval references unknown page id "${a.pageId}"`);
  }
  for (const [k, n] of approvalIds) if (n > 1) errors.push(`duplicate approvals for page id "${k}"`);

  const entries = records.map((record) => ({
    record,
    evaluation: evaluateIndexability(record, approvals, { now: options.now }),
  }));

  // A record that requests indexing but does not pass the evaluator is a CI failure,
  // not a silent downgrade: the requester must see why.
  for (const e of entries) {
    if (e.evaluation.requestsIndexing && !e.evaluation.effectiveIndexable) {
      errors.push(
        `page "${e.record.id}" requests lifecycle "indexable" but fails the indexing gate:\n  - ${e.evaluation.blockingReasons.join('\n  - ')}`,
      );
    }
  }

  if (errors.length) throw new Error(`Publication registry validation failed:\n${errors.join('\n')}`);

  return {
    entries,
    approvals,
    byId: (id) => entries.find((e) => e.record.id === id),
  };
}
