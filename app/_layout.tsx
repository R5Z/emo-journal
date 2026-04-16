import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useDateStore } from '../src/store/useDateStore';

export default function RootLayout() {
  const router = useRouter();
  const { setSelectedDate } = useDateStore();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // 앱 시작 시 (완전 종료 후 알림으로 진입) 마지막 응답 체크
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        setSelectedDate(`${y}-${m}-${d}`);
      }
    });

    // 앱이 실행 중일 때 알림 탭 처리
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        setSelectedDate(`${y}-${m}-${d}`);
        router.push('/(tabs)');
      },
    );

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="editor"
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}