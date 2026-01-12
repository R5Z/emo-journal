import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { insertEntry, getEntriesByDate, Entry } from '@/data/entries';
import { randomUUID } from 'expo-crypto';

export default function DayScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  const load = async () => {
    try {
        const rows = await getEntriesByDate(today);
        setEntries(rows);
    } catch (e) {
        console.error('load failed', e);
    }
    };

  const addTest = async () => {
    const now = new Date().toISOString();
    await insertEntry({
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      body: '테스트 일기입니다',
    });
    await load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={{ padding: 40, gap: 50 }}>
      <Button title="테스트 저장" onPress={addTest} />
      <Button title="불러오기" onPress={load} />
      {entries.map((e) => (
        <Text key={e.id}>{e.createdAt.slice(11, 16)} — {e.body}</Text>
      ))}
    </View>
  );
}
