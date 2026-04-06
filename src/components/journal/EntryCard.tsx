import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { JournalEntry } from '../../types';
import { getEmotionDisplay } from '../../domain/emotion/formatter';
import { deleteEntry } from '../../services/storage';

interface Props {
  entry: JournalEntry;
  onRefresh: () => void; // 부모 컴포넌트 새로고침용
}

export default function EntryCard({ entry, onRefresh }: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const { colors } = getEmotionDisplay(entry.emotionResult);
  const router = useRouter();
  
  // 시간 추출 (YYYY-MM-DD HH:mm:ss -> HH:mm)
  const timeStr = entry.createdAt.split(' ')[1].substring(0, 5);

  const handleEdit = () => {
    setMenuVisible(false);

    // entry.createdAt (예: "2026-01-18 14:30:00")에서 날짜만 잘라냄
    const entryDate = entry.createdAt.split(' ')[0];

    // 에디터 페이지로 이동하며 '날짜' 파라미터도 함께 전달
    router.push({
      pathname: '/editor',
      params: { 
        id: entry.id, 
        content: entry.content,
        selectedDate: entryDate // 수정 후 제자리
      }
  });
};

  const handleDelete = async () => {
    setMenuVisible(false); // 메뉴 모달 닫기

    Alert.alert(
    "일기 삭제", // 제목
    "정말 삭제하시겠습니까? 삭제된 일기는 복구할 수 없습니다.", // 메시지
    [
      {
        text: "취소",
        style: "cancel" // iOS에서 취소 버튼 스타일 적용
      },
      {
        text: "삭제",
        style: "destructive", // iOS에서 빨간색 버튼 스타일 적용
        onPress: async () => {
          // 사용자가 '삭제'를 눌렀을 때만 실제 DB 삭제 실행
          try {
            await deleteEntry(entry.id!);
            onRefresh(); 
            console.log("✅ 삭제 성공");
          } catch (error) {
            console.error("삭제 실패:", error);
            Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
          }
        }
      }
    ]
  );
};

  return (
    <View style={styles.card}>
      {/* 좌측 감정 색상 표시 바 */}
      <View style={[styles.indicator, { backgroundColor: colors[0] || '#E5E5EA' }]} />
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.timeText}>{timeStr}</Text>
          
          {/* 세로 더보기 버튼 (⋮) */}
          <TouchableOpacity 
            onPress={() => setMenuVisible(true)} 
            style={styles.moreButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 터치 영역 확장
          >
            <Text style={styles.moreButtonText}>{'\u22EE'}</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.contentText}>{entry.content}</Text>
      </View>

      {/* 우측 정렬 커스텀 모달 */}
      <Modal
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
        animationType="fade"
      >
        {/* 모달 바깥쪽 클릭 시 닫기 */}
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.menuContent}>
              <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                <Text style={styles.menuText}>수정하기</Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <Text style={[styles.menuText, { color: '#FF3B30' }]}>삭제하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden', // 내부 indicator가 넘치지 않게
  },
  indicator: {
    width: 5,
  },
  cardContent: {
    padding: 16,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  moreButton: {
    paddingHorizontal: 4,
  },
  moreButtonText: {
    color: '#C7C7CC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  
  // 모달 관련 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)', // 배경을 아주 살짝 어둡게
    justifyContent: 'flex-start',
    alignItems: 'flex-end', // 우측 정렬
  },
  menuContent: {
    marginTop: 180, // 위크바 아래로 오도록 조정 (후에 기기별로 미세조정 필요할 수 있음)
    marginRight: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 130,
    // 그림자 효과
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#000',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
  },
});