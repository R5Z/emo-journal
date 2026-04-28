/**
 * 스트릭(연속 기록) 계산 모듈
 */

export type StreakStats = {
  current: number;
  longest: number;
  total: number;
};

/** 로컬 날짜 문자열 (YYYY-MM-DD) */
const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** 두 YYYY-MM-DD 문자열 사이의 일 수 차이 */
const dayDiff = (a: string, b: string): number => {
  const msA = new Date(a + 'T00:00:00').getTime();
  const msB = new Date(b + 'T00:00:00').getTime();
  return Math.round((msB - msA) / 86_400_000);
};

/**
 * 일기 entries로부터 스트릭 통계 계산
 * @param entries createdAt 필드를 가진 배열
 */
export function calculateStreaks(
  entries: { createdAt: string }[],
): StreakStats {
  if (entries.length === 0) {
    return { current: 0, longest: 0, total: 0 };
  }

  // 고유 날짜 오름차순
  const dates = [
    ...new Set(entries.map((e) => e.createdAt.split(' ')[0])),
  ].sort();

  const total = dates.length;

  // longest streak
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dayDiff(dates[i - 1], dates[i]) === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // current streak: 마지막 기록이 오늘 또는 어제여야 유효
  const today = toLocalDateStr(new Date());
  const yesterday = toLocalDateStr(new Date(Date.now() - 86_400_000));
  const last = dates[dates.length - 1];

  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      if (dayDiff(dates[i], dates[i + 1]) === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest, total };
}

/**
 * entries에서 가장 오래된 날짜를 포맷
 * @returns "2025.01.15 첫 기록" 형태, entries가 없으면 빈 문자열
 */
export function getFirstRecordDate(
  entries: { createdAt: string }[],
): string {
  if (entries.length === 0) return '';

  const dates = entries.map((e) => e.createdAt.split(' ')[0]).sort();
  const [y, m, d] = dates[0].split('-');
  return `${y}.${m}.${d} 첫 기록`;
}