import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AlarmDay } from '@/types';

const mmkv = createMMKV({ id: 'alarm' });

const mmkvStorage = createJSONStorage<AlarmState>(() => ({
  setItem: (key, value) => mmkv.set(key, value),
  getItem: (key) => mmkv.getString(key) ?? null,
  removeItem: (key) => mmkv.remove(key),
}));

export type AlarmState = {
  schedule: AlarmDay[];
  setSchedule: (schedule: AlarmDay[]) => void;
  markScheduled: (date: string) => void;
  resetSchedule: () => void;
};

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set) => ({
      schedule: [],
      setSchedule: (schedule) => set({ schedule }),
      markScheduled: (date) =>
        set((state) => ({
          schedule: state.schedule.map((day) =>
            day.date === date ? { ...day, scheduled: true } : day,
          ),
        })),
      resetSchedule: () => set({ schedule: [] }),
    }),
    { name: 'alarm', storage: mmkvStorage },
  ),
);
