/**
 * Migration loading/splitting for D1.
 *
 * `wrangler d1 migrations apply` is the production path, but it requires a configured D1 binding
 * with a real database_id, which does not exist yet (no remote database is provisioned, and no
 * id is invented). Until then the same .sql files are applied statement-by-statement here, so
 * tests and CI execute the real SQL against the local D1 (Miniflare) engine.
 *
 * Statement convention: statements end with ';' at end of line; trigger bodies run from a line
 * ending in BEGIN to a line that is exactly END;
 */
import { readdirSync, readFileSync } from 'node:fs';

export const MIGRATIONS_DIR = new URL('../../migrations/', import.meta.url);

export function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

/** Splits one migration file into executable statements, ignoring comments and blank lines. */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current: string[] = [];
  let inTriggerBody = false;

  for (const rawLine of sql.split(/\r?\n/)) {
    const line = rawLine.replace(/--.*$/, '').trimEnd();
    if (line.trim() === '') continue;
    current.push(line);

    if (/\bBEGIN\s*$/i.test(line)) {
      inTriggerBody = true;
      continue;
    }
    if (inTriggerBody) {
      if (/^\s*END\s*;\s*$/i.test(line)) {
        inTriggerBody = false;
        statements.push(current.join('\n').trim());
        current = [];
      }
      continue;
    }
    if (line.endsWith(';')) {
      statements.push(current.join('\n').trim().replace(/;$/, ''));
      current = [];
    }
  }
  if (current.length > 0) throw new Error(`unterminated SQL statement: ${current.join('\n').slice(0, 120)}`);
  return statements;
}

export function loadMigrationStatements(): { file: string; statements: string[] }[] {
  return listMigrationFiles().map((file) => ({
    file,
    statements: splitSqlStatements(readFileSync(new URL(file, MIGRATIONS_DIR), 'utf8')),
  }));
}

export interface MinimalDb {
  prepare(sql: string): { run(): Promise<unknown> };
}

/** Applies every migration file in order. Throws on the first SQL error, naming the statement. */
export async function applyMigrations(db: MinimalDb): Promise<{ files: number; statements: number }> {
  let statementCount = 0;
  const migrations = loadMigrationStatements();
  for (const { file, statements } of migrations) {
    for (const statement of statements) {
      try {
        await db.prepare(statement).run();
        statementCount += 1;
      } catch (err) {
        throw new Error(`${file}: failed statement:\n${statement}\n${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  return { files: migrations.length, statements: statementCount };
}
