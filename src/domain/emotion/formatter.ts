import { EMOTION_CATEGORIES } from '../../data/emotion-setup';
import { PIPELINE_CONFIG } from '../../data/config';
import { AnalysisResult, EmotionDisplay } from '../../types';

/**
 * 분석 결과를 UI 색상 객체로 변환
 *
 * - 중립: #E0E0E0 단색
 * - 1개 감정: 해당 색상 단색
 * - 2~3개 감정: 점수 비율 기반 그라데이션
 */
export const getEmotionDisplay = (result: AnalysisResult): EmotionDisplay => {
  const { NEUTRAL_COLOR } = PIPELINE_CONFIG;

  // 중립 상태
  if (result.isNeutral || result.topCategories.length === 0) {
    return {
      type: 'neutral',
      colors: [NEUTRAL_COLOR],
      stops: [1.0],
    };
  }

  // 카테고리 ID → colorHex 매핑
  const colorEntries = result.topCategories
    .map((cat) => ({
      color: EMOTION_CATEGORIES.find((c) => c.categoryId === cat.categoryId)?.colorHex,
      score: cat.totalScore,
    }))
    .filter((entry): entry is { color: string; score: number } => !!entry.color);

  if (colorEntries.length === 0) {
    return {
      type: 'neutral',
      colors: [NEUTRAL_COLOR],
      stops: [1.0],
    };
  }

  // 단색
  if (colorEntries.length === 1) {
    return {
      type: 'solid',
      colors: [colorEntries[0].color],
      stops: [1.0],
    };
  }

  // 2~3색 그라데이션: 점수 비율로 stops 계산
  const totalScore = colorEntries.reduce((sum, e) => sum + e.score, 0);
  const colors = colorEntries.map((e) => e.color);

  // 누적 stops 계산 (LinearGradient locations용)
  // 예: 점수 4:3:3 → 비율 0.4, 0.3, 0.3 → stops [0.4, 0.7, 1.0]
  let cumulative = 0;
  const stops = colorEntries.map((e) => {
    cumulative += e.score / totalScore;
    return Math.round(cumulative * 100) / 100;
  });

  return {
    type: 'gradient',
    colors,
    stops,
  };
};