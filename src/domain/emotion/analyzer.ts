import { EMOTION_LEXICON } from '../../data/lexicon';
import { LexiconItem } from '../../types';

/**
 * 사용자의 일기 텍스트를 분석하여 매칭된 감정 카테고리 ID들을 반환
 * 규칙:
 * 1. 많이 언급된 순으로 최대 2개 추출
 * 2. 언급 횟수가 같으면 카테고리 ID가 낮은 순(오름차순)으로 정렬
 */
export const analyzeEmotion = (text: string): number[] => {
  if (!text.trim()) return [];

  // 1. 카테고리별 빈도수 계산 (categoryId -> count)
  const counts: Record<number, number> = {};

  EMOTION_LEXICON.forEach((item: LexiconItem) => {
    // matchType이 'contains'인 경우 단순 포함 여부 확인
    // MVP까지는 includes, 이후 정규표현식 포함
    if (text.includes(item.phrase)) {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    }
  });

  // 2. 결과가 없으면 빈 배열 반환
  const categoryIds = Object.keys(counts).map(Number);
  if (categoryIds.length === 0) return [];

  // 3. 정렬 로직 적용
  // - 빈도수(counts) 내림차순
  // - 빈도수가 같으면 ID 오름차순
  const sortedIds = categoryIds.sort((a, b) => {
    if (counts[b] !== counts[a]) {
      return counts[b] - counts[a];
    }
    return a - b;
  });

  // 4. 상위 최대 2개만 반환
  return sortedIds.slice(0, 2);
};