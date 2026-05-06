import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDateStore } from '../src/store/useDateStore';
import LockScreen from '../src/components/LockScreen';
import {
  saveBackgroundTime,
  shouldLock,
  hasPinSet,
} from '../src/lib/appLock';
import { STORAGE_KEYS } from '../src/constants/storageKeys';
import { useSettingsStore } from '../src/store/useSettingsStore';

export default function RootLayout() {
  const router = useRouter();
  const { setSelectedDate } = useDateStore();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // ── 잠금 상태 ──
  const [isLocked, setIsLocked] = useState(false);
  const [lockCheckDone, setLockCheckDone] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // ── 앱 시작 시 잠금 여부 판단 ──
  useEffect(() => {
    checkInitialLock();
    useSettingsStore.getState().loadSettings();
  }, []);

  const checkInitialLock = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings = raw ? JSON.parse(raw) : {};
      const lockEnabled = settings.appLock === true;
      const pinExists = await hasPinSet();

      if (lockEnabled && pinExists) {
        setIsLocked(true);
      }
    } catch (e) {
      console.error('Lock check failed:', e);
    }
    setLockCheckDone(true);
  };

  // ── AppState 변화 감지 (백그라운드 → 포그라운드) ──
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextState: AppStateStatus) => {
    if (
      appState.current === 'active' &&
      (nextState === 'background' || nextState === 'inactive')
    ) {
      // 백그라운드로 전환 → 시각 저장
      await saveBackgroundTime();
    }

    if (
      (appState.current === 'background' || appState.current === 'inactive') &&
      nextState === 'active'
    ) {
      // 포그라운드 복귀 → 잠금 여부 판단
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
        const settings = raw ? JSON.parse(raw) : {};
        const lockEnabled = settings.appLock === true;
        const autoLockMinutes = settings.autoLockMinutes ?? 1;

        if (lockEnabled) {
          const pinExists = await hasPinSet();
          if (pinExists) {
            const needLock = await shouldLock(autoLockMinutes);
            if (needLock) {
              setIsLocked(true);
            }
          }
        }
      } catch (e) {
        console.error('Lock check on resume failed:', e);
      }
    }

    appState.current = nextState;
  };

  // ── 알림 응답 처리 ──
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        setSelectedDate(`${y}-${m}-${d}`);
      }
    });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        setSelectedDate(`${y}-${m}-${d}`);
        router.push('/(tabs)');
      });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // ── 잠금 체크 완료 전에는 빈 화면 ──
  if (!lockCheckDone) {
    return null;
  }

  // ── 잠금 상태이면 Lock Screen 표시 ──
  if (isLocked) {
    return <LockScreen onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="editor" options={{ presentation: 'modal', headerShown: false}} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="faq" options={{ headerShown: false }} />
      <Stack.Screen name="feedback" options={{ headerShown: false }} />
      <Stack.Screen name="legal" options={{ headerShown: false }} />
      <Stack.Screen name="licenses" options={{ headerShown: false }} />
    </Stack>
  );
}
