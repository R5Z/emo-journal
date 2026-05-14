import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import { getAllEntries, saveEntry, initDB } from './storage';
import { EMOTION_CATEGORIES } from '../data/emotion-setup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

// ============================================
// Types
// ============================================

type ExportData = {
  version: 1;
  exportedAt: string;
  appName: string;
  entries: {
    content: string;
    emotionResult: any;
    createdAt: string;
  }[];
};

// ============================================
// Helpers
// ============================================

const categoryMap = new Map(
  EMOTION_CATEGORIES.map((c) => [c.categoryId, c]),
);

const getEmotionNames = (topCategories: { categoryId: number }[]): string => {
  return topCategories
    .map((c) => categoryMap.get(c.categoryId)?.name || '중립')
    .join(', ');
};

// ============================================
// JSON Export
// ============================================

export async function exportAsJSON(): Promise<boolean> {
  try {
    const entries = await getAllEntries();

    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'emotion-journal',
      entries: entries.map((e) => ({
        content: e.content,
        emotionResult: e.emotionResult,
        createdAt: e.createdAt,
      })),
    };

    const json = JSON.stringify(data, null, 2);
    const fileName = `감정일기_백업_${new Date().toISOString().split('T')[0]}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, json);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: '일기 데이터 내보내기',
        UTI: 'public.json',
      });
    }

    return true;
  } catch (error) {
    console.error('JSON 내보내기 실패:', error);
    return false;
  }
}

// ============================================
// PDF Export
// ============================================

export async function exportAsPDF(): Promise<boolean> {
  try {
    const entries = await getAllEntries();

    if (entries.length === 0) {
      return false;
    }

    // 날짜별 그룹
    const byDate = new Map<string, typeof entries>();
    entries.forEach((e) => {
      const date = e.createdAt.split(' ')[0];
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(e);
    });

    const sortedDates = [...byDate.keys()].sort().reverse();

    // HTML 생성
    const entriesHtml = sortedDates
      .map((date) => {
        const dayEntries = byDate.get(date)!;
        const [y, m, d] = date.split('-');
        const dateHeader = `${y}년 ${Number(m)}월 ${Number(d)}일`;

        const items = dayEntries
          .map((entry) => {
            const time = entry.createdAt.split(' ')[1]?.substring(0, 5) || '';
            const emotions = entry.emotionResult?.isNeutral
              ? '중립'
              : getEmotionNames(entry.emotionResult?.topCategories || []);
            const emotionColors = entry.emotionResult?.topCategories
              ?.map((c: { categoryId: number }) => categoryMap.get(c.categoryId)?.colorHex || '#E5E5EA')
              || ['#E5E5EA'];
            const barColor = emotionColors[0];

            return `
              <div class="entry">
                <div class="entry-bar" style="background-color: ${barColor}"></div>
                <div class="entry-content">
                  <div class="entry-meta">
                    <span class="time">${time}</span>
                    <span class="emotions">${emotions}</span>
                  </div>
                  <p class="text">${entry.content.replace(/\n/g, '<br>')}</p>
                </div>
              </div>
            `;
          })
          .join('');

        return `
          <div class="day-group">
            <h2 class="date-header">${dateHeader}</h2>
            ${items}
          </div>
        `;
      })
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, sans-serif;
            padding: 40px;
            color: #1C1C1E;
            font-size: 14px;
            line-height: 1.6;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .subtitle {
            color: #8E8E93;
            font-size: 12px;
            margin-bottom: 32px;
          }
          .day-group {
            margin-bottom: 28px;
          }
          .date-header {
            font-size: 16px;
            font-weight: 700;
            color: #3C3C43;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #E5E5EA;
          }
          .entry {
            display: flex;
            margin-bottom: 12px;
            background: #F9F9FB;
            border-radius: 8px;
            overflow: hidden;
          }
          .entry-bar {
            width: 4px;
            flex-shrink: 0;
          }
          .entry-content {
            padding: 12px 14px;
            flex: 1;
          }
          .entry-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }
          .time {
            font-size: 11px;
            color: #8E8E93;
            font-weight: 600;
          }
          .emotions {
            font-size: 11px;
            color: #8E8E93;
          }
          .text {
            font-size: 14px;
            line-height: 1.7;
          }
        </style>
      </head>
      <body>
        <h1>감정 일기</h1>
        <p class="subtitle">내보내기: ${new Date().toLocaleDateString('ko-KR')} · ${entries.length}개의 기록</p>
        ${entriesHtml}
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    const fileName = `감정일기_${new Date().toISOString().split('T')[0]}.pdf`;
    const newUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.moveAsync({ from: uri, to: newUri });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: '일기 PDF 내보내기',
        UTI: 'com.adobe.pdf',
      });
    }

    return true;
  } catch (error) {
    console.error('PDF 내보내기 실패:', error);
    return false;
  }
}

// ============================================
// JSON Import
// ============================================

export async function importFromJSON(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, count: 0, error: '취소됨' };
    }

    const fileUri = result.assets[0].uri;
    const raw = await FileSystem.readAsStringAsync(fileUri);
    const data: ExportData = JSON.parse(raw);

    // 유효성 검사
    if (!data.version || !data.entries || !Array.isArray(data.entries)) {
      return {
        success: false,
        count: 0,
        error: '유효하지 않은 백업 파일입니다.',
      };
    }

    // DB 초기화 확인
    await initDB();

    // 기존 entries와 중복 체크 (createdAt 기준)
    const existing = await getAllEntries();
    const existingKeys = new Set(
      existing.map((e) => `${e.createdAt}|${e.content.substring(0, 50)}`),
    );

    let importedCount = 0;

    for (const entry of data.entries) {
      const key = `${entry.createdAt}|${entry.content.substring(0, 50)}`;
      if (existingKeys.has(key)) continue; // 중복 건너뛰기

      const date = entry.createdAt.split(' ')[0];
      await saveEntry(entry.content, entry.emotionResult, date);
      importedCount++;
    }

    return { success: true, count: importedCount };
  } catch (error) {
    console.error('JSON 가져오기 실패:', error);
    return {
      success: false,
      count: 0,
      error: '파일을 읽는 중 오류가 발생했습니다.',
    };
  }
}

// ============================================
// Delete All Data
// ============================================

export async function deleteAllData(): Promise<boolean> {
  try {
    // SQLite DB 삭제
    const db = SQLite.openDatabaseSync('journal.db');
    await db.execAsync('DELETE FROM entries;');

    // AsyncStorage에서 설정 관련 키만 삭제 (프로필은 유지할지 선택)
    const keysToDelete = [
      '@vhue_settings',
      '@vhue_profile',
      '@vhue_pin_hash',
      '@vhue_bg_time',
    ];
    await AsyncStorage.multiRemove(keysToDelete);

    return true;
  } catch (error) {
    console.error('전체 삭제 실패:', error);
    return false;
  }
}