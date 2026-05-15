import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/store/useThemeStore';

// ============================================
// FAQ 데이터
// ============================================

const FAQ_DATA = [
  {
    question: '감정은 어떻게 분석되나요?',
    answer:
      '작성하신 일기에서 감정 키워드를 자동으로 인식해 21개의 감정 카테고리로 분류합니다. 직접 감정을 선택할 필요 없이, 자연스럽게 쓴 글에서 감정을 읽어냅니다.',
  },
  {
    question: '하루에 여러 개의 일기를 쓸 수 있나요?',
    answer:
      '네, 하루에 원하는 만큼 기록할 수 있습니다. 각 기록마다 감정이 따로 분석되고, 달력에는 그날의 전체 감정이 종합되어 표시됩니다.',
  },
  {
    question: '내 일기 데이터는 안전한가요?',
    answer:
      '모든 데이터는 기기 내에만 저장되며, 외부 서버로 전송되지 않습니다. 앱 잠금(Face ID/PIN) 기능을 사용하면 다른 사람이 앱을 열어볼 수 없습니다.',
  },
  {
    question: '데이터를 백업할 수 있나요?',
    answer:
      '설정 → 데이터 및 동기화에서 JSON 또는 PDF 형식으로 내보낼 수 있습니다. JSON 파일은 다시 앱으로 가져올 수 있어 기기 변경 시에도 데이터를 유지할 수 있습니다.',
  },
  {
    question: '감정 색상은 어떤 기준인가요?',
    answer:
      '플루치크(Plutchik)의 감정 이론을 기반으로 21개 감정 카테고리에 각각 고유한 색상을 부여했습니다. 마이페이지 하단의 감정 카테고리에서 전체 목록을 확인할 수 있습니다.',
  },
  {
    question: '달력에 표시되는 색은 무엇인가요?',
    answer:
      '그날 작성한 일기에서 감지된 감정의 색상입니다. 여러 감정이 감지되면 그라데이션으로 표시됩니다. 색이 없는 날은 기록이 없는 날입니다.',
  },
  {
    question: '앱을 삭제하면 데이터도 사라지나요?',
    answer:
      '네, 모든 데이터가 기기 내에 저장되므로 앱을 삭제하면 데이터도 함께 삭제됩니다. 중요한 기록은 미리 내보내기(백업)해 두시는 것을 권장합니다.',
  },
  {
    question: '프리미엄 기능에는 어떤 것이 있나요?',
    answer:
      '감정 컬러 팔레트 커스텀, 나만의 감정 키워드 추가 등을 준비하고 있습니다. 향후 업데이트에서 제공될 예정입니다.',
  },
];

// ============================================
// 아코디언 아이템
// ============================================

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
  isLast,
  colors,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  isLast: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[s.item, !isLast && s.itemBorder, !isLast && { borderBottomColor: colors.separator }]}>
      <TouchableOpacity
        style={s.questionRow}
        onPress={onToggle}
        activeOpacity={0.6}
      >
        <Text style={[s.questionText, { color: colors.textPrimary }]}>{question}</Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.separator}
          style={{
            transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
          }}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={s.answerBox}>
          <Text style={[s.answerText, { color: colors.settingsSectionLabel }]}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// FAQ Screen
// ============================================

export default function FAQScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { colors } = useTheme();

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
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>자주 묻는 질문</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.group, { backgroundColor: colors.settingsGroupBackground }]}>
          {FAQ_DATA.map((item, i) => (
            <AccordionItem
              key={i}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === i}
              onToggle={() =>
                setOpenIndex(openIndex === i ? null : i)
              }
              isLast={i === FAQ_DATA.length - 1}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
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
  group: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  item: {},
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
    marginRight: 12,
  },
  answerBox: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  answerText: {
    fontSize: 14,
    color: '#6C6C70',
    lineHeight: 21,
  },
});
