import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
import { analyzeEmotion } from '../src/domain/emotion/analyzer';
import { saveEntry, updateEntry } from '../src/services/storage';

export default function EditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState('');
  
  const isEditing = !!params.id;
  const entryId = params.id ? Number(params.id) : null;
  
  // [수정] params로 넘어온 날짜를 우선 사용
  const selectedDate = (params.selectedDate as string) || dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (isEditing && params.content) {
      setContent(params.content as string);
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [isEditing, params.content]);

  const handleSave = async () => {
  if (!content.trim()) return;
  try {
    const result = analyzeEmotion(content);
    console.log('분석 결과:', JSON.stringify(result, null, 2)); // 분석 로그
    if (isEditing && entryId) {
      await updateEntry(entryId, content, result);
    } else {
      await saveEntry(content, result, selectedDate);
    }
    router.replace({ pathname: '/', params: { selectedDate } });
  } catch (error) {
    console.error('처리 중 에러 발생:', error);
    Alert.alert("오류", "일기를 저장하는 중 문제가 발생했습니다.");
  }
};

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navButton}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEditing ? '일기 수정' : `${dayjs(selectedDate).format('MM월 DD일')} 일기`}
        </Text>

        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>완료</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        ref={inputRef}
        style={styles.input}
        multiline
        placeholder="지금의 기분이나 상황을 간단히 남겨보세요."
        value={content}
        onChangeText={setContent}
        textAlignVertical="top"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, 
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  navButton: { padding: 5 },
  cancelText: { fontSize: 16, color: '#666' },
  saveButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  input: { 
    flex: 1, 
    fontSize: 18, 
    padding: 20, 
    textAlignVertical: 'top',
    lineHeight: 26 
  },
});