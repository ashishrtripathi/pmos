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

/** Read a single document. Returns null when the doc does not exist. */
export async function readDoc<T>(table: string, id: string): Promise<T | null> {
  try {
    const snap = await db.collection(table).doc(id).get();
    const data = snap.data();
    return data === undefined || data === null ? null : (data as T);
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
