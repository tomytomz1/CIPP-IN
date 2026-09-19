/**
 * Applies every D1 migration to a throwaway local database (Miniflare) and reports the schema.
 * Catches SQL syntax/constraint errors in CI without any remote Cloudflare resource.
 *
 * Note: `wrangler d1 migrations apply` is the production path. It requires a configured D1
 * binding with a real database_id, which does not exist yet (nothing is provisioned and no id
 * is invented), so the same .sql files are executed here instead.
 */
import { Miniflare } from 'miniflare';
import { applyMigrations, listMigrationFiles } from './lib/migrations.ts';

const mf = new Miniflare({
  modules: true,
  script: 'export default { fetch() { return new Response("migration check"); } };',
  d1Databases: { DB: 'local-migration-check' },
  compatibilityDate: '2026-07-30',
});

try {
  const db = await mf.getD1Database('DB');
  const applied = await applyMigrations(db as unknown as { prepare(sql: string): { run(): Promise<unknown> } });
  const tables = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name`)
    .all<{ name: string }>();
  const indexes = await db
    .prepare(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'`)
    .first<{ n: number }>();
  const triggers = await db.prepare(`SELECT COUNT(*) AS n FROM sqlite_master WHERE type='trigger'`).first<{ n: number }>();

  let rows = 0;
  for (const t of tables.results) {
    const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${t.name}`).first<{ n: number }>();
    rows += row?.n ?? 0;
  }
  if (rows !== 0) throw new Error(`migrations must not seed data, found ${rows} row(s)`);

  console.log(`Migration files: ${listMigrationFiles().join(', ')}`);
  console.log(`Applied ${applied.statements} statements from ${applied.files} file(s).`);
  console.log(`Tables (${tables.results.length}): ${tables.results.map((t: { name: string }) => t.name).join(', ')}`);
  console.log(`Indexes: ${indexes?.n ?? 0}; append-only triggers: ${triggers?.n ?? 0}; seeded rows: 0`);
  console.log('OK: migrations apply cleanly to a local D1 database.');
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await mf.dispose();
}
