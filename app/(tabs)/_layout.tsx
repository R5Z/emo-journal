import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useDateStore } from '../../src/store/useDateStore'; // 경로 확인 필수!

export default function TabLayout() {
  const router = useRouter();
  const { selectedDate } = useDateStore(); // 전역 날짜 구독

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F2F2F7',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '달력',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="write_dummy" // 실제 파일이 없어도 탭 공간 확보용
        options={{
          title: '',
          tabBarButton: () => (
            <View style={styles.centerButtonContainer}>
              <TouchableOpacity
                style={styles.centerButton}
                onPress={() => {
                  // 스토어에 저장된 날짜를 그대로 에디터에 넘김
                  router.push({
                    pathname: '/editor',
                    params: { selectedDate: selectedDate }
                  });
                }}
              >
                <Ionicons name="add" size={32} color="white" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'MY',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    top: Platform.OS === 'ios' ? -5 : 0, 
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
});