import { EMOTION_LEXICON } from '../../data/lexicon';
import { LexiconItem } from '../../types';

/**
 * 사용자의 일기 텍스트를 분석하여 매칭된 감정 카테고리 ID들을 반환
 * 규칙:
 * 1. 많이 언급된 순으로 최대 2개 추출
 * 2. 언급 횟수가 같으면 카테고리 ID가 낮은 순(오름차순)으로 정렬
 */
export const analyzeEmotion = (text: string): number[] => {
  console.log('--- [분석기 동작 시작] ---');
  console.log('1. 입력 텍스트:', text);
  
  // 사전 데이터 로드 확인 (가장 먼저 체크해야 할 부분)
  if (!EMOTION_LEXICON || EMOTION_LEXICON.length === 0) {
    console.error('❌ 에러: EMOTION_LEXICON 데이터가 비어있거나 경로가 잘못되었습니다.');
    return [];
  }
  
  console.log(`2. 현재 로드된 사전 단어 수: ${EMOTION_LEXICON.length}개`);

  if (!text.trim()) {
    console.log('입력값이 비어있습니다.');
    return [];
  }

  // 카테고리별 빈도수 계산 (categoryId -> count)
  const counts: Record<number, number> = {};

  EMOTION_LEXICON.forEach((item: LexiconItem) => {
    if (text.includes(item.phrase)) {
      console.log(`✨ 매칭 성공: [${item.phrase}] -> 카테고리 ${item.categoryId}`);
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    }
  });

  // 결과가 없으면 빈 배열 반환
  const categoryIds = Object.keys(counts).map(Number);
  if (categoryIds.length === 0) {
    console.log('3. 결과: 매칭된 감정 단어가 없습니다.');
    return [];
  }

  // 정렬 로직 적용
  // - 빈도수(counts) 내림차순
  // - 빈도수가 같으면 ID 오름차순
  const sortedIds = categoryIds.sort((a, b) => {
    if (counts[b] !== counts[a]) {
      return counts[b] - counts[a];
    }
    return a - b;
  });

  // 상위 최대 2개만 반환
  const result = sortedIds.slice(0, 2);
  console.log('4. 분석 최종 결과 (ID 리스트):', result);
  console.log('--- [분석기 종료] ---');
  
  return result;
};