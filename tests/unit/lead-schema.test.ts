/** Migration/SQL tests: the real .sql files execute against local D1 and enforce their constraints. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listMigrationFiles, loadMigrationStatements, splitSqlStatements } from '../../scripts/lib/migrations.ts';
import type { SqlDatabase } from '../../src/lib/leads/db.ts';
import { createTestDb, type TestDb } from '../helpers/d1.ts';

let harness: TestDb;
let db: SqlDatabase;

beforeEach(async () => {
  harness = await createTestDb();
  db = harness.db;
});
afterEach(async () => {
  await harness.dispose();
});

const EXPECTED_TABLES = [
  'calls', 'consents', 'lead_contacts', 'lead_events', 'lead_outcomes', 'lead_routes', 'leads',
  'partners', 'routing_rules', 'uploads',
];

describe('migrations', () => {
  it('are versioned files that execute successfully', () => {
    const files = listMigrationFiles();
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) expect(f).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/);
    const loaded = loadMigrationStatements();
    expect(loaded[0]?.statements.length).toBeGreaterThan(10);
  });

  it('splits trigger bodies correctly', () => {
    const statements = splitSqlStatements(
      `CREATE TABLE t (a TEXT);\nCREATE TRIGGER x BEFORE UPDATE ON t\nBEGIN\n  SELECT RAISE(ABORT, 'no');\nEND;\nCREATE INDEX i ON t (a);\n`,
    );
    expect(statements).toHaveLength(3);
    expect(statements[1]).toContain('RAISE(ABORT');
    expect(statements[1]?.trim().endsWith('END;')).toBe(true);
  });

  it('create every logical domain table and no others', async () => {
    const { results } = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name`)
      .all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual(EXPECTED_TABLES);
  });

  it('ship no seed data: no partners, rules, or leads exist', async () => {
    for (const table of EXPECTED_TABLES) {
      const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>();
      expect({ table, n: row?.n }).toEqual({ table, n: 0 });
    }
  });

  it('create useful indexes for lookup, routing, events, and timestamps', async () => {
    const { results } = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name`)
      .all<{ name: string }>();
    const names = results.map((r) => r.name);
    for (const expected of [
      'idx_leads_created_at', 'idx_lead_events_lead', 'idx_lead_routes_lead', 'idx_lead_routes_partner',
      'idx_lead_outcomes_lead', 'idx_routing_rules_selection', 'idx_uploads_lead', 'idx_calls_started',
    ]) {
      expect(names).toContain(expected);
    }
  });
});

describe('constraints', () => {
  const lead = (overrides: Record<string, string | null> = {}) => ({
    id: crypto.randomUUID(),
    submission_key: crypto.randomUUID(),
    source: 'test',
    municipality: 'Fixtureville',
    zip: '46226',
    problem_category: 'other',
    description: null,
    urgency: 'researching',
    camera_inspection: 'unsure',
    decision_maker: 'homeowner_decision_maker',
    created_at: '2026-09-19T12:00:00.000Z',
    ...overrides,
  });
  const insertLead = (values: Record<string, string | null>) =>
    db
      .prepare(
        `INSERT INTO leads (id, submission_key, source, municipality, zip, problem_category, description,
                            urgency, camera_inspection, decision_maker, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(...Object.values(values))
      .run();

  it('enforce enum CHECKs on lead columns', async () => {
    await expect(insertLead(lead({ urgency: 'whenever' }))).rejects.toThrow(/CHECK constraint failed/i);
    await expect(insertLead(lead({ problem_category: 'made_up' }))).rejects.toThrow(/CHECK constraint failed/i);
    await expect(insertLead(lead({ zip: '462' }))).rejects.toThrow(/CHECK constraint failed/i);
  });

  it('require at least one contact channel', async () => {
    const row = lead();
    await insertLead(row);
    await expect(
      db
        .prepare(`INSERT INTO lead_contacts (id, lead_id, first_name, phone_input, phone_e164, email, email_normalized, preferred_contact, created_at)
                  VALUES (?, ?, 'Fixture', NULL, NULL, NULL, NULL, 'phone', '2026-09-19T12:00:00.000Z')`)
        .bind(crypto.randomUUID(), row['id'] as string)
        .run(),
    ).rejects.toThrow(/CHECK constraint failed/i);
  });

  it('enforce foreign keys', async () => {
    await expect(
      db
        .prepare(`INSERT INTO lead_events (id, lead_id, event_type, actor, payload_json, created_at)
                  VALUES (?, ?, 'lead_created', 'system', '{}', '2026-09-19T12:00:00.000Z')`)
        .bind(crypto.randomUUID(), crypto.randomUUID())
        .run(),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/i);
  });

  it('reject a route that claims a partner without a rule, or none with both', async () => {
    const row = lead();
    await insertLead(row);
    await expect(
      db
        .prepare(`INSERT INTO lead_routes (id, lead_id, outcome, partner_id, routing_rule_id, decision_snapshot_json, decided_at)
                  VALUES (?, ?, 'assigned', NULL, NULL, '{}', '2026-09-19T12:00:00.000Z')`)
        .bind(crypto.randomUUID(), row['id'] as string)
        .run(),
    ).rejects.toThrow(/CHECK constraint failed/i);
  });

  it('require valid JSON in event payloads and route snapshots', async () => {
    const row = lead();
    await insertLead(row);
    await expect(
      db
        .prepare(`INSERT INTO lead_events (id, lead_id, event_type, actor, payload_json, created_at)
                  VALUES (?, ?, 'lead_created', 'system', 'not json', '2026-09-19T12:00:00.000Z')`)
        .bind(crypto.randomUUID(), row['id'] as string)
        .run(),
    ).rejects.toThrow(/CHECK constraint failed/i);
  });
});
