import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/** A single recorded answer submission. */
export interface Submission {
  id?: number;
  /** First factor (1-12). */
  a: number;
  /** Second factor (1-12). */
  b: number;
  /** The correct answer (a * b). */
  answer: number;
  /** The value the user submitted. */
  given: number;
  /** Whether the submitted value matched the answer. */
  correct: boolean;
  /** Milliseconds from when the exercise was shown until submission. */
  durationMs: number;
  /** Epoch milliseconds when the answer was submitted. */
  timestamp: number;
}

interface TablesDB extends DBSchema {
  submissions: {
    key: number;
    value: Submission;
    indexes: { "by-timestamp": number };
  };
}

const DB_NAME = "multiplication-tables";
const DB_VERSION = 1;
const STORE = "submissions";

let dbPromise: Promise<IDBPDatabase<TablesDB>> | null = null;

function getDB(): Promise<IDBPDatabase<TablesDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TablesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("by-timestamp", "timestamp");
      },
    });
  }
  return dbPromise;
}

/** Persist a submission and return its generated id. */
export async function addSubmission(
  submission: Submission
): Promise<number> {
  const db = await getDB();
  return db.add(STORE, submission);
}

/** Read every stored submission, oldest first. */
export async function getAllSubmissions(): Promise<Submission[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE, "by-timestamp");
}
