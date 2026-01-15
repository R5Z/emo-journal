// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { getAllEntries, initDB } from '../src/services/storage';
import { JournalEntry } from '../src/types';
import DebugTable from '../src/components/common/DebugTable';

export default function HomeScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const router = useRouter();
  const isFocused = useIsFocused();

  const fetchData = async () => {
    try {
      await initDB();
      const data = await getAllEntries();
      setEntries(data);
    } catch (e) {
      console.error("데이터 로드 실패", e);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      {/* --- 상단 헤더 영역 (손그림 3번의 상단 바 느낌) --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 마음 타임라인</Text>
        <TouchableOpacity 
          onPress={() => router.push('/editor')} 
          style={styles.writeButton}
        >
          <Text style={styles.writeButtonText}>+ 쓰기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 데이터가 없을 때의 화면 (손그림 1번) */}
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.aiBubble}>
              <Text>오늘 무슨 일 있었어?</Text>
            </View>
            <TouchableOpacity 
              style={styles.userBubble}
              onPress={() => router.push('/editor')}
            >
              <Text style={{ color: '#ccc' }}>터치해서 일기 쓰기...</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ marginBottom: 10, color: '#666' }}>최근 작성된 일기 {entries.length}개</Text>
        )}
        
        {/* 디버그용 테이블 (데이터 확인용) */}
        <DebugTable data={entries} />
      </ScrollView>

      {/* 달력으로 가기 위한 버튼 (테스트용) */}
      <TouchableOpacity 
        style={styles.calendarFab}
        onPress={() => router.push('/calendar')}
      >
        <Text style={{ color: '#fff' }}>📅 달력</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  writeButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  writeButtonText: { color: '#fff', fontWeight: 'bold' },
  content: { padding: 20 },
  emptyContainer: { marginTop: 50, gap: 20 },
  aiBubble: { backgroundColor: '#f0f0f0', padding: 20, borderRadius: 20, alignSelf: 'flex-start', borderBottomLeftRadius: 0 },
  userBubble: { backgroundColor: '#fff', padding: 20, borderRadius: 20, alignSelf: 'flex-end', borderBottomRightRadius: 0, borderWidth: 1, borderColor: '#eee', width: '80%' },
  calendarFab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#333', padding: 15, borderRadius: 30, elevation: 5 }
});