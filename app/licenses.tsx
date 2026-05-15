import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/store/useThemeStore';

// ============================================
// 라이선스 데이터 (주요 라이브러리)
// ============================================

const LICENSES = [
  { name: 'React Native', license: 'MIT', url: 'https://github.com/facebook/react-native' },
  { name: 'Expo', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Router', license: 'MIT', url: 'https://github.com/expo/router' },
  { name: 'Expo SQLite', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Image', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Notifications', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Local Authentication', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Linear Gradient', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo File System', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Image Picker', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Expo Crypto', license: 'MIT', url: 'https://github.com/expo/expo' },
  { name: 'Zustand', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
  { name: 'Day.js', license: 'MIT', url: 'https://github.com/iamkun/dayjs' },
  { name: 'AsyncStorage', license: 'MIT', url: 'https://github.com/react-native-async-storage/async-storage' },
  { name: 'React Native Safe Area Context', license: 'MIT', url: 'https://github.com/th3rdwave/react-native-safe-area-context' },
  { name: 'DateTimePicker', license: 'MIT', url: 'https://github.com/react-native-datetimepicker/datetimepicker' },
];

// ============================================
// Licenses Screen
// ============================================

export default function LicensesScreen() {
  const router = useRouter();
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
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>오픈소스 라이선스</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.description, { color: colors.textTertiary }]}>
          이 앱은 아래의 오픈소스 라이브러리를 사용하고 있습니다.
        </Text>

        <View style={[s.group, { backgroundColor: colors.backgroundCard }]}>
          {LICENSES.map((lib, i) => (
            <TouchableOpacity
              key={lib.name}
              style={[s.row, i < LICENSES.length - 1 && s.rowBorder, i < LICENSES.length - 1 && { borderBottomColor: colors.separator }]}
              onPress={() => Linking.openURL(lib.url)}
              activeOpacity={0.6}
            >
              <View style={s.rowLeft}>
                <Text style={[s.libName, { color: colors.textPrimary }]}>{lib.name}</Text>
                <Text style={[s.libLicense, { color: colors.textTertiary }]}>{lib.license} License</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.separator} />
            </TouchableOpacity>
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
  description: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    fontSize: 13,
    color: '#8E8E93',
  },
  group: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  rowLeft: {
    flex: 1,
  },
  libName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  libLicense: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});
