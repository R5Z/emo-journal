import { db } from './db';

export type Entry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  body: string;
};

export async function insertEntry(entry: Entry): Promise<void> {
  await db.runAsync(
    `INSERT INTO entries (id, createdAt, updatedAt, body) VALUES (?, ?, ?, ?)`,
    [entry.id, entry.createdAt, entry.updatedAt, entry.body]
  );
}

export async function getEntriesByDate(dateKey: string): Promise<Entry[]> {
  const like = `${dateKey}%`;
  const rows = await db.getAllAsync<Entry>(
    `SELECT * FROM entries WHERE createdAt LIKE ? ORDER BY createdAt ASC`,
    [like]
  );
  return rows;
}
