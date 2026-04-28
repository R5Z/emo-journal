/**
 * AsyncStorage 키 상수
 * 모든 로컬 저장소 키를 한 곳에서 관리
 */
export const STORAGE_KEYS = {
  /** 앱 설정 (알림, 보안, 동기화 등) */
  SETTINGS: '@vhue_settings',

  /** 사용자 프로필 (닉네임, 아바타) */
  PROFILE: '@vhue_profile',

  /** PIN 해시 (SHA-256) */
  PIN_HASH: '@vhue_pin_hash',

  /** 백그라운드 전환 시각 (잠금 타이머용) */
  BACKGROUND_TIME: '@vhue_bg_time',
} as const;