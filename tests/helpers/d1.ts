/**
 * Local D1 test harness. Uses Miniflare (the same local Workers runtime Wrangler uses) so tests
 * execute real SQL against real local SQLite. No remote Cloudflare resource, account, or
 * database id is involved; storage is in-memory and discarded after each test.
 */
import { Miniflare } from 'miniflare';
import { applyMigrations } from '../../scripts/lib/migrations.ts';
import type { SqlDatabase } from '../../src/lib/leads/db.ts';

export interface TestDb {
  db: SqlDatabase;
  dispose(): Promise<void>;
}

/** Creates a fresh, migrated, in-memory D1 database. */
export async function createTestDb(): Promise<TestDb> {
  const mf = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("test harness"); } };',
    // Local-only Miniflare database name. NOT a Cloudflare database id; no remote resource exists.
    d1Databases: { DB: 'local-test-only' },
    // The test runtime (miniflare 4 / workerd 1.20260730) supports compatibility dates up to
    // 2026-08-06. Production wrangler.jsonc uses a newer date with the newer runtime.
    compatibilityDate: '2026-07-30',
  });
  const d1 = (await mf.getD1Database('DB')) as unknown as SqlDatabase;
  await applyMigrations(d1 as unknown as { prepare(sql: string): { run(): Promise<unknown> } });
  return {
    db: d1,
    dispose: () => mf.dispose(),
  };
}
