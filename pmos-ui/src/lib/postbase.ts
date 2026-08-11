// src/lib/postbase.ts
// Thin PostBase (Firebase-compatible) client wrapper used by the PMOS data layer.
// PostBase backend is expected to run locally on POSTBASE_URL (default http://localhost:8081/api/db).
import { getDB } from "@postbase/client/db.js";

const BASE_URL =
  process.env.POSTBASE_URL ?? "http://localhost:8081/api/db";

export const db = getDB({ baseUrl: BASE_URL });

export function postbaseError(action: string, table: string, id: string, err: unknown): Error {
  const detail = err instanceof Error ? err.message : String(err);
  return new Error(
    `[postbase] ${action} failed for ${table}/${id}: ${detail} — ` +
      `is the PostBase backend running at ${BASE_URL}? ` +
      `(start it with: cd ~/.pmos/postbase/backend && npm run start:local)`
  );
}

/**
 * Recursively convert PostBase data into plain JSON-safe objects.
 * @postbase/client parses ISO date strings into its own `Timestamp` class
 * instances, and Next.js App Router refuses to serialize class instances
 * (or null-prototype objects) from Server Components into Client Components
 * ("Only plain objects ... can be passed to Client Components"). Normalize
 * here so every consumer (pages, API routes) receives plain data.
 */
export function toPlain<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString() as unknown as T;
  if (typeof value === "object") {
    // @postbase/client Timestamp-like objects expose toDate()
    const ts = value as { toDate?: () => Date };
    if (typeof ts.toDate === "function") return ts.toDate().toISOString() as unknown as T;
    if (Array.isArray(value)) return value.map(toPlain) as unknown as T;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out[key] = toPlain((value as Record<string, unknown>)[key]);
    }
    return out as unknown as T;
  }
  return value;
}

/** Read a single document. Returns null when the doc does not exist. */
export async function readDoc<T>(table: string, id: string): Promise<T | null> {
  try {
    const snap = await db.collection(table).doc(id).get();
    const data = snap.data();
    return data === undefined || data === null ? null : toPlain(data as T);
  } catch (err) {
    throw postbaseError("read", table, id, err);
  }
}

/** Read a document, treating a missing doc as an empty array wrapper. */
export async function readItems<T>(table: string, id: string): Promise<T[]> {
  const doc = await readDoc<{ items?: T[] }>(table, id);
  return doc?.items ?? [];
}

/** Write (upsert) a whole document. */
export async function writeDoc(table: string, id: string, data: unknown): Promise<void> {
  try {
    await db.collection(table).doc(id).set(data);
  } catch (err) {
    throw postbaseError("write", table, id, err);
  }
}

/** Store an array as a wrapped document ({ items: [...] }). */
export async function writeItems<T>(table: string, id: string, items: T[]): Promise<void> {
  await writeDoc(table, id, { items });
}

export async function deleteDoc(table: string, id: string): Promise<void> {
  try {
    await db.collection(table).doc(id).delete();
  } catch (err) {
    throw postbaseError("delete", table, id, err);
  }
}
