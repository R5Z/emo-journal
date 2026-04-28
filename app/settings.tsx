import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  scheduleDailyReminder,
  cancelDailyReminder,
} from '../src/lib/notifications';
import PinSetupModal from '../src/components/PinSetupModal';
import { savePin, hasPinSet, removePin, getBiometricType } from '../src/lib/appLock';
import { STORAGE_KEYS } from '../src/constants/storageKeys';


// ============================================
// 설정값 저장/로드
// ============================================

type Settings = {
  remindOn: boolean;
  remindHour: number;
  remindMinute: number;
  remindMessage: string;
  weeklyReport: boolean;
  streakAlert: boolean;
  appLock: boolean;
  autoLockMinutes: number;
  encryption: boolean;
  sync: boolean;
  fontSize: 'small' | 'medium' | 'large';
  weekStart: 'sunday' | 'monday';
};

const DEFAULT_SETTINGS: Settings = {
  remindOn: true,
  remindHour: 21,
  remindMinute: 0,
  remindMessage: '오늘 하루는 어땠어?',
  weeklyReport: true,
  streakAlert: false,
  appLock: false,
  autoLockMinutes: 1,
  encryption: true,
  sync: false,
  fontSize: 'medium',
  weekStart: 'monday',
};

async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

async function saveSettings(settings: Settings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// ============================================
// 포맷 헬퍼
// ============================================

function formatTime(h: number, m: number): string {
  const period = h < 12 ? '오전' : '오후';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour12}:${String(m).padStart(2, '0')}`;
}

const FONT_SIZE_LABEL: Record<Settings['fontSize'], string> = {
  small: '작게',
  medium: '보통',
  large: '크게',
};

const WEEK_START_LABEL: Record<Settings['weekStart'], string> = {
  sunday: '일요일',
  monday: '월요일',
};

const AUTO_LOCK_OPTIONS = [
  { value: 0, label: '즉시' },
  { value: 1, label: '1분' },
  { value: 5, label: '5분' },
  { value: 15, label: '15분' },
];

// ============================================
// 공통 컴포넌트
// ============================================

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

function Group({ children }: { children: React.ReactNode }) {
  return <View style={s.group}>{children}</View>;
}

type RowProps = {
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  last?: boolean;
};

function Row({ label, sub, right, onPress, danger, last }: RowProps) {
  const content = (
    <View style={[s.row, !last && s.rowBorder]}>
      <View style={s.rowLeft}>
        <Text style={[s.rowLabel, danger && { color: '#FF3B30' }]}>
          {label}
        </Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      <View style={s.rowRight}>
        {right}
        {onPress && !right && (
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.4}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

function ValueText({ children }: { children: string }) {
  return <Text style={s.valueText}>{children}</Text>;
}

function Badge({ text }: { text: string }) {
  return (
    <View style={s.badge}>
      <Text style={s.badgeText}>{text}</Text>
    </View>
  );
}

// ============================================
// 옵션 선택 모달 (자동 잠금, 글꼴 크기, 시작 요일 공통)
// ============================================

type Option<T> = { value: T; label: string };

function OptionPickerModal<T extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={s.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={s.modalSheet}>
          <Text style={s.modalTitle}>{title}</Text>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={String(opt.value)}
              style={[
                s.modalOption,
                i < options.length - 1 && s.modalOptionBorder,
              ]}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
            >
              <Text style={s.modalOptionText}>{opt.label}</Text>
              {opt.value === selected && (
                <Ionicons name="checkmark" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ============================================
// 리마인더 메시지 편집 모달
// ============================================

function MessageEditModal({
  visible,
  initialValue,
  onSave,
  onClose,
}: {
  visible: boolean;
  initialValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initialValue);

  useEffect(() => {
    setText(initialValue);
  }, [initialValue, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={s.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={s.modalSheet}>
          <Text style={s.modalTitle}>리마인더 메시지</Text>
          <TextInput
            style={s.textInput}
            value={text}
            onChangeText={setText}
            maxLength={40}
            placeholder="알림에 표시될 문구"
            placeholderTextColor="#C7C7CC"
            autoFocus
          />
          <View style={s.modalActions}>
            <TouchableOpacity
              style={s.modalButton}
              onPress={onClose}
            >
              <Text style={s.modalButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modalButton}
              onPress={() => {
                onSave(text.trim() || DEFAULT_SETTINGS.remindMessage);
                onClose();
              }}
            >
              <Text style={[s.modalButtonText, { fontWeight: '600' }]}>
                저장
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ============================================
// Settings Screen
// ============================================

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // Modals
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [autoLockModalVisible, setAutoLockModalVisible] = useState(false);
  const [fontSizeModalVisible, setFontSizeModalVisible] = useState(false);
  const [weekStartModalVisible, setWeekStartModalVisible] = useState(false);

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinIsChange, setPinIsChange] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Face ID');

  useEffect(() => {
  loadSettings().then((s) => {
    setSettings(s);
    setLoaded(true);

    // 저장된 설정대로 리마인더 복원
    if (s.remindOn) {
      scheduleDailyReminder(s.remindHour, s.remindMinute, s.remindMessage);
    }
  });

  // 생체인증 타입 확인
  getBiometricType().then(setBiometricLabel);
}, []);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
  const next = { ...settings, [key]: value };
  setSettings(next);
  saveSettings(next);

  // 알림 관련 설정 변경 시 자동 반영
  if (key === 'remindOn' || key === 'remindHour' || key === 'remindMinute' || key === 'remindMessage') {
    if (next.remindOn) {
      scheduleDailyReminder(next.remindHour, next.remindMinute, next.remindMessage);
    } else {
      cancelDailyReminder();
    }
  }
};

  const handleTimeChange = (event: any, date?: Date) => {
  if (Platform.OS === 'android') setTimePickerVisible(false);
  if (date) {
    const next = {
      ...settings,
      remindHour: date.getHours(),
      remindMinute: date.getMinutes(),
    };
    setSettings(next);
    saveSettings(next);

    if (next.remindOn) {
      scheduleDailyReminder(next.remindHour, next.remindMinute, next.remindMessage);
    }
  }
};

  const confirmPremiumOnly = () => {
    Alert.alert(
      '프리미엄 구독 필요',
      '이 기능은 프리미엄 구독 시 이용 가능합니다.',
      [{ text: '확인' }],
    );
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      '전체 데이터 삭제',
      '모든 일기와 설정이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert('알림', '삭제 기능은 다음 단계에서 구현됩니다.');
          },
        },
      ],
    );
  };

  if (!loaded) {
    return <SafeAreaView style={s.safeArea} />;
  }

  const reminderDate = new Date();
  reminderDate.setHours(settings.remindHour, settings.remindMinute, 0, 0);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>
      {/* 커스텀 헤더 */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color="#007AFF" />
          <Text style={s.backText}>MY</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>설정</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 알림 설정 ── */}
        <SectionLabel>알림 설정</SectionLabel>
        <Group>
          <Row
            label="일기 작성 리마인더"
            right={
              <Switch
                value={settings.remindOn}
                onValueChange={(v) => update('remindOn', v)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              />
            }
          />
          {settings.remindOn && (
            <>
              <Row
                label="리마인더 시간"
                right={
                  <ValueText>
                    {formatTime(settings.remindHour, settings.remindMinute)}
                  </ValueText>
                }
                onPress={() => setTimePickerVisible(true)}
              />
              <Row
                label="리마인더 메시지"
                sub={`"${settings.remindMessage}"`}
                onPress={() => setMessageModalVisible(true)}
              />
            </>
          )}
          <Row
            label="주간 감정 리포트"
            sub="매주 월요일 지난주 감정 요약"
            right={
              <Switch
                value={settings.weeklyReport}
                onValueChange={(v) => update('weeklyReport', v)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              />
            }
          />
          <Row
            label="스트릭 위기 알림"
            sub="연속 기록이 끊기기 전 리마인드"
            right={
              <Switch
                value={settings.streakAlert}
                onValueChange={(v) => update('streakAlert', v)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              />
            }
            last
          />
        </Group>

        {/* ── 보안 및 잠금 ── */}
        <SectionLabel>보안 및 잠금</SectionLabel>
        <Group>
          <Row
            label="앱 잠금"
            sub={settings.appLock ? `${biometricLabel}로 잠금 중` : '잠금 해제됨'}
            right={
              <Switch
                value={settings.appLock}
                onValueChange={async (v) => {
                  if (v) {
                    // 잠금 켤 때 PIN 설정 필수
                    const pinExists = await hasPinSet();
                    if (!pinExists) {
                      setPinIsChange(false);
                      setPinModalVisible(true);
                      return; // PIN 설정 완료 후에 토글 켜짐
                    }
                  }
                  update('appLock', v);
                }}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              />
            }
          />
          <Row label="PIN 변경" onPress={() => {
            setPinIsChange(true);
            setPinModalVisible(true);
          }} />
          <Row
            label="자동 잠금 시간"
            right={
              <ValueText>
                {AUTO_LOCK_OPTIONS.find(
                  (o) => o.value === settings.autoLockMinutes,
                )?.label || '1분'}
              </ValueText>
            }
            onPress={() => setAutoLockModalVisible(true)}
          />
          <Row
            label="일기 암호화"
            sub="AES-256 단말 내 암호화"
            right={
              <Switch
                value={settings.encryption}
                onValueChange={(v) => update('encryption', v)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              />
            }
          />
          <Row
            label="암호화 키 백업"
            sub="키 분실 시 복구 불가"
            onPress={() => {}}
            last
          />
        </Group>

        {/* ── 데이터 및 동기화 ── */}
        <SectionLabel>데이터 및 동기화</SectionLabel>
        <Group>
          <Row
            label="iCloud 동기화"
            sub={
              settings.sync
                ? '마지막 동기화: —'
                : '동기화가 꺼져 있습니다'
            }
            right={
              <Switch
                value={settings.sync}
                onValueChange={(v) => update('sync', v)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              />
            }
          />
          <Row label="지금 동기화" onPress={() => {}} />
          <Row
            label="데이터 내보내기"
            sub="JSON · PDF · 암호화 백업"
            onPress={() => {}}
          />
          <Row
            label="데이터 가져오기"
            sub="백업 파일에서 복원"
            onPress={() => {}}
          />
          <Row
            label="전체 데이터 삭제"
            danger
            onPress={confirmDeleteAll}
            last
          />
        </Group>

        {/* ── 구독 및 결제 ── */}
        <SectionLabel>구독 및 결제</SectionLabel>
        <Group>
          <Row label="현재 플랜" right={<Badge text="Free" />} />
          <Row
            label="프리미엄 업그레이드"
            sub="무제한 감정 분석, 고급 리포트, 커스텀 테마"
            onPress={() => {}}
          />
          <Row label="구매 복원" onPress={() => {}} last />
        </Group>

        {/* ── 앱 설정 ── */}
        <SectionLabel>앱 설정</SectionLabel>
        <Group>
          <Row
            label="글꼴 크기"
            right={<ValueText>{FONT_SIZE_LABEL[settings.fontSize]}</ValueText>}
            onPress={() => setFontSizeModalVisible(true)}
          />
          <Row
            label="캘린더 시작 요일"
            right={<ValueText>{WEEK_START_LABEL[settings.weekStart]}</ValueText>}
            onPress={() => setWeekStartModalVisible(true)}
            last
          />
        </Group>

        {/* ── 커스터마이징 ── */}
        <SectionLabel>커스터마이징</SectionLabel>
        <Group>
          <Row
            label="감정 컬러 팔레트"
            sub="프리미엄 구독 시 이용 가능"
            onPress={confirmPremiumOnly}
          />
          <Row
            label="감정 키워드 추가"
            sub="프리미엄 구독 시 이용 가능"
            onPress={confirmPremiumOnly}
            last
          />
        </Group>

        {/* ── 지원 및 정보 ── */}
        <SectionLabel>지원 및 정보</SectionLabel>
        <Group>
          <Row label="자주 묻는 질문" onPress={() => {}} />
          <Row label="피드백 보내기" onPress={() => {}} />
          <Row label="앱 평가하기" onPress={() => {}} />
          <Row label="개인정보 처리방침" onPress={() => {}} />
          <Row label="서비스 이용약관" onPress={() => {}} />
          <Row label="오픈소스 라이선스" onPress={() => {}} />
          <Row label="앱 버전" right={<ValueText>v1.0.0</ValueText>} last />
        </Group>

        {/* ── 로그아웃 / 탈퇴 ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <Group>
            <Row label="로그아웃" onPress={() => {}} last />
          </Group>
        </View>
        <View style={{ alignItems: 'center', paddingTop: 16 }}>
          <TouchableOpacity>
            <Text style={s.withdrawText}>회원 탈퇴</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Modals ── */}
      {timePickerVisible && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal
              visible={timePickerVisible}
              transparent
              animationType="slide"
            >
              <TouchableOpacity
                style={s.modalOverlay}
                activeOpacity={1}
                onPress={() => setTimePickerVisible(false)}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  style={s.pickerSheet}
                >
                  <View style={s.pickerHeader}>
                    <Text style={s.pickerTitle}>리마인더 시간</Text>
                    <TouchableOpacity
                      onPress={() => setTimePickerVisible(false)}
                    >
                      <Text style={s.pickerDone}>완료</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={reminderDate}
                    mode="time"
                    display="spinner"
                    onChange={handleTimeChange}
                    locale="ko-KR"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker
              value={reminderDate}
              mode="time"
              is24Hour={false}
              onChange={handleTimeChange}
            />
          )}
        </>
      )}

      <MessageEditModal
        visible={messageModalVisible}
        initialValue={settings.remindMessage}
        onSave={(v) => update('remindMessage', v)}
        onClose={() => setMessageModalVisible(false)}
      />

      <OptionPickerModal
        visible={autoLockModalVisible}
        title="자동 잠금 시간"
        options={AUTO_LOCK_OPTIONS}
        selected={settings.autoLockMinutes}
        onSelect={(v) => update('autoLockMinutes', v)}
        onClose={() => setAutoLockModalVisible(false)}
      />

      <OptionPickerModal
        visible={fontSizeModalVisible}
        title="글꼴 크기"
        options={[
          { value: 'small' as const, label: '작게' },
          { value: 'medium' as const, label: '보통' },
          { value: 'large' as const, label: '크게' },
        ]}
        selected={settings.fontSize}
        onSelect={(v) => update('fontSize', v)}
        onClose={() => setFontSizeModalVisible(false)}
      />

      <OptionPickerModal
        visible={weekStartModalVisible}
        title="캘린더 시작 요일"
        options={[
          { value: 'sunday' as const, label: '일요일' },
          { value: 'monday' as const, label: '월요일' },
        ]}
        selected={settings.weekStart}
        onSelect={(v) => update('weekStart', v)}
        onClose={() => setWeekStartModalVisible(false)}
      />

      <PinSetupModal
        visible={pinModalVisible}
        isChange={pinIsChange}
        onComplete={async (pin) => {
          await savePin(pin);
          setPinModalVisible(false);
          if (!settings.appLock) {
            update('appLock', true);
          }
          Alert.alert('완료', 'PIN이 설정되었습니다.');
        }}
        onClose={() => setPinModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // Header
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  // Sections
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 6,
    fontSize: 13,
    color: '#6C6C70',
    textTransform: 'uppercase',
  },
  group: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 17,
    color: '#000',
  },
  rowSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueText: {
    fontSize: 17,
    color: '#8E8E93',
  },

  // Badge
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  badgeText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Withdraw
  withdrawText: {
    fontSize: 15,
    color: '#FF3B30',
  },

  // Modals (common)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalTitle: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },

  // Message modal
  textInput: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    fontSize: 15,
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },

  // Time picker (iOS)
  pickerSheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    position: 'absolute',
    bottom: 0,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  pickerDone: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
});
