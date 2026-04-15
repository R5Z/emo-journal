import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* 탭 내비게이션 그룹을 메인으로 설정 */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* 에디터는 탭 바가 없는 전체 화면(또는 모달)으로 설정 */}
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