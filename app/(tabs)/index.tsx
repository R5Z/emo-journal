import { useIsFocused } from "@react-navigation/native";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  PanResponder,
  StyleSheet as RNStyleSheet,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import EntryCard from "../../src/components/EntryCard";
import { getEmotionDisplay } from "../../src/domain/emotion/formatter";
import {
  getEntriesByDate,
  getEntriesByRange,
  initDB,
} from "../../src/lib/storage";
import { useDateStore } from "../../src/store/useDateStore";
import { JournalEntry } from "../../src/types";

export default function HomeScreen() {
  const [isExpended, setIsExpended] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();

  // [Zustand] 로컬 상태 대신 전역 상태 사용
  const { selectedDate, setSelectedDate } = useDateStore();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [emotionMap, setEmotionMap] = useState<Record<string, any>>({});

  const todayNum = dayjs().format("D");

  const handleGoToToday = () => {
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
  };

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) =>
        dayjs(selectedDate).startOf("week").add(i, "day"),
      ),
    [selectedDate],
  );

  const calendarGrid = useMemo(() => {
    const startDay = dayjs(selectedDate).startOf("month").startOf("week");
    const endDay = dayjs(selectedDate).endOf("month").endOf("week");
    const days = [];
    let curr = startDay;
    while (curr.isBefore(endDay)) {
      days.push(curr);
      curr = curr.add(1, "day");
    }
    return days;
  }, [selectedDate]);

  const loadData = useCallback(async () => {
    try {
      await initDB();
      const startDate = isExpended
        ? calendarGrid[0].format("YYYY-MM-DD")
        : weekDays[0].format("YYYY-MM-DD");
      const endDate = isExpended
        ? calendarGrid[calendarGrid.length - 1].format("YYYY-MM-DD")
        : weekDays[6].format("YYYY-MM-DD");

      const rangeEntries = await getEntriesByRange(startDate, endDate);

      // 날짜별 감정 점수 집계
      // 같은 날에 여러 일기가 있으면 카테고리별 점수를 합산
      const groupedScores: Record<
        string,
        Record<number, { total: number; count: number }>
      > = {};

      rangeEntries.forEach((entry) => {
        const date = entry.createdAt.split(" ")[0];
        if (!groupedScores[date]) groupedScores[date] = {};

        entry.emotionResult.topCategories.forEach((cat) => {
          if (!groupedScores[date][cat.categoryId]) {
            groupedScores[date][cat.categoryId] = { total: 0, count: 0 };
          }
          groupedScores[date][cat.categoryId].total += cat.totalScore;
          groupedScores[date][cat.categoryId].count += cat.matchCount;
        });
      });

      // 날짜별 AnalysisResult를 구성하여 formatter에 전달
      const newMap: Record<string, any> = {};

      Object.keys(groupedScores).forEach((date) => {
        const scoreEntries = Object.entries(groupedScores[date])
          .map(([id, { total, count }]) => ({
            categoryId: Number(id),
            totalScore: total,
            matchCount: count,
          }))
          .sort((a, b) => b.totalScore - a.totalScore);

        const display = getEmotionDisplay({
          topCategories: scoreEntries.slice(0, 3),
          isNeutral: scoreEntries.length === 0,
        });

        newMap[date] = {
          colors:
            display.colors.length === 1
              ? [display.colors[0], display.colors[0]]
              : display.colors,
          stops: display.colors.length === 1 ? [0, 1] : display.stops,
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

  // 외부 파라미터 유입 시 동기화
  useEffect(() => {
    if (params.selectedDate) setSelectedDate(params.selectedDate as string);
  }, [params.selectedDate]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 20,
        onPanResponderRelease: (_, gestureState) => {
          const { dy } = gestureState;
          if (!isExpended) {
            if (dy > 50) setIsExpended(true);
          } else {
            if (dy > 70)
              setSelectedDate(
                dayjs(selectedDate)
                  .subtract(1, "month")
                  .startOf("month")
                  .format("YYYY-MM-DD"),
              );
            else if (dy < -70)
              setSelectedDate(
                dayjs(selectedDate)
                  .add(1, "month")
                  .startOf("month")
                  .format("YYYY-MM-DD"),
              );
            else if (dy < -20 && dy > -70) setIsExpended(false);
          }
        },
      }),
    [selectedDate, isExpended],
  );

  const goToEditor = () => {
    router.push({ pathname: "/editor", params: { selectedDate } });
  };

  return (
    <View style={styles.container}>
      <View {...panResponder.panHandlers} style={styles.calendarHeader}>
        <View style={styles.dragHandle} />
        <View style={styles.monthHeaderRow}>
          <Text style={styles.monthLabel}>
            {dayjs(selectedDate).format("YYYY년 MM월")}
          </Text>
          <TouchableOpacity
            onPress={handleGoToToday}
            style={styles.todayButton}
          >
            <View style={styles.todayIcon}>
              <Text style={styles.todayIconText}>{todayNum}</Text>
            </View>
          </TouchableOpacity>
        </View>
        {!isExpended ? (
          <View style={styles.weekBar}>
            {weekDays.map((day) => {
              const dateStr = day.format("YYYY-MM-DD");
              const isSelected = dateStr === selectedDate;
              const isFuture = day.isAfter(dayjs(), "day");
              const emotion = emotionMap[dateStr];
              return (
                <TouchableOpacity
                  key={dateStr}
                  onPress={() => !isFuture && setSelectedDate(dateStr)}
                  disabled={isFuture}
                  style={[styles.dayWrapper, isFuture && { opacity: 0.2 }]}
                >
                  {emotion ? (
                    <LinearGradient
                      colors={emotion.colors}
                      locations={emotion.stops}
                      style={[styles.dayItem, isSelected && styles.selectedDay]}
                    >
                      <Text style={styles.dayText}>{day.format("ddd")}</Text>
                      <Text style={styles.dateText}>{day.format("D")}</Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.dayItem,
                        isSelected && styles.selectedDayEmpty,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedDayText,
                        ]}
                      >
                        {day.format("ddd")}
                      </Text>
                      <Text
                        style={[
                          styles.dateText,
                          isSelected && styles.selectedDayText,
                        ]}
                      >
                        {day.format("D")}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.monthContainer}>
            <View style={styles.weekdayHeader}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <Text key={d} style={styles.weekdayLabel}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.monthGrid}>
              {calendarGrid.map((date) => {
                const dateStr = date.format("YYYY-MM-DD");
                const isSelected = dateStr === selectedDate;
                const isFuture = date.isAfter(dayjs(), "day");
                const isCurrentMonth = date.isSame(
                  dayjs(selectedDate),
                  "month",
                );
                const emotion = emotionMap[dateStr];
                return (
                  <TouchableOpacity
                    key={dateStr}
                    onPress={() => !isFuture && setSelectedDate(dateStr)}
                    disabled={isFuture}
                    style={styles.gridCell}
                  >
                    <View
                      style={[
                        styles.gridInner,
                        isSelected && styles.gridSelected,
                        !isCurrentMonth && { opacity: 0.3 },
                        isFuture && { opacity: 0.1 },
                      ]}
                    >
                      {emotion && (
                        <LinearGradient
                          colors={emotion.colors}
                          style={RNStyleSheet.absoluteFill}
                          borderRadius={8}
                        />
                      )}
                      <Text
                        style={[
                          styles.gridText,
                          isSelected && { fontWeight: "bold" },
                        ]}
                      >
                        {date.date()}
                      </Text>
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
            <View style={styles.aiBubble}>
              <Text style={styles.aiText}>
                {selectedDate === dayjs().format("YYYY-MM-DD")
                  ? "오늘 무슨 일 있었어?\n네 마음이 궁금해."
                  : "이날은 기록이 없네.\n어떤 하루였는지 들려줄래?"}
              </Text>
            </View>
            <TouchableOpacity style={styles.inputGuide} onPress={goToEditor}>
              <Text style={styles.guideText}>터치해서 기록하기...</Text>
            </TouchableOpacity>
          </View>
        ) : (
          entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onRefresh={loadData} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  calendarHeader: {
    backgroundColor: "#fff",
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E5EA",
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 8,
  },
  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 15,
  },
  monthLabel: { fontSize: 18, fontWeight: "700", color: "#1C1C1E" },
  todayButton: { position: "absolute", right: 20 },
  todayIcon: {
    width: 30,
    height: 30,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  todayIconText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  weekBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 15,
    paddingHorizontal: 10,
  },
  dayWrapper: { flex: 1, alignItems: "center" },
  dayItem: { alignItems: "center", padding: 8, borderRadius: 12, width: "90%" },
  selectedDay: {
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
    shadowOpacity: 0.1,
    elevation: 3,
  },
  selectedDayEmpty: {
    backgroundColor: "#007AFF",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    width: "90%",
  },
  dayText: { fontSize: 11, color: "#8E8E93" },
  dateText: { fontSize: 16, fontWeight: "600" },
  selectedDayText: { color: "#fff" },
  monthContainer: { paddingHorizontal: 15, paddingBottom: 15 },
  weekdayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "500",
  },
  monthGrid: { flexDirection: "row", flexWrap: "wrap" },
  gridCell: { width: `${100 / 7}%`, height: 45, padding: 2 },
  gridInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  gridSelected: { borderWidth: 2, borderColor: "#007AFF" },
  gridText: { fontSize: 14 },
  content: { padding: 20, paddingBottom: 100 },
  emptyContainer: { marginTop: 40, gap: 20 },
  aiBubble: {
    backgroundColor: "#F2F2F7",
    padding: 24,
    borderRadius: 24,
    alignSelf: "flex-start",
  },
  aiText: { fontSize: 18, color: "#3A3A3C", lineHeight: 26 },
  inputGuide: {
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: "#D1D1D6",
    padding: 20,
    borderRadius: 20,
    alignItems: "flex-end",
  },
  guideText: { color: "#8E8E93" },
});
