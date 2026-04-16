import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ============================================
// 알림 핸들러 설정
// ============================================

// 앱이 포그라운드에 있을 때도 알림을 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ============================================
// 권한 요청
// ============================================

/**
 * 알림 권한 요청
 * @returns 권한 승인 여부
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    // 시뮬레이터에서도 로컬 알림은 동작하지만, 권한 체크를 위해 true 반환
    console.log('시뮬레이터: 알림 권한 자동 승인');
    return true;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#007AFF',
    });
  }

  return finalStatus === 'granted';
}

// ============================================
// 리마인더 스케줄링
// ============================================

const REMINDER_IDENTIFIER = 'daily-reminder';

/**
 * 매일 반복되는 리마인더 알림 예약
 * @param hour 0-23
 * @param minute 0-59
 * @param message 알림 본문
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  message: string,
): Promise<boolean> {
  // 기존 리마인더 취소
  await cancelDailyReminder();

  const granted = await requestNotificationPermissions();
  if (!granted) {
    console.log('알림 권한이 거부되었습니다.');
    return false;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: '오늘의 기록',
        body: message,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
    console.log(`리마인더 예약: 매일 ${hour}:${String(minute).padStart(2, '0')}`);
    return true;
  } catch (error) {
    console.error('리마인더 예약 실패:', error);
    return false;
  }
}

/**
 * 리마인더 취소
 */
export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
  } catch {
    // 예약된 알림이 없으면 무시
  }
}

// ============================================
// 디버그: 즉시 테스트 알림
// ============================================

/**
 * 3초 후 테스트 알림 발송 (디버그용)
 */
export async function sendTestNotification(message: string): Promise<boolean> {
  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '테스트 알림',
        body: message,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    });
    return true;
  } catch (error) {
    console.error('테스트 알림 실패:', error);
    return false;
  }
}

// ============================================
// 예약된 알림 조회 (디버그용)
// ============================================

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}