/** Node loader for the project's real publication records and operator approval registry. */
import { readdirSync, readFileSync } from 'node:fs';
import type { RawRecord } from '../../src/lib/publication/registry.ts';

export const ROOT = new URL('../../', import.meta.url);
const recordsDir = new URL('content/publication-records/', ROOT);

export function loadRawRecords(): RawRecord[] {
  return readdirSync(recordsDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({
      source: `content/publication-records/${f}`,
      data: JSON.parse(readFileSync(new URL(f, recordsDir), 'utf8')) as unknown,
    }));
}

export function loadRawApprovals(): unknown {
  return JSON.parse(readFileSync(new URL('governance/index-approvals.json', ROOT), 'utf8')) as unknown;
}
