import { EMOTION_CATEGORIES } from '../../data/emotion-setup';
import { EmotionDisplay } from '../../types';

/**
 * 감정 ID 리스트를 받아 UI에서 사용할 색상 객체를 반환
 * 규칙:
 * - 1개일 때: 단색(Solid)
 * - 2개일 때: 6:4 비율의 그라데이션
 */
export const getEmotionDisplay = (categoryIds: number[]): EmotionDisplay => {
  // 각 ID에 해당하는 colorHex 찾기
  const colors = categoryIds
    .map(id => EMOTION_CATEGORIES.find(c => c.categoryId === id)?.colorHex)
    .filter((color): color is string => !!color);

  // 데이터가 없을 경우 기본 회색 반환
  if (colors.length === 0) {
    return { type: 'solid', colors: ['#EEEEEE'], stops: [1.0] };
  }

  // 2개일 경우 그라데이션 (주 감정 0.6, 부 감정 1.0)
  if (colors.length === 2) {
    return {
      type: 'gradient',
      colors: colors, // [첫 번째 색, 두 번째 색]
      stops: [0.6, 1.0] 
    };
  }

  // 1개일 경우 단색
  return {
    type: 'solid',
    colors: [colors[0]],
    stops: [1.0]
  };
};