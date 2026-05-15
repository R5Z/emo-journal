/**
 * 테마 컬러 토큰
 * 감정 컬러는 라이트/다크 동일하게 유지
 */

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  // 배경
  background: string;
  backgroundSecondary: string;
  backgroundCard: string;

  // 텍스트
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // UI 요소
  separator: string;
  border: string;
  icon: string;

  // 인터랙티브
  tint: string;
  tintBackground: string;

  // 상태
  danger: string;

  // 컴포넌트
  inputBackground: string;
  tabBarBackground: string;
  tabBarBorder: string;
  headerBackground: string;

  // 감정 대시보드
  dotInactive: string;
  barTrack: string;
  insightBackground: string;

  // 스트릭 카드
  streakCardBackground: string;

  // 설정 그룹
  settingsGroupBackground: string;
  settingsSectionLabel: string;

  // 모달
  modalOverlay: string;
  modalBackground: string;

  // 버튼
  buttonDisabled: string;
  editButtonBackground: string;
}

export const LightTheme: ThemeColors = {
  background: '#F2F2F7',
  backgroundSecondary: '#fff',
  backgroundCard: '#fff',

  textPrimary: '#000',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',

  separator: '#C6C6C8',
  border: '#E5E5EA',
  icon: '#3C3C43',

  tint: '#007AFF',
  tintBackground: '#E5F0FF',

  danger: '#FF3B30',

  inputBackground: '#F2F2F7',
  tabBarBackground: 'rgba(249,249,249,0.94)',
  tabBarBorder: '#C6C6C8',
  headerBackground: '#F2F2F7',

  dotInactive: '#E5E5EA',
  barTrack: '#F2F2F7',
  insightBackground: '#F2F2F7',

  streakCardBackground: '#fff',

  settingsGroupBackground: '#fff',
  settingsSectionLabel: '#6C6C70',

  modalOverlay: 'rgba(0,0,0,0.4)',
  modalBackground: '#fff',

  buttonDisabled: '#B0D4FF',
  editButtonBackground: '#F2F2F7',
};

export const DarkTheme: ThemeColors = {
  background: '#000',
  backgroundSecondary: '#1C1C1E',
  backgroundCard: '#1C1C1E',

  textPrimary: '#fff',
  textSecondary: '#EBEBF5',
  textTertiary: '#8E8E93',

  separator: '#38383A',
  border: '#38383A',
  icon: '#EBEBF5',

  tint: '#0A84FF',
  tintBackground: '#1C3A5F',

  danger: '#FF453A',

  inputBackground: '#2C2C2E',
  tabBarBackground: 'rgba(28,28,30,0.94)',
  tabBarBorder: '#38383A',
  headerBackground: '#000',

  dotInactive: '#38383A',
  barTrack: '#2C2C2E',
  insightBackground: '#2C2C2E',

  streakCardBackground: '#1C1C1E',

  settingsGroupBackground: '#1C1C1E',
  settingsSectionLabel: '#8E8E93',

  modalOverlay: 'rgba(0,0,0,0.6)',
  modalBackground: '#2C2C2E',

  buttonDisabled: '#1C3A5F',
  editButtonBackground: '#2C2C2E',
};