/**
 * The narrow subset of the Cloudflare D1 API this layer uses. A real D1 binding (and the local
 * Miniflare D1 used in tests) satisfies it structurally. Server-only: never import from
 * client-side code.
 */
export interface SqlResult<T = unknown> {
  results: T[];
  success: boolean;
  meta: { changes?: number; last_row_id?: number };
}

export interface SqlStatement {
  bind(...values: unknown[]): SqlStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<SqlResult<T>>;
  run(): Promise<SqlResult>;
}

export interface SqlDatabase {
  prepare(query: string): SqlStatement;
  /** D1 batches execute as a single SQL transaction: any failure rolls back the whole batch. */
  batch(statements: SqlStatement[]): Promise<SqlResult[]>;
}

/** True when an error from D1/SQLite is a UNIQUE constraint violation. */
export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Error && /UNIQUE constraint failed/i.test(err.message);
}

/** Injectable clock and id generator so persistence is deterministic in tests. */
export interface Runtime {
  now(): Date;
  newId(): string;
}

export const defaultRuntime: Runtime = {
  now: () => new Date(),
  newId: () => crypto.randomUUID(),
};
