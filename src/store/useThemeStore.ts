import { create } from 'zustand';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeMode,
  ThemeColors,
  LightTheme,
  DarkTheme,
} from '../constants/theme';

// ============================================
// Store
// ============================================

const THEME_KEY = '@vhue_theme_mode';

type ThemeState = {
  mode: ThemeMode;
  loaded: boolean;
  setMode: (mode: ThemeMode) => void;
  loadTheme: () => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  loaded: false,

  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(THEME_KEY, mode).catch(console.error);
  },

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved && ['system', 'light', 'dark'].includes(saved)) {
        set({ mode: saved as ThemeMode, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
}));

// ============================================
// Hook
// ============================================

/**
 * 현재 테마 컬러를 반환하는 훅
 * mode가 'system'이면 OS 설정을 따름
 */
export function useTheme(): {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
} {
  const { mode } = useThemeStore();
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  return {
    colors: isDark ? DarkTheme : LightTheme,
    isDark,
    mode,
  };
}