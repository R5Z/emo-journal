import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { EMOTION_CATEGORIES } from '../data/emotion-setup';
import { CategoryScore, JournalEntry } from '../types';

// ============================================
// Types
// ============================================

type EmotionEntry = {
  createdAt: string;
  emotionResult: {
    topCategories: CategoryScore[];
    isNeutral: boolean;
  };
};

type DailyEmotion = {
  date: string;
  primaryCategoryId: number;
  primaryColor: string;
  allCategoryIds: number[];
};

type MonthData = {
  monthKey: string;
  label: string;
  range: string;
  daysRecorded: number;
  totalDays: number;
  dailyEmotions: DailyEmotion[];
  usedEmotionIds: number[];
  insight: string;
};

// ============================================
// Helpers
// ============================================

const NEUTRAL_COLOR = '#E5E5EA';
const BRIGHT_IDS = new Set([1, 2, 3, 4, 5]); // 기쁨, 만족, 설렘, 평온, 안도

const categoryMap = new Map(
  EMOTION_CATEGORIES.map((c) => [c.categoryId, c]),
);

const getColor = (id: number) => categoryMap.get(id)?.colorHex || NEUTRAL_COLOR;
const getName = (id: number) => categoryMap.get(id)?.name || '중립';

const SHORT_NAMES: Record<number, string> = {
  3:  '설렘',
  4:  '평온',
  6:  '스트레스',
  8:  '걱정',
  21: '황당',
};
const getShortName = (id: number) => SHORT_NAMES[id] || getName(id);

function formatRange(dates: string[]): string {
  if (dates.length === 0) return '';
  const [, fm, fd] = dates[0].split('-').map(Number);
  const [, lm, ld] = dates[dates.length - 1].split('-').map(Number);
  return `${fm}월 ${fd}일 – ${lm}월 ${ld}일`;
}

function generateInsight(daily: DailyEmotion[]): string {
  if (daily.length < 3) return '기록이 쌓이면 감정 흐름을 읽어 드릴게요.';

  const third = Math.ceil(daily.length / 3);
  const ratio = [
    daily.slice(0, third),
    daily.slice(third, third * 2),
    daily.slice(third * 2),
  ].map((part) => {
    if (part.length === 0) return 0;
    return part.filter((d) => BRIGHT_IDS.has(d.primaryCategoryId)).length / part.length;
  });

  if (ratio[0] > 0.6 && ratio[2] > 0.6)
    return '따뜻한 색이 고르게 이어진 시기였어요.';
  if (ratio[0] > 0.5 && ratio[2] < 0.3)
    return '초반에 밝은 감정이 이어지다, 후반에 잠시 가라앉는 흐름이 있었어요.';
  if (ratio[0] < 0.3 && ratio[2] > 0.5)
    return '초반에 무거운 감정이 머물렀지만, 후반으로 갈수록 가벼워졌어요.';
  if (ratio[1] < 0.3)
    return '중반 즈음 감정이 가라앉는 흐름이 있었어요.';
  return '다양한 감정이 섞여 있던 시기였어요.';
}

// ============================================
// Data Processing
// ============================================

function processMonthlyData(entries: EmotionEntry[]): MonthData[] {
  if (entries.length === 0) return [];

  // 월별 그룹
  const byMonth = new Map<string, EmotionEntry[]>();
  entries.forEach((e) => {
    const key = e.createdAt.substring(0, 7); // YYYY-MM
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  });

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return [...byMonth.keys()]
    .sort()
    .reverse()
    .map((monthKey) => {
      const monthEntries = byMonth.get(monthKey)!;

      // 날짜별 그룹
      const byDate = new Map<string, EmotionEntry[]>();
      monthEntries.forEach((e) => {
        const date = e.createdAt.split(' ')[0];
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date)!.push(e);
      });

      const sortedDates = [...byDate.keys()].sort();
      const allUsedIds = new Set<number>();
      const dailyEmotions: DailyEmotion[] = [];

      sortedDates.forEach((date) => {
        const dayEntries = byDate.get(date)!;

        // 하루 전체 점수 합산
        const scoreMap = new Map<number, number>();
        dayEntries.forEach((entry) => {
          if (!entry.emotionResult?.isNeutral) {
            entry.emotionResult.topCategories.forEach((cat) => {
              scoreMap.set(
                cat.categoryId,
                (scoreMap.get(cat.categoryId) || 0) + cat.totalScore,
              );
            });
          }
        });

        if (scoreMap.size > 0) {
          let primaryId = 0;
          let maxScore = -1;
          scoreMap.forEach((score, id) => {
            if (score > maxScore) {
              maxScore = score;
              primaryId = id;
            }
          });

          const allIds = [...scoreMap.keys()];
          allIds.forEach((id) => allUsedIds.add(id));

          dailyEmotions.push({
            date,
            primaryCategoryId: primaryId,
            primaryColor: getColor(primaryId),
            allCategoryIds: allIds,
          });
        } else {
          dailyEmotions.push({
            date,
            primaryCategoryId: 0,
            primaryColor: NEUTRAL_COLOR,
            allCategoryIds: [],
          });
        }
      });

      const [year, month] = monthKey.split('-').map(Number);
      const totalDays = new Date(year, month, 0).getDate();

      return {
        monthKey,
        label: monthKey === currentKey ? '이번 달' : `${sortedDates.length}일`,
        range: formatRange(sortedDates),
        daysRecorded: sortedDates.length,
        totalDays,
        dailyEmotions,
        usedEmotionIds: [...allUsedIds],
        insight: generateInsight(dailyEmotions),
      };
    });
}

