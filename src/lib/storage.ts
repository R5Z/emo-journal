import * as SQLite from 'expo-sqlite';
import { JournalEntry, AnalysisResult, CategoryScore } from '../types';

const db = SQLite.openDatabaseSync('journal.db');

// ============================================
// DB 직렬화/역직렬화 헬퍼
// ============================================

type StoredEmotionResult = Pick<AnalysisResult, 'topCategories' | 'isNeutral'>;

const serializeResult = (result: StoredEmotionResult): string =>
  JSON.stringify(result);

const deserializeResult = (raw: string | null): StoredEmotionResult => {
  if (!raw) return { topCategories: [], isNeutral: true };

  try {
    const parsed = JSON.parse(raw);

    // v3 형식: { topCategories, isNeutral }
    if (parsed.topCategories) return parsed;

    // v1 호환: number[] → 마이그레이션되지 않은 레거시 데이터
    if (Array.isArray(parsed)) {
      return {
        topCategories: parsed.map((id: number): CategoryScore => ({
          categoryId: id,
          totalScore: 0,
          matchCount: 0,
        })),
        isNeutral: parsed.length === 0,
      };
    }
  } catch {
    // JSON 파싱 실패
  }

  return { topCategories: [], isNeutral: true };
};

const rowToEntry = (row: any): JournalEntry => ({
  id: row.id,
  content: row.content,
  emotionResult: deserializeResult(row.emotionResult ?? row.emotionCategoryIds),
  createdAt: row.createdAt,
});

// ============================================
// 초기화 & 마이그레이션
// ============================================

export const initDB = async () => {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  // 테이블이 없으면 v3 스키마로 생성
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      emotionResult TEXT,
      createdAt DATETIME
    );
  `);

  // v1 → v3 마이그레이션: emotionCategoryIds 열이 존재하면 데이터를 옮김
  await migrateFromV1();
};

const migrateFromV1 = async () => {
  // 기존 열이 있는지 확인
  const tableInfo: any[] = await db.getAllAsync("PRAGMA table_info('entries');");
  const hasOldColumn = tableInfo.some((col) => col.name === 'emotionCategoryIds');
  const hasNewColumn = tableInfo.some((col) => col.name === 'emotionResult');

  if (!hasOldColumn) return; // 이미 v3 스키마이거나 신규 설치

  // 새 열이 없으면 추가
  if (!hasNewColumn) {
    await db.execAsync('ALTER TABLE entries ADD COLUMN emotionResult TEXT;');
  }

  // 기존 데이터 변환
  const rows: any[] = await db.getAllAsync(
    'SELECT id, emotionCategoryIds FROM entries WHERE emotionResult IS NULL AND emotionCategoryIds IS NOT NULL;'
  );

  for (const row of rows) {
    const migrated = deserializeResult(row.emotionCategoryIds);
    await db.runAsync(
      'UPDATE entries SET emotionResult = ? WHERE id = ?;',
      [serializeResult(migrated), row.id]
    );
  }

  // 마이그레이션 완료 후 구 열 제거는 SQLite 제약으로 생략
  // (SQLite는 DROP COLUMN을 제한적으로 지원하므로 구 열은 남겨둠)
};

// ============================================
// CREATE
// ============================================

/**
 * 일기 저장
 * @param content 일기 텍스트
 * @param emotionResult 감정 분석 결과
 * @param targetDate 'YYYY-MM-DD' 형식
 */
export const saveEntry = async (
  content: string,
  emotionResult: StoredEmotionResult,
  targetDate: string,
) => {
  const json = serializeResult(emotionResult);
  const now = new Date();
  const timePart = now.toTimeString().split(' ')[0];
  const formattedTimestamp = `${targetDate} ${timePart}`;

  const result = await db.runAsync(
    'INSERT INTO entries (content, emotionResult, createdAt) VALUES (?, ?, ?);',
    [content, json, formattedTimestamp]
  );
  return result.lastInsertRowId;
};

// ============================================
// UPDATE
// ============================================

export const updateEntry = async (
  id: number,
  content: string,
  emotionResult: StoredEmotionResult,
) => {
  const json = serializeResult(emotionResult);
  const result = await db.runAsync(
    'UPDATE entries SET content = ?, emotionResult = ? WHERE id = ?;',
    [content, json, id]
  );
  return result.changes;
};

// ============================================
// DELETE
// ============================================

export const deleteEntry = async (id: number) => {
  const result = await db.runAsync('DELETE FROM entries WHERE id = ?;', [id]);
  return result.changes;
};

// ============================================
// READ
// ============================================

export const getAllEntries = async (): Promise<JournalEntry[]> => {
  const rows = await db.getAllAsync(
    'SELECT * FROM entries ORDER BY createdAt DESC;'
  );
  return rows.map(rowToEntry);
};

export const getEntriesByDate = async (
  dateStr: string,
): Promise<JournalEntry[]> => {
  const rows = await db.getAllAsync(
    "SELECT * FROM entries WHERE date(createdAt) = date(?) ORDER BY createdAt ASC;",
    [dateStr]
  );
  return rows.map(rowToEntry);
};

export const getEntriesByRange = async (
  startDate: string,
  endDate: string,
): Promise<JournalEntry[]> => {
  const rows = await db.getAllAsync(
    "SELECT * FROM entries WHERE date(createdAt) BETWEEN date(?) AND date(?) ORDER BY createdAt ASC;",
    [startDate, endDate]
  );
  return rows.map(rowToEntry);
};