// --- 감정 카테고리 ---

export interface EmotionCategory {
  categoryId: number;
  name: string;
  role: 'core' | 'reactive';
  colorHex: string;
  /** 플루칙 감정축 - 같은 축 카테고리끼리 합산할 때 사용 (Stage2) */
  axis?: string;
}

// --- 감정 사전 ---

export type MatchType = 'contains' | 'phrase' | 'exact' | 'startsWith';
export type NlpTag = 'polysemous' | 'false_positive_risk' | 'needs_review' | null;

export interface LexiconItem {
  categoryId: number;
  phrase: string;
  /** 기본 강도 1~5 */
  intensity: number;
  matchType: MatchType;
  /** NLP 관련 태그 - MVP에서는 참고용, Stage2에서 분기 처리 */
  nlpTag?: NlpTag;
}

// --- 수식어 ---

export type ModifierType = 'amplifier' | 'dampener';

export interface Modifier {
  word: string;
  type: ModifierType;
  /** +1 또는 -1 */
  delta: number;
}

// --- 부정어 ---

export interface Negation {
  word: string;
  /** 키워드 기준 스캔 방향과 범위 */
  scanDirection: 'before' | 'after' | 'both';
  scanRange: number;
}

// --- 분석 파이프라인 중간 결과 ---

/** STEP 1: 키워드 매칭 원본 */
export interface RawMatch {
  phrase: string;
  categoryId: number;
  baseIntensity: number;
  matchType: MatchType;
  /** 텍스트 내 매칭 시작 위치 (인덱스) */
  position: number;
}

/** STEP 2~3: 필터링 및 보정 완료 */
export interface ProcessedMatch extends RawMatch {
  negated: boolean;
  /** 수식어 보정 후 최종 강도 (1~5 클램핑) */
  finalIntensity: number;
}

/** STEP 4: 카테고리별 합산 점수 */
export interface CategoryScore {
  categoryId: number;
  totalScore: number;
  matchCount: number;
}

// --- 최종 분석 결과 (analyzer → formatter) ---

export interface AnalysisResult {
  /** 점수 내림차순 상위 카테고리 (최대 3개) */
  topCategories: CategoryScore[];
  /** 중립 상태 여부 (유효 매칭 키워드 1개 이하) */
  isNeutral: boolean;
  /** 전체 매칭 로그 (디버그용) */
  allMatches?: ProcessedMatch[];
}

// --- 색상 표시 ---

export interface EmotionDisplay {
  type: 'solid' | 'gradient' | 'neutral';
  colors: string[];
  /** 점수 비율 기반 정규화된 stops (합계 1.0) */
  stops: number[];
}

// --- 저널 엔트리 ---

export interface JournalEntry {
  id?: number;
  content: string;
  /** 분석 결과 (최대 3개 카테고리 + 중립 여부) */
  emotionResult: Pick<AnalysisResult, 'topCategories' | 'isNeutral'>;
  createdAt: string;
}

// --- 파이프라인 설정 ---

export interface PipelineConfig {
  MIN_INTENSITY: number;
  MAX_INTENSITY: number;
  MODIFIER_SCAN_RANGE: number;
  NEGATION_SCAN_RANGE: number;
  NEUTRAL_THRESHOLD: number;
  MAX_GRADIENT_COLORS: number;
  THIRD_COLOR_RATIO: number;
  NEUTRAL_COLOR: string;
}

// --- 앱 설정 ---

export type FontSize = 'small' | 'medium' | 'large';
export type WeekStart = 'sunday' | 'monday';

export interface Settings {
  remindOn: boolean;
  remindHour: number;
  remindMinute: number;
  remindMessage: string;
  weeklyReport: boolean;
  streakAlert: boolean;
  appLock: boolean;
  autoLockMinutes: number;
  encryption: boolean;
  sync: boolean;
  fontSize: FontSize;
  weekStart: WeekStart;
}

export const DEFAULT_SETTINGS: Settings = {
  remindOn: true,
  remindHour: 21,
  remindMinute: 0,
  remindMessage: '오늘 하루는 어땠어?',
  weeklyReport: true,
  streakAlert: false,
  appLock: false,
  autoLockMinutes: 1,
  encryption: true,
  sync: false,
  fontSize: 'medium',
  weekStart: 'monday',
};

// --- 프로필 ---

export interface Profile {
  nickname: string;
  avatarType: 'emoji' | 'image';
  avatarEmoji: string;
  avatarImageUri: string | null;
}

export const DEFAULT_PROFILE: Profile = {
  nickname: '뷰러',
  avatarType: 'emoji',
  avatarEmoji: '🌈',
  avatarImageUri: null,
};

// --- 감정 맵 (달력용) ---

export interface EmotionMap {
  colors: string[];
  stops: number[];
}