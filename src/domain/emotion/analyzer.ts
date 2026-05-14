import { EMOTION_LEXICON } from '../../data/lexicon';
import { MODIFIERS } from '../../data/modifiers';
import { NEGATIONS } from '../../data/negations';
import { PIPELINE_CONFIG } from '../../data/config';
import {
  LexiconItem,
  RawMatch,
  ProcessedMatch,
  CategoryScore,
  AnalysisResult,
} from '../../types';

// ============================================
// 유틸: 텍스트를 어절(공백 구분) 배열로 분리
// ============================================
const tokenize = (text: string): string[] => text.split(/\s+/).filter(Boolean);

// ============================================
// 유틸: 매칭 위치 주변 N어절 텍스트 추출
// ============================================
const getSurroundingText = (
  text: string,
  position: number,
  phraseLength: number,
  direction: 'before' | 'after' | 'both',
  rangeInWords: number,
): string => {
  const before = text.slice(0, position);
  const after = text.slice(position + phraseLength);

  const wordsBefore = tokenize(before).slice(-rangeInWords).join(' ');
  const wordsAfter = tokenize(after).slice(0, rangeInWords).join(' ');

  if (direction === 'before') return wordsBefore;
  if (direction === 'after') return wordsAfter;
  return `${wordsBefore} ${wordsAfter}`;
};

// ============================================
// STEP 1: 키워드 매칭
// ============================================
const matchKeywords = (text: string): RawMatch[] => {
  const matches: RawMatch[] = [];
  const tokens = tokenize(text);

  EMOTION_LEXICON.forEach((item: LexiconItem) => {
    switch (item.matchType) {
      case 'contains':
      case 'phrase': {
        let searchFrom = 0;
        while (true) {
          const idx = text.indexOf(item.phrase, searchFrom);
          if (idx === -1) break;
          matches.push({
            phrase: item.phrase,
            categoryId: item.categoryId,
            baseIntensity: item.intensity,
            matchType: item.matchType,
            position: idx,
          });
          searchFrom = idx + item.phrase.length;
        }
        break;
      }

      case 'exact': {
        tokens.forEach((token) => {
          if (token === item.phrase) {
            const position = text.indexOf(token);
            matches.push({
              phrase: item.phrase,
              categoryId: item.categoryId,
              baseIntensity: item.intensity,
              matchType: item.matchType,
              position: position >= 0 ? position : 0,
            });
          }
        });
        break;
      }

      case 'startsWith': {
        tokens.forEach((token) => {
          if (token.startsWith(item.phrase)) {
            const position = text.indexOf(token);
            matches.push({
              phrase: item.phrase,
              categoryId: item.categoryId,
              baseIntensity: item.intensity,
              matchType: item.matchType,
              position: position >= 0 ? position : 0,
            });
          }
        });
        break;
      }
    }
  });

  return matches;
};

// ============================================
// STEP 1.5: phrase 우선순위 처리
// 같은 텍스트 영역에서 phrase와 contains가 겹치면
// phrase가 우선하고 contains를 무효화
// ============================================
const applyPhrasePriority = (matches: RawMatch[]): RawMatch[] => {
  const phraseRanges = matches
    .filter((m) => m.matchType === 'phrase')
    .map((m) => ({
      start: m.position,
      end: m.position + m.phrase.length,
    }));

  if (phraseRanges.length === 0) return matches;

  return matches.filter((m) => {
    if (m.matchType === 'phrase' || m.matchType === 'exact' || m.matchType === 'startsWith') {
      return true;
    }
    // contains 매칭이 phrase 범위 안에 포함되는지 확인
    const matchEnd = m.position + m.phrase.length;
    const overlaps = phraseRanges.some(
      (range) => m.position >= range.start && matchEnd <= range.end,
    );
    return !overlaps;
  });
};

// ============================================
// STEP 2: 부정 표현 필터
// ============================================
const applyNegationFilter = (
  text: string,
  matches: RawMatch[],
): ProcessedMatch[] => {
  return matches.map((match) => {
    let negated = false;

    for (const neg of NEGATIONS) {
      const surrounding = getSurroundingText(
        text,
        match.position,
        match.phrase.length,
        neg.scanDirection,
        neg.scanRange,
      );

      if (surrounding.includes(neg.word)) {
        negated = true;
        break;
      }
    }

    return {
      ...match,
      negated,
      finalIntensity: match.baseIntensity,
    };
  });
};

