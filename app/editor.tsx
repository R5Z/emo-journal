import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router'; // [네비게이션 컨트롤러]
import { analyzeEmotion } from '../src/domain/emotion/analyzer'; // [비즈니스 로직]
import { saveEntry } from '../src/services/storage'; // [DB 서비스]

export default function EditorScreen() {
  const [content, setContent] = useState('');
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  // 1. 화면이 열리자마자 입력창에 포커스 (UX)
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // 2. [저장 핸들러] 완료 버튼 클릭 시 실행 (서버의 POST 요청 핸들러와 유사)
  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      // (1) 감정 분석 실행
      const categoryIds = analyzeEmotion(content);
      console.log('분석된 ID:', categoryIds);

      // (2) DB 저장 요청
      await saveEntry(content, categoryIds);

      // (3) 성공 시 메인화면으로 복귀 (Replace: 뒤로가기 스택에서 제거)
      router.replace('/');
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* --- 상단 헤더 영역 (손그림 2번 상단) --- */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} // [뒤로가기 핵심] 이전 화면으로 단순히 돌아감
          style={styles.navButton}
        >
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleSave} // [저장 실행]
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
  navButton: { padding: 5 },
  cancelText: { fontSize: 16, color: '#666' },
  saveButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  input: { 
    flex: 1, 
    fontSize: 18, 
    padding: 20, 
    textAlignVertical: 'top' 
  },
});