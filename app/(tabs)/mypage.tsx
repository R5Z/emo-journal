import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAllEntries } from '../../src/lib/storage';
import EmotionFlowDashboard from '../../src/components/EmotionFlowDashboard';
import ProfileEditModal from '../../src/components/ProfileEditModal';
import { Profile, DEFAULT_PROFILE, JournalEntry } from '../../src/types';
import { loadProfile, saveProfile } from '../../src/lib/profile';
import { calculateStreaks, getFirstRecordDate, StreakStats } from '../../src/lib/streak';


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
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [editModalVisible, setEditModalVisible] = useState(false);


  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      const [allEntries, savedProfile] = await Promise.all([
        getAllEntries(),
        loadProfile(),
      ]);

      setEntries(allEntries);
      setStats(calculateStreaks(allEntries));
      setProfile(savedProfile);

      setJoinDate(getFirstRecordDate(allEntries));

    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const handleSaveProfile = async (newProfile: Profile) => {
    await saveProfile(newProfile);
    setProfile(newProfile);
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
          <Text style={styles.headerTitle} accessibilityRole="header">마이 페이지</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="설정"
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
            {profile.avatarType === 'image' && profile.avatarImageUri ? (
              <Image
                source={{ uri: profile.avatarImageUri }}
                style={{ width: 60, height: 60, borderRadius: 30 }}
                accessibilityLabel={`${profile.nickname} 프로필 이미지`}
              />
            ) : (
              <View style={styles.avatar} accessibilityLabel={`${profile.nickname} 프로필 아바타`}>
                <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.nickname} accessibilityRole="header">{profile.nickname}</Text>
              {joinDate !== '' && (
                <Text style={styles.joinDate} accessibilityRole="text">{joinDate}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="프로필 편집"
            >
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
              <Text style={styles.streakNumber} accessibilityRole="text">{item.value}</Text>
              <Text style={styles.streakLabel} accessibilityRole="text">
                {item.label} {item.icon}
              </Text>
            </View>
          ))}
        </View>

        {/* ── 감정 흐름 + 카테고리 범례 ── */}
        <EmotionFlowDashboard entries={entries} />
      </ScrollView>

      {/* ── 프로필 편집 모달 ── */}
      <ProfileEditModal
        visible={editModalVisible}
        initialProfile={profile}
        onSave={handleSaveProfile}
        onClose={() => setEditModalVisible(false)}
      />
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
    fontSize: 18,
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
