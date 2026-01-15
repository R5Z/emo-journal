import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { JournalEntry } from '../../types';

interface Props {
  data: JournalEntry[];
}

export default function DebugTable({ data }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>🐞 DB Debug View (Total: {data.length})</Text>
      <ScrollView horizontal>
        <View>
          {/* Table Header */}
          <View style={[styles.row, styles.header]}>
            <Text style={[styles.cell, { width: 40 }]}>ID</Text>
            <Text style={[styles.cell, { width: 150 }]}>Content</Text>
            <Text style={[styles.cell, { width: 80 }]}>Emotions</Text>
            <Text style={[styles.cell, { width: 100 }]}>CreatedAt</Text>
          </View>
          {/* Table Body */}
          <ScrollView style={{ maxHeight: 200 }}>
            {data.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={[styles.cell, { width: 40 }]}>{item.id}</Text>
                <Text style={[styles.cell, { width: 150 }]} numberOfLines={1}>{item.content}</Text>
                <Text style={[styles.cell, { width: 80 }]}>{JSON.stringify(item.emotionCategoryIds)}</Text>
                <Text style={[styles.cell, { width: 100 }]}>{item.createdAt.split(' ')[1]}</Text> 
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 20, padding: 10, backgroundColor: '#1e1e1e', borderRadius: 8 },
  title: { color: '#00ff00', fontWeight: 'bold', marginBottom: 5, fontSize: 12 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' },
  header: { backgroundColor: '#333' },
  cell: { padding: 5, color: '#ccc', fontSize: 10, borderRightWidth: 1, borderRightColor: '#333' },
});