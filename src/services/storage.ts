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
 * @param targetDate 'YYYY-MM-DD' 형식의 날짜
 */
export const saveEntry = async (content: string, categoryIds: number[], targetDate: string) => {
  const jsonIds = JSON.stringify(categoryIds);
  
  // 현재 시각(HH:mm:ss) 정보를 가져옴
  const now = new Date();
  const timePart = now.toTimeString().split(' ')[0]; // "14:30:05" 형태
  
  // 전달받은 targetDate와 현재 시간을 합쳐서 'YYYY-MM-DD HH:mm:ss' 생성
  const formattedTimestamp = `${targetDate} ${timePart}`;

  const result = await db.runAsync(
    'INSERT INTO entries (content, emotionCategoryIds, createdAt) VALUES (?, ?, ?);',
    [content, jsonIds, formattedTimestamp]
  );
  return result.lastInsertRowId;
};

/**
 * [UPDATE] 일기 수정
 */
export const updateEntry = async (id: number, content: string, categoryIds: number[]) => {
  const jsonIds = JSON.stringify(categoryIds);
  const result = await db.runAsync(
    'UPDATE entries SET content = ?, emotionCategoryIds = ? WHERE id = ?;',
    [content, jsonIds, id]
  );
  return result.changes; 
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
 * [READ] 특정 날짜의 일기 조회 (리스트 로딩용)
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

/**
 * [READ] 특정 범위의 일기 조회 (주간/월간 집계용)
 */
export const getEntriesByRange = async (startDate: string, endDate: string): Promise<JournalEntry[]> => {
  const rows = await db.getAllAsync(
    "SELECT * FROM entries WHERE date(createdAt) BETWEEN date(?) AND date(?) ORDER BY createdAt ASC;",
    [startDate, endDate]
  );

  return rows.map((row: any) => ({
    id: row.id,
    content: row.content,
    emotionCategoryIds: row.emotionCategoryIds ? JSON.parse(row.emotionCategoryIds) : [],
    createdAt: row.createdAt,
  }));
};