import * as SQLite from 'expo-sqlite';
import { JournalEntry } from '../types';

const db = SQLite.openDatabaseSync('journal.db');

export const initDB = async () => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      emotionCategoryIds TEXT, 
      createdAt DATETIME -- DEFAULT 제거: saveEntry에서 직접 입력
    );
  `);
};

/**
 * 일기 저장 (한국 시간 대응 버전)
 */
export const saveEntry = async (content: string, categoryIds: number[]) => {
  const jsonIds = JSON.stringify(categoryIds);
  
  // 1. 한국 시간(로컬) 문자열 생성 (포맷: YYYY-MM-DD HH:mm:ss)
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localIsoString = new Date(now.getTime() - offset).toISOString();
  const formattedTimestamp = localIsoString.replace('T', ' ').split('.')[0];

  console.log('💾 DB 저장 시각:', formattedTimestamp);

  const result = await db.runAsync(
    'INSERT INTO entries (content, emotionCategoryIds, createdAt) VALUES (?, ?, ?);',
    [content, jsonIds, formattedTimestamp] // 직접 생성한 시간을 넣습니다.
  );
  return result.lastInsertRowId;
};

export const getAllEntries = async (): Promise<JournalEntry[]> => {
  const rows = await db.getAllAsync('SELECT * FROM entries ORDER BY createdAt DESC;');
  
  return rows.map((row: any) => ({
    id: row.id,
    content: row.content,
    emotionCategoryIds: row.emotionCategoryIds ? JSON.parse(row.emotionCategoryIds) : [],
    createdAt: row.createdAt,
  }));
};

export const getEntriesByDate = async (dateStr: string): Promise<JournalEntry[]> => {
  const rows = await db.getAllAsync(
    "SELECT * FROM entries WHERE date(createdAt) = date(?) ORDER BY createdAt ASC;",
    [dateStr]
  );

  return rows.map((row: any) => ({
    id: row.id,
    content: row.content,
    emotionCategoryIds: row.emotionCategoryIds ? JSON.parse(row.emotionCategoryIds) : [],
    createdAt: row.createdAt,
  }));
};