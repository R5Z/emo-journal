import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../store/useThemeStore';
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
  getBiometricType,
  verifyPin,
  hasPinSet,
} from '../lib/appLock';

// ============================================
// Types
// ============================================

type Props = {
  onUnlock: () => void;
};

type Mode = 'biometric' | 'pin';

// ============================================
// Component
// ============================================

export default function LockScreen({ onUnlock }: Props) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>('biometric');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [biometricType, setBiometricType] = useState('Face ID');
  const [hasBiometric, setHasBiometric] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkAuthMethods();
  }, []);

  const checkAuthMethods = async () => {
    const [bioAvail, bioType, pinSet] = await Promise.all([
      isBiometricAvailable(),
      getBiometricType(),
      hasPinSet(),
    ]);
    setHasBiometric(bioAvail);
    setBiometricType(bioType);
    setHasPin(pinSet);

    // 생체인증 가능하면 자동 시도
    if (bioAvail) {
      setMode('biometric');
      attemptBiometric();
    } else if (pinSet) {
      setMode('pin');
    } else {
      // PIN도 없고 생체인증도 없으면 잠금 해제
      onUnlock();
    }
  };

  const attemptBiometric = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      onUnlock();
    } else {
      // 생체인증 실패 → PIN이 설정되어 있으면 PIN으로 전환
      const pinSet = await hasPinSet();
      if (pinSet) {
        setMode('pin');
        setError(`${biometricType} 인증 실패. PIN을 입력해 주세요.`);
      } else {
        setError(`${biometricType} 인증 실패. 다시 시도해 주세요.`);
      }
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length >= 4) return;

    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === 4) {
      verifyPinInput(next);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const verifyPinInput = async (inputPin: string) => {
    const valid = await verifyPin(inputPin);
    if (valid) {
      onUnlock();
    } else {
      // 틀린 PIN → 흔들기 애니메이션 + 초기화
      triggerShake();
      setError('PIN이 올바르지 않습니다.');
      setTimeout(() => setPin(''), 300);
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // ── PIN Pad Keys ──
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['bio', '0', 'del'],
  ];

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={s.content}>
        {/* 아이콘 */}
        <View style={[s.lockIcon, { backgroundColor: colors.tintBackground }]}>
          <Ionicons
            name={mode === 'biometric' ? 'lock-closed' : 'keypad'}
            size={32}
            color={colors.tint}
          />
        </View>

        {/* 안내 텍스트 */}
        <Text style={[s.title, { color: colors.textPrimary }]} accessibilityRole="header">
          {mode === 'biometric'
            ? `${biometricType}로 잠금 해제`
            : 'PIN 입력'}
        </Text>

        {/* PIN 도트 (PIN 모드일 때만) */}
        {mode === 'pin' && (
          <Animated.View
            style={[
              s.dotsRow,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  pin.length > i ? s.dotFilled : s.dotEmpty,
                ]}
              />
            ))}
          </Animated.View>
        )}

        {/* 에러 메시지 */}
        {error !== '' && <Text style={[s.errorText, { color: colors.danger }]} accessibilityRole="text">{error}</Text>}

        {/* 생체인증 모드: 재시도 + PIN 전환 버튼 */}
        {mode === 'biometric' && (
          <View style={s.biometricActions}>
            <TouchableOpacity
              style={s.biometricButton}
              onPress={attemptBiometric}
              accessibilityRole="button"
              accessibilityLabel="생체인증으로 잠금 해제"
            >
              <Ionicons
                name="finger-print"
                size={48}
                color={colors.tint}
              />
                <Text style={[s.biometricButtonText, { color: colors.tint }]}>다시 시도</Text>
            </TouchableOpacity>
            {hasPin && (
              <TouchableOpacity
                style={s.switchButton}
                onPress={() => {
                  setMode('pin');
                  setError('');
                }}
                accessibilityRole="button"
                accessibilityLabel="PIN으로 입력"
              >
                <Text style={[s.switchText, { color: colors.textTertiary }]}>PIN으로 입력</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* PIN 입력 패드 */}
        {mode === 'pin' && (
          <View style={s.keypad}>
            {keys.map((row, ri) => (
              <View key={ri} style={s.keyRow}>
                {row.map((key) => {
                  if (key === 'bio') {
                    return hasBiometric ? (
                      <TouchableOpacity
                        key={key}
                        style={s.key}
                        onPress={() => {
                          setMode('biometric');
                          setPin('');
                          setError('');
                          attemptBiometric();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="생체인증으로 잠금 해제"
                      >
                        <Ionicons
                          name="finger-print"
                          size={28}
                          color={colors.tint}
                        />
                      </TouchableOpacity>
                    ) : (
                      <View key={key} style={s.key} />
                    );
                  }
                  if (key === 'del') {
                    return (
                      <TouchableOpacity
                        key={key}
                        style={s.key}
                        onPress={handleDelete}
                        accessibilityRole="button"
                        accessibilityLabel="뒤로 삭제"
                      >
                        <Ionicons
                          name="backspace-outline"
                          size={28}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={key}
                      style={s.key}
                      onPress={() => handlePinInput(key)}
                      activeOpacity={0.5}
                      accessibilityRole="button"
                      accessibilityLabel={`숫자 ${key}`}
                    >
                      <Text style={[s.keyText, { color: colors.textPrimary }]}>{key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ============================================
// Styles
// ============================================

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Lock icon
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  // Title
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
  },

  // PIN dots
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotEmpty: {
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#007AFF',
  },

  // Error
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Biometric mode
  biometricActions: {
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  biometricButton: {
    alignItems: 'center',
    gap: 8,
  },
  biometricButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  switchButton: {
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 15,
    color: '#8E8E93',
  },

  // PIN keypad
  keypad: {
    marginTop: 16,
    width: '100%',
    maxWidth: 280,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#000',
  },
});
