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
      createdAt DATETIME 
    );
  `);
};

/**
 * [CREATE] 일기 저장
 */
export const saveEntry = async (content: string, categoryIds: number[]) => {
  const jsonIds = JSON.stringify(categoryIds);
  
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localIsoString = new Date(now.getTime() - offset).toISOString();
  const formattedTimestamp = localIsoString.replace('T', ' ').split('.')[0];

  const result = await db.runAsync(
    'INSERT INTO entries (content, emotionCategoryIds, createdAt) VALUES (?, ?, ?);',
    [content, jsonIds, formattedTimestamp]
  );
  return result.lastInsertRowId;
};

/**
 * [UPDATE] 일기 수정
 * 수정 시에는 기존의 createdAt(작성 시간)은 유지하고 내용과 감정 ID만 업데이트
 */
export const updateEntry = async (id: number, content: string, categoryIds: number[]) => {
  const jsonIds = JSON.stringify(categoryIds);
  
  const result = await db.runAsync(
    'UPDATE entries SET content = ?, emotionCategoryIds = ? WHERE id = ?;',
    [content, jsonIds, id]
  );
  return result.changes; // 영향받은 행의 수 반환
};

/**
 * [DELETE] 일기 삭제
 */
export const deleteEntry = async (id: number) => {
  const result = await db.runAsync('DELETE FROM entries WHERE id = ?;', [id]);
  return result.changes;
};

/**
 * [READ] 모든 일기 조회
 */
export const getAllEntries = async (): Promise<JournalEntry[]> => {
  const rows = await db.getAllAsync('SELECT * FROM entries ORDER BY createdAt DESC;');
  
  return rows.map((row: any) => ({
    id: row.id,
    content: row.content,
    emotionCategoryIds: row.emotionCategoryIds ? JSON.parse(row.emotionCategoryIds) : [],
    createdAt: row.createdAt,
  }));
};

/**
 * [READ] 특정 날짜의 일기 조회
 */
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