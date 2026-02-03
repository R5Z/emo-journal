import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70, // 하단 바 높이 확보
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
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

      {/* 중앙 + 버튼: 화면은 없지만 탭 자리를 차지함 */}
      <Tabs.Screen
        name="write_dummy"
        options={{
          title: '',
          tabBarButton: () => (
            <View style={styles.centerButtonContainer}>
              <TouchableOpacity
                style={styles.centerButton}
                onPress={() => router.push('/editor')}
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
    top: -10, // 탭 바 위로 살짝 띄움
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});