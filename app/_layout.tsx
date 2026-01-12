import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { initDB } from '@/data/db';
import { View, Text } from 'react-native';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initDB();
        setReady(true);
      } catch (e) {
        console.error('DB init failed', e);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="editor" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="calendar" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}
