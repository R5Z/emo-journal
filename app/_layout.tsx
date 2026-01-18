import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDB } from '../src/services/storage';

export default function RootLayout() {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: 'bold' },
        // OS 제공 뒤로가기 버튼을 활성화
        headerBackTitle: '뒤로', 
      }}
    >
      {/* index는 메인이므로 헤더를 숨기거나 타이틀 설정 */}
      <Stack.Screen name="index" options={{ title: '내 저널', headerShown: false }} />
      {/* editor는 모달 형태? */}
      <Stack.Screen name="editor" options={{ title: '일기 쓰기', presentation: 'modal' }} />
    </Stack>
  );
}