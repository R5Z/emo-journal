import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { JournalEntry } from '../../types';
import { getEmotionDisplay } from '../../domain/emotion/formatter';

interface Props {
  entry: JournalEntry;
}

export default function EntryCard({ entry }: Props) {
  const { colors } = getEmotionDisplay(entry.emotionCategoryIds);
  const timeStr = entry.createdAt.split(' ')[1].substring(0, 5);

  return (
    <View style={styles.card}>
      {/* 좌측에 감정의 주된 색상을 세로 선으로 표시 */}
      <View style={[styles.indicator, { backgroundColor: colors[0] || '#E5E5EA' }]} />
      <View style={styles.cardContent}>
        <Text style={styles.timeText}>{timeStr}</Text>
        <Text style={styles.contentText}>{entry.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    // 그림자 설정
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  indicator: {
    width: 5,
  },
  cardContent: {
    padding: 16,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '600',
  },
  contentText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
  },
});