// ============================================
// Sub-components
// ============================================

function GradientBar({
  dailyEmotions,
  daysRecorded,
  totalDays,
}: {
  dailyEmotions: DailyEmotion[];
  daysRecorded: number;
  totalDays: number;
}) {
  if (dailyEmotions.length === 0) return null;

  const pct = (daysRecorded / totalDays) * 100;
  const colors = dailyEmotions.map((d) => d.primaryColor);
  if (colors.length === 1) colors.push(colors[0]); // LinearGradient 최소 2색

  const midDay = Math.round(daysRecorded / 2);

  return (
    <View>
      <View style={[s.barLabels, { width: `${pct}%` }]}>
        <Text style={s.barLabelText}>1</Text>
        <Text style={s.barLabelText}>{midDay}</Text>
        <Text style={s.barLabelText}>{daysRecorded}</Text>
      </View>
      <View style={s.barTrack}>
        <LinearGradient
          colors={colors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.barFill, { width: `${pct}%` }]}
        />
      </View>
    </View>
  );
}

function DotRow({
  categoryId,
  dailyEmotions,
}: {
  categoryId: number;
  dailyEmotions: DailyEmotion[];
}) {
  const color = getColor(categoryId);
  const name = getShortName(categoryId);

  return (
    <View style={s.dotRow}>
      <View style={s.dotsContainer}>
        {dailyEmotions.map((d, i) => {
          const active = d.allCategoryIds.includes(categoryId);
          return (
            <View key={i} style={s.dotCell}>
              <View
                style={{
                  width: active ? 5.5 : 2,
                  height: active ? 5.5 : 2,
                  borderRadius: active ? 2.75 : 1,
                  backgroundColor: active ? color : '#E5E5EA',
                }}
              />
            </View>
          );
        })}
      </View>
      <Text style={s.dotLabel}>{name}</Text>
    </View>
  );
}

function MonthCard({ data }: { data: MonthData }) {
  const [open, setOpen] = useState(true);

  return (
    <View style={s.monthCard}>
      {/* 헤더 */}
      <TouchableOpacity
        style={s.monthHeader}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
      >
        <View style={s.monthHeaderLeft}>
          <Text style={s.monthLabel}>{data.label} </Text>
          <Text style={s.monthRange}>{data.range}</Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color="#C7C7CC"
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {/* 그라데이션 바 (항상 표시) */}
      <GradientBar
        dailyEmotions={data.dailyEmotions}
        daysRecorded={data.daysRecorded}
        totalDays={data.totalDays}
      />

      {/* 접기/펼치기 */}
      {open && (
        <View style={s.expanded}>
          {data.usedEmotionIds.map((id) => (
            <DotRow
              key={id}
              categoryId={id}
              dailyEmotions={data.dailyEmotions}
            />
          ))}
          <View style={s.insightBox}>
            <Text style={s.insightText}>{data.insight}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================
// Main Component
// ============================================

type Props = {
  entries: JournalEntry[];
};

export default function EmotionFlowDashboard({ entries }: Props) {
  const monthlyData = useMemo(
    () => processMonthlyData(entries),
    [entries],
  );

  return (
    <>
      {/* ── 감정 흐름 ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>감정 흐름</Text>
          <Text style={s.sectionYear}>{new Date().getFullYear()}</Text>
        </View>

        {monthlyData.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>
              일기를 작성하면 감정 흐름이 여기에 나타나요.
            </Text>
          </View>
        ) : (
          monthlyData.map((data) => (
            <MonthCard key={data.monthKey} data={data} />
          ))
        )}
      </View>

      {/* ── 감정 카테고리 범례 ── */}
      <View style={s.section}>
        <Text style={s.legendTitle}>감정 카테고리</Text>
        <View style={s.legendGrid}>
          {EMOTION_CATEGORIES.map((cat) => (
            <View
              key={cat.categoryId}
              style={[s.legendChip, { backgroundColor: cat.colorHex + '18' }]}
            >
              <View
                style={[s.legendDot, { backgroundColor: cat.colorHex }]}
              />
              <Text style={s.legendName}>{cat.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

// ============================================
// Styles
// ============================================

const s = StyleSheet.create({
  // Section wrapper
  section: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  sectionYear: {
    fontSize: 15,
    color: '#8E8E93',
  },

  // Month card
  monthCard: {
    marginBottom: 22,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  monthHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  monthRange: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Gradient bar
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  barLabelText: {
    fontSize: 10,
    color: '#8E8E93',
  },
  barTrack: {
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
  },
  barFill: {
    height: 18,
    borderRadius: 9,
  },

  // Dot matrix
  expanded: {
    marginTop: 8,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  dotsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  dotCell: {
    flex: 1,
    height: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginLeft: 8,
    minWidth: 45,
    textAlign: 'right',
  },

  // Insight
  insightBox: {
    marginTop: 8,
    padding: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  insightText: {
    fontSize: 13,
    color: '#3C3C43',
    lineHeight: 20,
  },

  // Empty state
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },

  // Legend
  legendTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: 14,
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendName: {
    fontSize: 13,
    color: '#3C3C43',
  },
});
