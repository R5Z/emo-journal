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
import { useRouter, useLocalSearchParams } from 'expo-router'; // [네비게이션 컨트롤러]
import { analyzeEmotion } from '../src/domain/emotion/analyzer'; // [비즈니스 로직]
import { saveEntry, updateEntry } from '../src/services/storage'; // [DB 서비스]

export default function EditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); // [파라미터 수신]
  const inputRef = useRef<TextInput>(null);

  // 상태값 설정 (수정 모드일 경우 기존 내용을 초기값으로)
  const [content, setContent] = useState('');
  
  // 수정 모드 판별 플래그
  const isEditing = !!params.id;
  const entryId = params.id ? Number(params.id) : null;

  useEffect(() => {
    // 수정 모드라면 전달받은 기존 내용을 세팅
    if (isEditing && params.content) {
      setContent(params.content as string);
    }

    // 화면 진입 시 포커스
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [isEditing, params.content]);

  // [저장/수정 핸들러]
  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      // 감정 분석 실행
      const categoryIds = analyzeEmotion(content);

      if (isEditing && entryId) {
        // (A) 수정 모드: UPDATE 실행
        await updateEntry(entryId, content, categoryIds);
        console.log(`✅ 수정 완료: ID ${entryId}`);
      } else {
        // (B) 생성 모드: INSERT 실행
        await saveEntry(content, categoryIds);
        console.log('✅ 새 일기 저장 완료');
      }

      // 메인화면으로 복귀
      router.replace('/');
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
      {/* --- 상단 헤더 영역 --- */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.navButton}
        >
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>

        {/* 수정 모드일 때 헤더 타이틀 표시 (선택 사항) */}
        <Text style={styles.headerTitle}>{isEditing ? '일기 수정' : '새 일기'}</Text>

        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>완료</Text>
        </TouchableOpacity>
      </View>

      {/* --- 입력 영역 --- */}
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