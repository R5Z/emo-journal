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
import { saveEntry, updateEntry } from '../src/lib/storage';
import { useTheme } from '../src/store/useThemeStore';

export default function EditorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams(); 
  const inputRef = useRef<TextInput>(null);

  const [content, setContent] = useState('');
  
  const isEditing = !!params.id;
  const entryId = params.id ? Number(params.id) : null;
  
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
  if (!content.trim()) {
    Alert.alert('알림', '내용을 입력해 주세요.');
    return;
  }
  try {
    const result = analyzeEmotion(content);
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
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
    >
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.separator }]}>
        <TouchableOpacity 
          onPress={() => {
            const hasChanges = isEditing
              ? content !== (params.content as string)
              : content.trim().length > 0;

            if (hasChanges) {
              Alert.alert(
                '작성 중인 내용이 있어요',
                '나가면 작성 중인 내용이 사라집니다.',
                [
                  { text: '계속 작성', style: 'cancel' },
                  { text: '나가기', style: 'destructive', onPress: () => router.back() },
                ],
              );
            } else {
              router.back();
            }
          }}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="작성 취소"
        >
          <Text style={[styles.cancelText, { color: colors.textTertiary }]}>취소</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} accessibilityRole="header">
          {isEditing ? '일기 수정' : `${dayjs(selectedDate).format('MM월 DD일')} 일기`}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: colors.tint }]}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? '일기 수정 완료' : '일기 저장'}
        >
          <Text style={styles.saveButtonText}>완료</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        ref={inputRef}
        style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.backgroundSecondary }]}
        multiline
        placeholder="지금의 기분이나 상황을 간단히 남겨보세요."
        placeholderTextColor={colors.textTertiary}
        value={content}
        onChangeText={setContent}
        textAlignVertical="top"
        accessibilityLabel="일기 내용 입력"
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
