import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { getEntriesByDate, initDB } from '../src/services/storage';
import { JournalEntry } from '../src/types';
import { getEmotionDisplay } from '../src/domain/emotion/formatter';
import EntryCard from '../src/components/journal/EntryCard';

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  // 선택된 날짜의 대표 색상 상태
  const [dayDisplay, setDayDisplay] = useState({ colors: ['#F2F2F7', '#F2F2F7'], stops: [0, 1] });
  
  const router = useRouter();
  const isFocused = useIsFocused();

  const weekDays = Array.from({ length: 7 }).map((_, i) => 
    dayjs().startOf('week').add(i, 'day')
  );

  const loadData = useCallback(async () => {
    try {
      await initDB();
      const data = await getEntriesByDate(selectedDate);
      setEntries(data);

      // --- [데이터 합산 로직] ---
      // 1. 해당 날짜 모든 일기의 감정 ID를 하나의 배열로 합침
      const allIds = data.flatMap(entry => entry.emotionCategoryIds);
      
      // 2. 빈도수 계산 (Counter)
      const counts: Record<number, number> = {};
      allIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
      
      // 3. 빈도순 정렬 후 상위 2개 추출
      const topIds = Object.keys(counts)
        .map(Number)
        .sort((a, b) => counts[b] - counts[a])
        .slice(0, 2);

      // 4. 대표 색상 및 그라데이션 위치 설정
      const display = getEmotionDisplay(topIds);
      setDayDisplay({
        colors: display.colors.length === 1 ? [display.colors[0], display.colors[0]] : display.colors,
        stops: display.colors.length === 1 ? [0, 1] : display.stops
      });
    } catch (e) {
      console.error(e);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  return (
    <View style={styles.container}>
      {/* --- 상단 주간 날짜 바 --- */}
      <View style={styles.weekBar}>
        {weekDays.map((day) => {
          const dateStr = day.format('YYYY-MM-DD');
          const isSelected = dateStr === selectedDate;
          
          return (
            <TouchableOpacity 
              key={dateStr} 
              onPress={() => setSelectedDate(dateStr)}
              style={styles.dayWrapper}
            >
              {isSelected ? (
                <LinearGradient
                  colors={dayDisplay.colors as [string, string, ...string[]]}
                  locations={dayDisplay.stops as number[]}
                  style={styles.selectedDay}
                >
                  <Text style={styles.selectedDayText}>{day.format('ddd')}</Text>
                  <Text style={styles.selectedDateText}>{day.format('D')}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.dayItem}>
                  <Text style={styles.dayText}>{day.format('ddd')}</Text>
                  <Text style={styles.dateText}>{day.format('D')}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* --- 일기 리스트 영역 --- */}
      <ScrollView contentContainerStyle={styles.content}>
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.aiBubble}>
              <Text style={styles.aiText}>
                {selectedDate === dayjs().format('YYYY-MM-DD') 
                  ? "오늘 무슨 일 있었어?\n네 마음이 궁금해." 
                  : "이날은 기록이 없네.\n어떤 하루였는지 들려줄래?"}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.inputGuide}
              onPress={() => router.push('/editor')}
            >
              <Text style={styles.guideText}>터치해서 일기 쓰기...</Text>
            </TouchableOpacity>
          </View>
        ) : (
          entries.map(entry => <EntryCard key={entry.id} entry={entry} onRefresh={loadData} />)
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/editor')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  weekBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 10,
    borderBottomWidth: 1, 
    borderBottomColor: '#F2F2F7' 
  },
  dayWrapper: { flex: 1, alignItems: 'center' },
  dayItem: { alignItems: 'center', padding: 8 },
  selectedDay: { 
    alignItems: 'center', 
    padding: 8, 
    borderRadius: 12, 
    width: '90%',
    // 선택된 날짜 가시성 확보
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayText: { fontSize: 11, color: '#8E8E93', marginBottom: 4 },
  dateText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  selectedDayText: { fontSize: 11, color: 'rgba(0,0,0,0.6)', marginBottom: 4, fontWeight: '700' },
  selectedDateText: { fontSize: 17, fontWeight: '800', color: '#000' },
  content: { padding: 20 },
  emptyContainer: { marginTop: 40, gap: 20 },
  aiBubble: { backgroundColor: '#F2F2F7', padding: 24, borderRadius: 24, borderBottomLeftRadius: 0, alignSelf: 'flex-start', maxWidth: '85%' },
  aiText: { fontSize: 18, color: '#3A3A3C', lineHeight: 26, fontWeight: '500' },
  inputGuide: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#D1D1D6', padding: 20, borderRadius: 20, alignItems: 'flex-end', marginTop: 10 },
  guideText: { color: '#8E8E93', fontSize: 15 },
  fab: { position: 'absolute', bottom: 30, right: 25, width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabText: { fontSize: 32, color: '#fff', fontWeight: '300' }
});