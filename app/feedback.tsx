import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/store/useThemeStore';

// ============================================
// 피드백 카테고리
// ============================================

const CATEGORIES = [
  { id: 'bug', label: '버그 신고', icon: '🐛' },
  { id: 'feature', label: '기능 제안', icon: '💡' },
  { id: 'emotion', label: '감정 인식 개선', icon: '🎨' },
  { id: 'other', label: '기타', icon: '💬' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

// ============================================
// 피드백 이메일 주소 (실제 주소로 변경 필요)
// ============================================

const FEEDBACK_EMAIL = 'hey@yoonjang.me';

// ============================================
// Feedback Screen
// ============================================

export default function FeedbackScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!selectedCategory) {
      Alert.alert('알림', '카테고리를 선택해 주세요.');
      return;
    }
    if (message.trim().length < 5) {
      Alert.alert('알림', '내용을 5자 이상 입력해 주세요.');
      return;
    }

    setSending(true);

    const categoryLabel = CATEGORIES.find((c) => c.id === selectedCategory)?.label || '';
    const subject = encodeURIComponent(`[감정일기 피드백] ${categoryLabel}`);
    const body = encodeURIComponent(
      `카테고리: ${categoryLabel}\n\n${message.trim()}\n\n---\n앱 버전: v1.0.0\nOS: ${Platform.OS} ${Platform.Version}`,
    );

    const mailUrl = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailUrl);
      if (canOpen) {
        await Linking.openURL(mailUrl);
        // 메일 앱이 열린 후 폼 초기화
        setTimeout(() => {
          setSelectedCategory(null);
          setMessage('');
          setSending(false);
        }, 1000);
      } else {
        Alert.alert(
          '메일 앱 없음',
          `메일 앱을 열 수 없습니다.\n아래 주소로 직접 보내주세요:\n${FEEDBACK_EMAIL}`,
        );
        setSending(false);
      }
    } catch {
      Alert.alert('오류', '피드백 전송에 실패했습니다.');
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.tint} />
          <Text style={[s.backText, { color: colors.tint }]}>설정</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>피드백 보내기</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 카테고리 선택 */}
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>어떤 종류의 피드백인가요?</Text>
          <View style={s.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  s.categoryItem,
                  { backgroundColor: colors.backgroundCard },
                  selectedCategory === cat.id && s.categorySelected,
                  selectedCategory === cat.id && { borderColor: colors.tint, backgroundColor: colors.tintBackground },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.6}
              >
                <Text style={s.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    s.categoryLabel,
                    selectedCategory === cat.id && s.categoryLabelSelected,
                    { color: selectedCategory === cat.id ? colors.tint : colors.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 메시지 입력 */}
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>내용을 알려주세요</Text>
          <View style={[s.inputGroup, { backgroundColor: colors.backgroundCard }]}>
            <TextInput
              style={[s.textInput, { color: colors.textPrimary }]}
              value={message}
              onChangeText={setMessage}
              placeholder="자세히 적어주시면 큰 도움이 됩니다"
              placeholderTextColor={colors.separator}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={[s.charCount, { color: colors.separator }]}>
              {message.length}/1000
            </Text>
          </View>

          {/* 전송 버튼 */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <TouchableOpacity
              style={[
                s.sendButton,
                { backgroundColor: colors.tint },
                (!selectedCategory || message.trim().length < 5) && s.sendButtonDisabled,
                (!selectedCategory || message.trim().length < 5) && { backgroundColor: colors.buttonDisabled },
              ]}
              onPress={handleSend}
              disabled={sending || !selectedCategory || message.trim().length < 5}
              activeOpacity={0.7}
            >
              <Text style={s.sendButtonText}>
                {sending ? '메일 앱 열기...' : '피드백 보내기'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 안내 */}
          <Text style={[s.notice, { color: colors.textTertiary }]}>
            피드백은 메일 앱을 통해 전송됩니다.{'\n'}
            보내주신 의견은 앱 개선에 소중하게 반영하겠습니다.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#3C3C43',
  },

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryItem: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categorySelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43',
  },
  categoryLabelSelected: {
    color: '#007AFF',
  },

  // Text input
  inputGroup: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: '#000',
    minHeight: 150,
  },
  charCount: {
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 10,
    fontSize: 12,
    color: '#C7C7CC',
  },

  // Send button
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#B0D4FF',
  },
  sendButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },

  // Notice
  notice: {
    paddingHorizontal: 16,
    paddingTop: 16,
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 19,
  },
});
