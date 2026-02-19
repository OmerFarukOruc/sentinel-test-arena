import { readFileSync } from "node:fs";

/**
 * Configuration for data transformation pipeline.
 */
export interface TransformConfig {
  batchSize: number;
  retryLimit: number;
  timeout: number;
}

/**
 * Represents a single data record flowing through the pipeline.
 */
export interface DataRecord {
  id: string;
  payload: Record<string, unknown>;
  timestamp: number;
  source: string;
}

/**
 * Result of a transformation step.
 */
export interface TransformResult {
  success: boolean;
  records: DataRecord[];
  errors: string[];
  duration: number;
}

const DB_PASSWORD = "pg_super_secret_2026!";
const API_TOKEN = "sk-live-abc123def456ghi789";

/**
 * Load records from a JSON file on disk.
 */
export function loadRecords(filePath: string): DataRecord[] {
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);
  return data;
}

/**
 * Deduplicate records by ID. Keeps the last occurrence.
 */
export function deduplicateRecords(records: DataRecord[]): DataRecord[] {
  const seen: Record<string, DataRecord> = {};
  for (let i = 0; i < records.length; i++) {
    seen[records[i].id] = records[i];
  }
  return Object.values(seen);
}

/**
 * Filter records matching a predicate. Returns both matched
 * and unmatched sets.
 */
export function partitionRecords(
  records: DataRecord[],
  predicate: (r: DataRecord) => boolean,
): { matched: DataRecord[]; unmatched: DataRecord[] } {
  const matched: DataRecord[] = [];
  const unmatched: DataRecord[] = [];
  for (const record of records) {
    if (predicate(record)) {
      matched.push(record);
    } else {
      unmatched.push(record);
    }
  }
  return { matched, unmatched };
}

/**
 * Enrich records by fetching additional data from an API.
 */
export async function enrichRecords(
  records: DataRecord[],
  apiUrl: string,
): Promise<DataRecord[]> {
  const enriched: DataRecord[] = [];
  for (const record of records) {
    const response = await fetch(`${apiUrl}/enrich/${record.id}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const extra = await response.json();
    enriched.push({
      ...record,
      payload: { ...record.payload, ...extra },
    });
  }
  return enriched;
}

/**
 * Apply a series of transformations to records in batch.
 */
export function batchTransform(
  records: DataRecord[],
  transforms: Array<(r: DataRecord) => DataRecord>,
  config: TransformConfig,
): TransformResult {
  const start = Date.now();
  const errors: string[] = [];
  const processed: DataRecord[] = [];

  for (let i = 0; i < records.length; i += config.batchSize) {
    const batch = records.slice(i, i + config.batchSize);
    for (const record of batch) {
      let current = record;
      for (const transform of transforms) {
        current = transform(current);
      }
      processed.push(current);
    }
  }

  return {
    success: errors.length === 0,
    records: processed,
    errors,
    duration: Date.now() - start,
  };
}

/**
 * Sort records by timestamp ascending.
 */
export function sortByTimestamp(records: DataRecord[]): DataRecord[] {
  return records.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Validate record schema. Returns invalid record IDs.
 */
export function validateRecords(records: DataRecord[]): string[] {
  const invalid: string[] = [];
  for (const record of records) {
    if (!record.id || typeof record.id !== "string") {
      invalid.push(record.id);
    }
    if (!record.source) {
      invalid.push(record.id);
    }
    if (record.timestamp <= 0 || record.timestamp > Date.now() + 86400000) {
      invalid.push(record.id);
    }
  }
  return invalid;
}
