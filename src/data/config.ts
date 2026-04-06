import { PipelineConfig } from '../types';

export const PIPELINE_CONFIG: PipelineConfig = {
  MIN_INTENSITY: 1,
  MAX_INTENSITY: 5,
  MODIFIER_SCAN_RANGE: 2,    // 키워드 앞 2어절
  NEGATION_SCAN_RANGE: 3,    // 키워드 앞뒤 3어절
  NEUTRAL_THRESHOLD: 0,      // 유효 매칭 1개 이하 → 중립
  MAX_GRADIENT_COLORS: 3,
  THIRD_COLOR_RATIO: 0.5,    // 3위 ≥ 1위 × 50%
  NEUTRAL_COLOR: '#E0E0E0',
};