export interface EmotionCategory {
  categoryId: number;
  name: string;
  role: 'core' | 'reactive';
  colorHex: string;
}

export interface LexiconItem {
  categoryId: number;
  phrase: string;
  matchType: 'contains' | 'exact';
}

// 분석된 결과물(색상 정보)을 담는 타입
export interface EmotionDisplay {
  type: 'solid' | 'gradient';
  colors: string[]; // 단색일 경우 원소 1개, 그라데이션일 경우 2개
  stops: number[]; // 그라데이션 비율
}

export interface JournalEntry {
  id?: number;
  content: string;
  // 분석 결과로 최대 2개의 카테고리 ID를 저장
  emotionCategoryIds: number[]; 
  createdAt: string; // ISO 8601 string (e.g., "2024-05-20T14:30:00Z")
}