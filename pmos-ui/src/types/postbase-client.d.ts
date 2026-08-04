// Ambient declarations for the @postbase/client package (plain JS, no bundled types).
declare module "@postbase/client/db.js" {
  export interface DocumentSnapshot<T = any> {
    id: string;
    exists: boolean;
    data(): T | undefined;
  }

  export interface DocumentReference<T = any> {
    id: string;
    get(): Promise<DocumentSnapshot<T>>;
    set(data: T, options?: { merge?: boolean }): Promise<DocumentSnapshot<T>>;
    update(data: Partial<T>): Promise<void>;
    delete(): Promise<void>;
  }

  export interface Query {
    where(field: string, op: string, value: unknown): Query;
    limit(n: number): Query;
    get(): Promise<QuerySnapshot>;
  }

  export interface CollectionReference<T = any> extends Query {
    id: string;
    doc(id: string): DocumentReference<T>;
    add(data: T): Promise<DocumentReference<T>>;
    get(): Promise<QuerySnapshot<T>>;
    onSnapshot(
      callback: (snapshot: QuerySnapshot<T>) => void,
      errorCallback?: (error: Error) => void
    ): () => void;
  }

  export interface QuerySnapshot<T = any> {
    docs: DocumentSnapshot<T>[];
    size: number;
  }

  export interface Database {
    collection<T = any>(name: string): CollectionReference<T>;
  }

  export interface GetDBConfig {
    baseUrl?: string;
    headers?: Record<string, string>;
    getAuthToken?: () => Promise<string | null>;
  }

  export function getDB(config?: GetDBConfig): Database;
}
