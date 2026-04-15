import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAllEntries } from '../../src/services/storage';
import EmotionFlowDashboard from '../../src/components/EmotionFlowDashboard';

// ============================================
// 스트릭 계산
// ============================================

type StreakStats = {
  current: number;
  longest: number;
  total: number;
};

const toLocalDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const dayDiff = (a: string, b: string): number => {
  const msA = new Date(a + 'T00:00:00').getTime();
  const msB = new Date(b + 'T00:00:00').getTime();
  return Math.round((msB - msA) / 86_400_000);
};

function calculateStreaks(
  entries: { createdAt: string }[],
): StreakStats {
  if (entries.length === 0) {
    return { current: 0, longest: 0, total: 0 };
  }

  const dates = [
    ...new Set(entries.map((e) => e.createdAt.split(' ')[0])),
  ].sort();

  const total = dates.length;

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dayDiff(dates[i - 1], dates[i]) === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const today = toLocalDateStr(new Date());
  const yesterday = toLocalDateStr(new Date(Date.now() - 86_400_000));
  const last = dates[dates.length - 1];

  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      if (dayDiff(dates[i], dates[i + 1]) === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest, total };
}

// ============================================
// MY 화면
// ============================================

export default function ProfileScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<StreakStats>({
    current: 0,
    longest: 0,
    total: 0,
  });
  const [joinDate, setJoinDate] = useState('');
  const [entries, setEntries] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      const allEntries = await getAllEntries();
      setStats(calculateStreaks(allEntries));
      setEntries(allEntries);

      if (allEntries.length > 0) {
        const dates = allEntries
          .map((e) => e.createdAt.split(' ')[0])
          .sort();
        const [y, m, d] = dates[0].split('-');
        setJoinDate(`${y}.${m}.${d} 첫 기록`);
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ width: 30 }} />
          <Text style={styles.headerTitle}>마이 페이지</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color="#3C3C43"
            />
          </TouchableOpacity>
        </View>

        {/* ── Profile Card ── */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🪨</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>송은석</Text>
              {joinDate !== '' && (
                <Text style={styles.joinDate}>{joinDate}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>편집</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Streak Stats ── */}
        <View style={styles.streakRow}>
          {[
            { value: stats.current, label: '연속 기록', icon: '🔥' },
            { value: stats.longest, label: '최장', icon: '✨' },
            { value: stats.total, label: '총 기록', icon: '📝' },
          ].map((item) => (
            <View key={item.label} style={styles.streakCard}>
              <Text style={styles.streakNumber}>{item.value}</Text>
              <Text style={styles.streakLabel}>
                {item.label} {item.icon}
              </Text>
            </View>
          ))}
        </View>

        {/* ── 감정 흐름 + 카테고리 범례 ── */}
        <EmotionFlowDashboard entries={entries} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  settingsButton: {
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  joinDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  editButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  streakRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  streakLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
});
