import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, PanResponder, StyleSheet as RNStyleSheet
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { getEntriesByDate, getEntriesByRange, initDB } from '../../src/services/storage';
import { getEmotionDisplay } from '../../src/domain/emotion/formatter';
import EntryCard from '../../src/components/journal/EntryCard';
import { JournalEntry } from '../../src/types';

export default function HomeScreen() {
  const [isExpended, setIsExpended] = useState(false);   
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const isFocused = useIsFocused();

  const [selectedDate, setSelectedDate] = useState(
    (params.selectedDate as string) || dayjs().format('YYYY-MM-DD')
  );

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [emotionMap, setEmotionMap] = useState<Record<string, any>>({});

  // --- [오늘 정보 및 이동 함수] ---
  const todayNum = dayjs().format('D'); 
  
  const handleGoToToday = () => {
    setSelectedDate(dayjs().format('YYYY-MM-DD'));
  };

  // --- [날짜 계산 로직] ---
  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => 
    dayjs(selectedDate).startOf('week').add(i, 'day')
  ), [selectedDate]);

  const calendarGrid = useMemo(() => {
    const startDay = dayjs(selectedDate).startOf('month').startOf('week');
    const endDay = dayjs(selectedDate).endOf('month').endOf('week');
    const days = [];
    let curr = startDay;
    while (curr.isBefore(endDay)) {
      days.push(curr);
      curr = curr.add(1, 'day');
    }
    return days;
  }, [selectedDate]);

  // --- [데이터 로드] ---
  const loadData = useCallback(async () => {
    try {
      await initDB();

      const startDate = isExpended ? calendarGrid[0].format('YYYY-MM-DD') : weekDays[0].format('YYYY-MM-DD');
      const endDate = isExpended ? calendarGrid[calendarGrid.length - 1].format('YYYY-MM-DD') : weekDays[6].format('YYYY-MM-DD');
      
      const rangeEntries = await getEntriesByRange(startDate, endDate);

      const groupedIds: Record<string, number[]> = {};
      rangeEntries.forEach(entry => {
        const date = entry.createdAt.split(' ')[0];
        if (!groupedIds[date]) groupedIds[date] = [];
        groupedIds[date].push(...entry.emotionCategoryIds);
      });

      const newMap: Record<string, any> = {};
      Object.keys(groupedIds).forEach(date => {
        const ids = groupedIds[date];
        const counts: Record<number, number> = {};
        ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        const topIds = Object.keys(counts).map(Number).sort((a,b) => counts[b] - counts[a]).slice(0, 2);
        
        const display = getEmotionDisplay(topIds);
        newMap[date] = {
          colors: display.colors.length === 1 ? [display.colors[0], display.colors[0]] : display.colors,
          stops: display.colors.length === 1 ? [0, 1] : display.stops
        };
      });
      setEmotionMap(newMap);

      const data = await getEntriesByDate(selectedDate);
      setEntries(data);
    } catch (e) {
      console.error(e);
    }
  }, [selectedDate, isExpended, calendarGrid, weekDays]);

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused, loadData]);

  useEffect(() => {
    if (params.selectedDate) setSelectedDate(params.selectedDate as string);
  }, [params.selectedDate]);

  // --- [제스처 감지 통합] ---
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // 상하 또는 좌우 이동이 일정 수준 이상일 때 반응
      return Math.abs(gestureState.dy) > 20 || Math.abs(gestureState.dx) > 20;
    },
    onPanResponderRelease: (_, gestureState) => {
      const { dx, dy } = gestureState;

      // 1. 세로 이동량이 가로 이동량보다 많을 때 (상하 제스처)
      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy > 50) setIsExpended(true); // 아래로 쓸면 확장
        else if (dy < -50) setIsExpended(false); // 위로 쓸면 축소
      } 
      // 2. 가로 이동량이 세로 이동량보다 많을 때 (좌우 제스처)
      else {
        if (dx > 50) {
          // 오른쪽으로 쓸기 -> 이전 달로 이동
          setSelectedDate(dayjs(selectedDate).subtract(1, 'month').format('YYYY-MM-DD'));
        } else if (dx < -50) {
          // 왼쪽으로 쓸기 -> 다음 달로 이동
          setSelectedDate(dayjs(selectedDate).add(1, 'month').format('YYYY-MM-DD'));
        }
      }
    },
  }), [selectedDate, isExpended, calendarGrid, weekDays]); // 의존성 배열 유지

  const goToEditor = () => {
    router.push({ pathname: '/editor', params: { selectedDate } });
  };

  return (
    <View style={styles.container}>
      <View {...panResponder.panHandlers} style={styles.calendarHeader}>
        <View style={styles.dragHandle} />
        
        {/* 상단 월 표시 및 오늘 날짜 버튼 */}
        <View style={styles.monthHeaderRow}>
          <Text style={styles.monthLabel}>
            {dayjs(selectedDate).format('YYYY년 MM월')}
          </Text>
          <TouchableOpacity onPress={handleGoToToday} style={styles.todayButton}>
            <View style={styles.todayIcon}>
              <Text style={styles.todayIconText}>{todayNum}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {!isExpended ? (
          <View style={styles.weekBar}>
            {weekDays.map((day) => {
              const dateStr = day.format('YYYY-MM-DD');
              const isSelected = dateStr === selectedDate;
              const isFuture = day.isAfter(dayjs(), 'day');
              const emotion = emotionMap[dateStr];

              return (
                <TouchableOpacity 
                  key={dateStr} 
                  onPress={() => !isFuture && setSelectedDate(dateStr)}
                  disabled={isFuture}
                  style={[styles.dayWrapper, isFuture && { opacity: 0.2 }]}
                >
                  {emotion ? (
                    <LinearGradient colors={emotion.colors} locations={emotion.stops} style={[styles.dayItem, isSelected && styles.selectedDay]}>
                      <Text style={styles.dayText}>{day.format('ddd')}</Text>
                      <Text style={styles.dateText}>{day.format('D')}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.dayItem, isSelected && styles.selectedDayEmpty]}>
                      <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day.format('ddd')}</Text>
                      <Text style={[styles.dateText, isSelected && styles.selectedDayText]}>{day.format('D')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.monthContainer}>
            <View style={styles.monthGrid}>
              {calendarGrid.map((date, i) => {
                const dateStr = date.format('YYYY-MM-DD');
                const isSelected = dateStr === selectedDate;
                const isFuture = date.isAfter(dayjs(), 'day');
                const isCurrentMonth = date.isSame(dayjs(selectedDate), 'month');
                const emotion = emotionMap[dateStr];

                return (
                  <TouchableOpacity 
                    key={dateStr} 
                    onPress={() => !isFuture && setSelectedDate(dateStr)}
                    disabled={isFuture}
                    style={styles.gridCell}
                  >
                    <View style={[
                      styles.gridInner, 
                      isSelected && styles.gridSelected,
                      !isCurrentMonth && { opacity: 0.3 },
                      isFuture && { opacity: 0.1 }
                    ]}>
                      {emotion && (
                        <LinearGradient colors={emotion.colors} style={RNStyleSheet.absoluteFill} borderRadius={8} />
                      )}
                      <Text style={[styles.gridText, isSelected && { fontWeight: 'bold' }]}>{date.date()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.aiBubble}><Text style={styles.aiText}>{selectedDate === dayjs().format('YYYY-MM-DD') ? "오늘 무슨 일 있었어?\n네 마음이 궁금해." : "이날은 기록이 없네.\n어떤 하루였는지 들려줄래?"}</Text></View>
            <TouchableOpacity style={styles.inputGuide} onPress={goToEditor}><Text style={styles.guideText}>터치해서 일기 쓰기...</Text></TouchableOpacity>
          </View>
        ) : (
          entries.map(entry => <EntryCard key={entry.id} entry={entry} onRefresh={loadData} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  calendarHeader: { backgroundColor: '#fff', paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  dragHandle: { width: 40, height: 4, backgroundColor: '#E5E5EA', borderRadius: 2, alignSelf: 'center', marginVertical: 8 },
  
  monthHeaderRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 15 },
  monthLabel: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  
  // 오늘 버튼 스타일 (아이콘 형태)
  todayButton: { position: 'absolute', right: 20 },
  todayIcon: { 
    width: 30, 
    height: 30, 
    backgroundColor: '#007AFF', 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2 
  },
  todayIconText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  weekBar: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 15, paddingHorizontal: 10 },
  dayWrapper: { flex: 1, alignItems: 'center' },
  dayItem: { alignItems: 'center', padding: 8, borderRadius: 12, width: '90%' },
  selectedDay: { borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)', shadowOpacity: 0.1, elevation: 3 },
  selectedDayEmpty: { backgroundColor: '#007AFF', alignItems: 'center', padding: 8, borderRadius: 12, width: '90%' },
  dayText: { fontSize: 11, color: '#8E8E93' },
  dateText: { fontSize: 16, fontWeight: '600' },
  selectedDayText: { color: '#fff' },
  
  monthContainer: { paddingHorizontal: 15, paddingBottom: 15 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridCell: { width: `${100 / 7}%`, height: 45, padding: 2 },
  gridInner: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  gridSelected: { borderWidth: 2, borderColor: '#007AFF' },
  gridText: { fontSize: 14 },

  content: { padding: 20 },
  emptyContainer: { marginTop: 40, gap: 20 },
  aiBubble: { backgroundColor: '#F2F2F7', padding: 24, borderRadius: 24, alignSelf: 'flex-start' },
  aiText: { fontSize: 18, color: '#3A3A3C', lineHeight: 26 },
  inputGuide: { borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#D1D1D6', padding: 20, borderRadius: 20, alignItems: 'flex-end' },
  guideText: { color: '#8E8E93' }
});