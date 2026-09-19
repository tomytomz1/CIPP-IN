/**
 * Contractor/operator enrichment: outcome entries, call metadata, and upload metadata.
 * All three are append-only records validated against strict schemas. Nothing here is collected
 * from the public intake form, and none of it is active yet:
 *   - call tracking is not provisioned and recording is structurally impossible;
 *   - uploads store metadata only (no file content) and remain feature-controlled off.
 */
import {
  callRecordSchema,
  outcomeEntrySchema,
  uploadMetadataSchema,
  type CallRecord,
  type OutcomeEntry,
  type UploadMetadata,
} from './contract.ts';
import { defaultRuntime, type Runtime, type SqlDatabase } from './db.ts';
import { insertEvent, insertOutcome, listOutcomes, type OutcomeRow } from './repository.ts';

export class EnrichmentValidationError extends Error {
  constructor(readonly issues: { path: string; message: string }[]) {
    super('enrichment validation failed');
    this.name = 'EnrichmentValidationError';
  }
}

function parseOrThrow<T>(schema: { safeParse(v: unknown): { success: boolean; data?: T; error?: { issues: { path: PropertyKey[]; message: string }[] } } }, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success || !parsed.data) {
    throw new EnrichmentValidationError((parsed.error?.issues ?? []).map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return parsed.data;
}

/** Appends an outcome entry. Existing entries are never modified. */
export async function recordOutcome(db: SqlDatabase, input: unknown, runtime: Runtime = defaultRuntime): Promise<string> {
  const entry: OutcomeEntry = parseOrThrow(outcomeEntrySchema, input);
  const id = runtime.newId();
  const recordedAt = runtime.now().toISOString();
  await db.batch([
    insertOutcome(db, {
      id,
      lead_id: entry.leadId,
      route_id: entry.routeId ?? null,
      reported_by: entry.reportedBy,
      first_contact_at: entry.firstContactAt ?? null,
      appointment_status: entry.appointmentStatus ?? null,
      appointment_at: entry.appointmentAt ?? null,
      qualification: entry.qualification ?? null,
      diagnosis: entry.diagnosis ?? null,
      proposed_method: entry.proposedMethod ?? null,
      quote_band: entry.quoteBand ?? null,
      result: entry.result ?? null,
      lost_reason: entry.lostReason ?? null,
      final_method: entry.finalMethod ?? null,
      final_project_value_cents: entry.finalProjectValueCents ?? null,
      value_voluntarily_provided: entry.valueVoluntarilyProvided ? 1 : 0,
      completed_at: entry.completedAt ?? null,
      recorded_at: recordedAt,
    }),
    insertEvent(db, {
      id: runtime.newId(),
      lead_id: entry.leadId,
      event_type: 'outcome_recorded',
      actor: entry.reportedBy,
      payload: { outcomeId: id, qualification: entry.qualification ?? null, result: entry.result ?? null },
      created_at: recordedAt,
    }),
  ]);
  return id;
}

export interface OutcomeSnapshot {
  entries: number;
  firstContactAt: string | null;
  /** Seconds between the routing decision and first contact, when both are known. */
  responseSeconds: number | null;
  qualification: string | null;
  result: string | null;
  finalProjectValueCents: number | null;
}

/** Derives the current view from the append-only entries. Later non-null values win. */
export async function outcomeSnapshot(db: SqlDatabase, leadId: string): Promise<OutcomeSnapshot> {
  const entries = await listOutcomes(db, leadId);
  const latest = <K extends keyof OutcomeRow>(key: K): OutcomeRow[K] | null => {
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const value = entries[i]?.[key];
      if (value !== null && value !== undefined) return value;
    }
    return null;
  };
  const firstContactAt = latest('first_contact_at') as string | null;
  let responseSeconds: number | null = null;
  if (firstContactAt) {
    const route = await db
      .prepare(`SELECT decided_at FROM lead_routes WHERE lead_id = ? ORDER BY decided_at ASC LIMIT 1`)
      .bind(leadId)
      .first<{ decided_at: string }>();
    if (route) {
      responseSeconds = Math.round((Date.parse(firstContactAt) - Date.parse(route.decided_at)) / 1000);
    }
  }
  return {
    entries: entries.length,
    firstContactAt,
    responseSeconds,
    qualification: latest('qualification') as string | null,
    result: latest('result') as string | null,
    finalProjectValueCents: latest('final_project_value_cents') as number | null,
  };
}

/** Records call metadata. There is no recording flag: recording_enabled is always 0. */
export async function recordCall(db: SqlDatabase, input: unknown, runtime: Runtime = defaultRuntime): Promise<string> {
  const call: CallRecord = parseOrThrow(callRecordSchema, input);
  const id = runtime.newId();
  await db
    .prepare(
      `INSERT INTO calls (id, provider, provider_call_id, lead_id, partner_id, route_id, started_at, ended_at,
                          duration_seconds, disposition, recording_enabled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    )
    .bind(
      id, call.provider, call.providerCallId, call.leadId ?? null, call.partnerId ?? null, call.routeId ?? null,
      call.startedAt, call.endedAt ?? null, call.durationSeconds ?? null, call.disposition ?? null,
      runtime.now().toISOString(),
    )
    .run();
  return id;
}

/** Records upload metadata only. File content is never accepted or stored. */
export async function recordUpload(db: SqlDatabase, input: unknown, runtime: Runtime = defaultRuntime): Promise<string> {
  const upload: UploadMetadata = parseOrThrow(uploadMetadataSchema, input);
  const id = runtime.newId();
  await db
    .prepare(`INSERT INTO uploads (id, lead_id, storage_key, category, media_type, byte_size, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, upload.leadId, upload.storageKey, upload.category, upload.mediaType, upload.byteSize ?? null, upload.status, runtime.now().toISOString())
    .run();
  return id;
}
