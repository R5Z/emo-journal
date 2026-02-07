import { create } from 'zustand';
import dayjs from 'dayjs';

interface DateState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const useDateStore = create<DateState>((set) => ({
  // 초기값은 오늘 날짜
  selectedDate: dayjs().format('YYYY-MM-DD'),
  setSelectedDate: (date: string) => set({ selectedDate: date }),
}));