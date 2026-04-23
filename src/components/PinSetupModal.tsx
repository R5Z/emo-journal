import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ============================================
// Types
// ============================================

type Props = {
  visible: boolean;
  onComplete: (pin: string) => void;
  onClose: () => void;
  isChange?: boolean; // true면 "변경", false면 "설정"
};

type Step = 'enter' | 'confirm';

// ============================================
// Component
// ============================================

export default function PinSetupModal({
  visible,
  onComplete,
  onClose,
  isChange = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const reset = () => {
    setStep('enter');
    setFirstPin('');
    setPin('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
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

  const handleInput = (digit: string) => {
    if (pin.length >= 4) return;

    const next = pin + digit;
    setPin(next);
    setError('');

    if (next.length === 4) {
      if (step === 'enter') {
        // 첫 입력 → 확인 단계로
        setFirstPin(next);
        setStep('confirm');
        setTimeout(() => setPin(''), 200);
      } else {
        // 확인 단계 → 일치 여부 확인
        if (next === firstPin) {
          onComplete(next);
          reset();
        } else {
          triggerShake();
          setError('PIN이 일치하지 않습니다. 다시 입력해 주세요.');
          setTimeout(() => {
            setPin('');
            setStep('enter');
            setFirstPin('');
          }, 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={s.cancelText}>취소</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {isChange ? 'PIN 변경' : 'PIN 설정'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.content}>
          {/* 안내 텍스트 */}
          <View style={s.lockIcon}>
            <Ionicons name="keypad" size={32} color="#007AFF" />
          </View>
          <Text style={s.title}>
            {step === 'enter'
              ? '4자리 PIN을 입력해 주세요'
              : '한 번 더 입력해 주세요'}
          </Text>

          {/* PIN dots */}
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

          {/* Error */}
          {error !== '' && <Text style={s.errorText}>{error}</Text>}

          {/* Keypad */}
          <View style={s.keypad}>
            {keys.map((row, ri) => (
              <View key={ri} style={s.keyRow}>
                {row.map((key, ki) => {
                  if (key === '') {
                    return <View key={`empty-${ki}`} style={s.key} />;
                  }
                  if (key === 'del') {
                    return (
                      <TouchableOpacity
                        key={key}
                        style={s.key}
                        onPress={handleDelete}
                      >
                        <Ionicons
                          name="backspace-outline"
                          size={28}
                          color="#3C3C43"
                        />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={key}
                      style={s.key}
                      onPress={() => handleInput(key)}
                      activeOpacity={0.5}
                    >
                      <Text style={s.keyText}>{key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F2F2F7',
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
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
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
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
