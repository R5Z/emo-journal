import * as SQLite from 'expo-sqlite';
import { JournalEntry } from '../types';

// DB 연결
const db = SQLite.openDatabaseSync('journal.db');

/**
 * DB 초기화: 테이블 생성
 * emotionCategoryIds는 TEXT 타입으로 저장 (JSON string)
 */
export const initDB = async () => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      emotionCategoryIds TEXT, 
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

/**
 * 일기 저장
 * @param content 일기 내용
 * @param categoryIds 감정 분석 결과 ID 배열 (최대 2개)
 */
export const saveEntry = async (content: string, categoryIds: number[]) => {
  // 배열을 "[1, 2]" 형태의 문자열로 변환하여 저장
  const jsonIds = JSON.stringify(categoryIds);
  
  const result = await db.runAsync(
    'INSERT INTO entries (content, emotionCategoryIds) VALUES (?, ?);',
    [content, jsonIds]
  );
  return result.lastInsertRowId;
};

/**
 * 모든 일기 조회
 * 저장된 JSON 문자열을 다시 배열로 변환하여 반환
 */
export const getAllEntries = async (): Promise<JournalEntry[]> => {
  const rows = await db.getAllAsync('SELECT * FROM entries ORDER BY createdAt DESC;');
  
  return rows.map((row: any) => ({
    id: row.id,
    content: row.content,
    // 문자열 "[1, 2]"를 다시 [1, 2] 배열로 변환
    emotionCategoryIds: row.emotionCategoryIds ? JSON.parse(row.emotionCategoryIds) : [],
    createdAt: row.createdAt,
  }));
};

/**
 * 특정 날짜의 일기 조회 (나중에 타임라인 뷰에서 사용)
 */
export const getEntriesByDate = async (dateStr: string): Promise<JournalEntry[]> => {
  // dateStr 예시: "2024-05-20"
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