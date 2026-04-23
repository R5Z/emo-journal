import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Storage Keys
// ============================================

const PIN_HASH_KEY = '@vhue_pin_hash';
const BACKGROUND_TIME_KEY = '@vhue_bg_time';

// ============================================
// PIN 관리
// ============================================

/** PIN을 SHA-256 해시로 변환 */
async function hashPin(pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin,
  );
}

/** PIN 저장 */
export async function savePin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await AsyncStorage.setItem(PIN_HASH_KEY, hash);
}

/** PIN 검증 */
export async function verifyPin(pin: string): Promise<boolean> {
  const savedHash = await AsyncStorage.getItem(PIN_HASH_KEY);
  if (!savedHash) return false;
  const inputHash = await hashPin(pin);
  return inputHash === savedHash;
}

/** PIN 존재 여부 */
export async function hasPinSet(): Promise<boolean> {
  const hash = await AsyncStorage.getItem(PIN_HASH_KEY);
  return hash !== null;
}

/** PIN 삭제 */
export async function removePin(): Promise<void> {
  await AsyncStorage.removeItem(PIN_HASH_KEY);
}

// ============================================
// 생체인증
// ============================================

/** 생체인증 사용 가능 여부 */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/** 생체인증 타입 (Face ID / Touch ID) 조회 */
export async function getBiometricType(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID';
  }
  return '생체인증';
}

/** 생체인증 실행 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: '잠금 해제',
      cancelLabel: 'PIN 입력',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}

// ============================================
// 백그라운드 시간 추적
// ============================================

/** 백그라운드 전환 시각 저장 */
export async function saveBackgroundTime(): Promise<void> {
  await AsyncStorage.setItem(BACKGROUND_TIME_KEY, Date.now().toString());
}

/** 백그라운드 경과 시간(분) 계산 후 저장값 삭제 */
export async function getBackgroundElapsedMinutes(): Promise<number> {
  const raw = await AsyncStorage.getItem(BACKGROUND_TIME_KEY);
  await AsyncStorage.removeItem(BACKGROUND_TIME_KEY);
  if (!raw) return 0;
  const elapsed = (Date.now() - parseInt(raw, 10)) / 60000;
  return elapsed;
}

/** 잠금 필요 여부 판단 */
export async function shouldLock(autoLockMinutes: number): Promise<boolean> {
  const elapsed = await getBackgroundElapsedMinutes();
  // autoLockMinutes === 0 이면 "즉시"
  return elapsed >= autoLockMinutes;
}