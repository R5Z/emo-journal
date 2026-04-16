import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// 프로필 저장/로드
// ============================================

const PROFILE_KEY = '@vhue_profile';

export type Profile = {
  nickname: string;
  avatarType: 'emoji' | 'image';
  avatarEmoji: string;
  avatarImageUri: string | null;
};

export const DEFAULT_PROFILE: Profile = {
  nickname: '뷰러',
  avatarType: 'emoji',
  avatarEmoji: '🌈',
  avatarImageUri: null,
};

export async function loadProfile(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load profile:', e);
  }
  return DEFAULT_PROFILE;
}

export async function saveProfile(profile: Profile) {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}

// ============================================
// 이모지 후보
// ============================================

const EMOJI_OPTIONS = [
  '🌿', '🌱', '🌸', '🌼', '🌷', '🌻',
  '🌙', '⭐', '☁️', '🌈', '🔥', '✨',
  '🐣', '🐥', '🐻', '🐰', '🦊', '🐨',
  '🍀', '🍃', '🌊', '🌞', '🌚', '💫',
];

// ============================================
// Component
// ============================================

type Props = {
  visible: boolean;
  initialProfile: Profile;
  onSave: (profile: Profile) => void;
  onClose: () => void;
};

export default function ProfileEditModal({
  visible,
  initialProfile,
  onSave,
  onClose,
}: Props) {
  const [nickname, setNickname] = useState(initialProfile.nickname);
  const [avatarType, setAvatarType] = useState<Profile['avatarType']>(
    initialProfile.avatarType,
  );
  const [avatarEmoji, setAvatarEmoji] = useState(initialProfile.avatarEmoji);
  const [avatarImageUri, setAvatarImageUri] = useState<string | null>(
    initialProfile.avatarImageUri,
  );

  // 모달이 열릴 때마다 초기값 재설정
  useEffect(() => {
    if (visible) {
      setNickname(initialProfile.nickname);
      setAvatarType(initialProfile.avatarType);
      setAvatarEmoji(initialProfile.avatarEmoji);
      setAvatarImageUri(initialProfile.avatarImageUri);
    }
  }, [visible, initialProfile]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        '권한 필요',
        '사진을 선택하려면 갤러리 접근 권한이 필요합니다.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarImageUri(result.assets[0].uri);
      setAvatarType('image');
    }
  };

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      Alert.alert('알림', '닉네임을 입력해 주세요.');
      return;
    }
    if (trimmed.length > 20) {
      Alert.alert('알림', '닉네임은 20자 이내로 입력해 주세요.');
      return;
    }

    const profile: Profile = {
      nickname: trimmed,
      avatarType,
      avatarEmoji,
      avatarImageUri: avatarType === 'image' ? avatarImageUri : null,
    };
    onSave(profile);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* 헤더 */}
          <View style={s.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.headerCancel}>취소</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>프로필 편집</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={s.headerSave}>저장</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* 아바타 미리보기 */}
            <View style={s.avatarPreviewWrap}>
                {avatarType === 'image' && avatarImageUri ? (
                <Image
                    source={{ uri: avatarImageUri }}
                    style={{ width: 100, height: 100, borderRadius: 50 }}
                />
                ) : (
                <View style={s.avatarPreview}>
                    <Text style={s.avatarPreviewEmoji}>{avatarEmoji}</Text>
                </View>
                )}
              <TouchableOpacity
                style={s.imagePickerButton}
                onPress={handlePickImage}
              >
                <Ionicons name="image-outline" size={18} color="#007AFF" />
                <Text style={s.imagePickerText}>
                  {avatarImageUri ? '사진 변경' : '사진 선택'}
                </Text>
              </TouchableOpacity>
              {avatarType === 'image' && (
                <TouchableOpacity
                  style={s.resetButton}
                  onPress={() => {
                    setAvatarType('emoji');
                    setAvatarImageUri(null);
                  }}
                >
                  <Text style={s.resetText}>이모지로 돌아가기</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 닉네임 */}
            <Text style={s.sectionLabel}>닉네임</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
                placeholder="닉네임 (최대 20자)"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* 이모지 선택 (이미지가 아닐 때만) */}
            {avatarType === 'emoji' && (
              <>
                <Text style={s.sectionLabel}>이모지 선택</Text>
                <View style={s.emojiGrid}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        s.emojiItem,
                        avatarEmoji === emoji && s.emojiItemActive,
                      ]}
                      onPress={() => setAvatarEmoji(emoji)}
                    >
                      <Text style={s.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// Styles
// ============================================

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '85%',
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerCancel: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerSave: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },

  // Avatar preview
  avatarPreviewWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewEmoji: {
    fontSize: 48,
  },
  avatarPreviewImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  imagePickerText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  resetButton: {
    marginTop: 8,
  },
  resetText: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Section
  sectionLabel: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: 13,
    color: '#6C6C70',
    textTransform: 'uppercase',
  },
  inputWrap: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    color: '#000',
  },

  // Emoji grid
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
  },
  emojiItem: {
    width: '16.66%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  emojiItemActive: {
    backgroundColor: '#E5F0FF',
  },
  emojiText: {
    fontSize: 28,
  },
});