// ============================================
// STEP 3: 수식어 강도 보정
// ============================================
const applyModifierAdjustment = (
  text: string,
  matches: ProcessedMatch[],
): ProcessedMatch[] => {
  const { MIN_INTENSITY, MAX_INTENSITY, MODIFIER_SCAN_RANGE } = PIPELINE_CONFIG;

  return matches.map((match) => {
    if (match.negated) return match;

    const beforeText = getSurroundingText(
      text,
      match.position,
      match.phrase.length,
      'before',
      MODIFIER_SCAN_RANGE,
    );

    let delta = 0;
    for (const mod of MODIFIERS) {
      if (beforeText.includes(mod.word)) {
        delta = mod.delta;
        break; // 첫 번째 수식어만 적용
      }
    }

    const adjusted = Math.max(
      MIN_INTENSITY,
      Math.min(MAX_INTENSITY, match.baseIntensity + delta),
    );

    return { ...match, finalIntensity: adjusted };
  });
};

// ============================================
// STEP 4: 카테고리별 점수 합산
// ============================================
const aggregateScores = (matches: ProcessedMatch[]): CategoryScore[] => {
  const scoreMap: Record<number, { total: number; count: number }> = {};

  matches.forEach((match) => {
    if (match.negated) return;

    if (!scoreMap[match.categoryId]) {
      scoreMap[match.categoryId] = { total: 0, count: 0 };
    }
    scoreMap[match.categoryId].total += match.finalIntensity;
    scoreMap[match.categoryId].count += 1;
  });

  return Object.entries(scoreMap)
    .map(([id, { total, count }]) => ({
      categoryId: Number(id),
      totalScore: total,
      matchCount: count,
    }))
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.categoryId - b.categoryId;
    });
};

// ============================================
// STEP 5: 상위 카테고리 선택 (동적 1~3개)
// ============================================
const selectTopCategories = (scores: CategoryScore[]): CategoryScore[] => {
  const { MAX_GRADIENT_COLORS, THIRD_COLOR_RATIO } = PIPELINE_CONFIG;

  if (scores.length === 0) return [];
  if (scores.length === 1) return [scores[0]];

  const top2 = scores.slice(0, 2);

  // 3위가 존재하고, 1위 점수의 THIRD_COLOR_RATIO 이상이면 포함
  if (
    scores.length >= 3 &&
    MAX_GRADIENT_COLORS >= 3 &&
    scores[2].totalScore >= scores[0].totalScore * THIRD_COLOR_RATIO
  ) {
    return scores.slice(0, 3);
  }

  return top2;
};

// ============================================
// 메인 분석 함수
// ============================================
export const analyzeEmotion = (text: string): AnalysisResult => {
  const { NEUTRAL_THRESHOLD } = PIPELINE_CONFIG;

  if (!text.trim()) {
    return { topCategories: [], isNeutral: true };
  }

  if (!EMOTION_LEXICON || EMOTION_LEXICON.length === 0) {
    console.error('EMOTION_LEXICON이 비어있습니다.');
    return { topCategories: [], isNeutral: true };
  }

  // STEP 1: 키워드 매칭
  const rawMatches = matchKeywords(text);

  // STEP 1.5: phrase 우선순위
  const prioritized = applyPhrasePriority(rawMatches);

  // STEP 2: 부정 필터
  const negationFiltered = applyNegationFilter(text, prioritized);

  // STEP 3: 수식어 보정
  const modifierAdjusted = applyModifierAdjustment(text, negationFiltered);

  // 유효 매칭 수 (부정되지 않은 것만)
  const validMatches = modifierAdjusted.filter((m) => !m.negated);
  const isNeutral = validMatches.length <= NEUTRAL_THRESHOLD;

  // STEP 4: 합산
  const scores = aggregateScores(modifierAdjusted);

  // STEP 5: 상위 선택
  const topCategories = selectTopCategories(scores);

  return {
    topCategories,
    isNeutral,
    allMatches: __DEV__ ? modifierAdjusted : undefined,
  };
};
