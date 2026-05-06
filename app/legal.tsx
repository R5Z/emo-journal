import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// 임시 텍스트 (추후 실제 법률 문서로 교체)
// ============================================

const PRIVACY_POLICY = `개인정보 처리방침

최종 수정일: 2026년 1월 1일

1. 수집하는 개인정보

본 앱은 사용자가 직접 입력한 일기 내용과 앱 설정 정보만을 저장합니다. 수집되는 정보는 다음과 같습니다:

• 일기 내용 (텍스트)
• 작성 일시
• 앱 설정 (알림 시간, 잠금 설정 등)
• 프로필 정보 (닉네임, 아바타)

2. 개인정보의 저장 및 보호

모든 데이터는 사용자의 기기 내에서만 저장되며, 외부 서버로 전송되지 않습니다. 앱 잠금 기능(Face ID, PIN)을 통해 타인의 접근을 방지할 수 있습니다.

3. 개인정보의 제3자 제공

본 앱은 사용자의 개인정보를 제3자에게 제공하지 않습니다.

4. 개인정보의 파기

앱을 삭제하면 기기에 저장된 모든 데이터가 함께 삭제됩니다. 설정 메뉴의 '전체 데이터 삭제' 기능을 통해 앱 내에서도 데이터를 삭제할 수 있습니다.

5. 이용자의 권리

사용자는 언제든지 자신의 데이터를 내보내거나 삭제할 수 있습니다. 데이터 내보내기는 설정 → 데이터 및 동기화에서 이용할 수 있습니다.

6. 문의

개인정보 관련 문의사항은 앱 내 '피드백 보내기'를 이용해 주세요.`;

const TERMS_OF_SERVICE = `서비스 이용약관

최종 수정일: 2026년 1월 1일

제1조 (목적)

본 약관은 감정 일기 앱(이하 "서비스")의 이용과 관련하여 필요한 사항을 규정함을 목적으로 합니다.

제2조 (서비스의 내용)

서비스는 사용자가 작성한 일기에서 감정을 자동으로 인식하고 시각화하는 기능을 제공합니다. 주요 기능은 다음과 같습니다:

• 일기 작성 및 관리
• 감정 키워드 자동 인식
• 감정 컬러 시각화 (달력, 타임라인)
• 감정 흐름 대시보드
• 데이터 내보내기/가져오기

제3조 (이용자의 의무)

1. 이용자는 본 서비스를 개인적인 목적으로만 사용해야 합니다.
2. 이용자는 자신의 데이터 백업에 대한 책임을 가집니다.

제4조 (서비스의 변경 및 중단)

1. 서비스는 기능 개선을 위해 사전 고지 후 변경될 수 있습니다.
2. 천재지변, 기술적 문제 등 불가피한 사유로 서비스가 일시 중단될 수 있습니다.

제5조 (면책사항)

1. 서비스의 감정 분석 결과는 참고 목적이며, 전문적인 심리 상담이나 의료 행위를 대체하지 않습니다.
2. 기기 손상, 앱 삭제 등으로 인한 데이터 손실에 대해 서비스 제공자는 책임지지 않습니다.

제6조 (약관의 변경)

본 약관은 관련 법령 변경 또는 서비스 정책 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지를 통해 안내합니다.`;

// ============================================
// Legal Screen
// ============================================

export default function LegalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string }>();
  const isPrivacy = params.type === 'privacy';

  const title = isPrivacy ? '개인정보 처리방침' : '서비스 이용약관';
  const content = isPrivacy ? PRIVACY_POLICY : TERMS_OF_SERVICE;

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color="#007AFF" />
          <Text style={s.backText}>설정</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{title}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <Text style={s.bodyText}>{content}</Text>
        </View>

        <Text style={s.placeholder}>
          본 문서는 임시 작성본이며, 정식 출시 전 법률 검토를 거쳐 교체될 예정입니다.
        </Text>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  bodyText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 22,
  },
  placeholder: {
    marginTop: 16,
    fontSize: 12,
    color: '#C7C7CC',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
