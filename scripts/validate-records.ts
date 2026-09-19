/**
 * Validates every publication record and the operator index-approval registry, evaluates
 * indexability, and prints a report. Exits non-zero on any schema or gate violation
 * (including a record that requests "indexable" without passing the gate).
 */
import { buildRegistry } from '../src/lib/publication/registry.ts';
import { loadRawApprovals, loadRawRecords } from './lib/load-project.ts';

try {
  const registry = buildRegistry(loadRawRecords(), loadRawApprovals(), { now: new Date() });
  console.log(`Publication records: ${registry.entries.length}; operator approvals: ${registry.approvals.length}`);
  for (const { record, evaluation } of registry.entries) {
    console.log(
      `- ${record.id} ${record.route} [${record.pageType}/${record.lifecycle}] effectiveIndexable=${evaluation.effectiveIndexable}` +
        ` score=${evaluation.score.calculated ?? 'none'}/${evaluation.score.required ?? 'n/a'}`,
    );
  }
  const indexable = registry.entries.filter((e) => e.evaluation.effectiveIndexable).length;
  console.log(`Effectively indexable pages: ${indexable}`);
  console.log('OK: all records and approvals are valid.');
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
