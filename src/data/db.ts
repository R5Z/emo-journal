import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('emotion_journal.db');

let _isReady = false;

export function isDBReady() {
  return _isReady;
}

export async function initDB(): Promise<void> {
  if (_isReady) return;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      body TEXT NOT NULL
    );
  `);

  _isReady = true;
}
