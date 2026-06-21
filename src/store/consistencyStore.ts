import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { toISODate } from '@/utils/prayerTimes';
import type { PrayerConfirmation } from '@/types';

const mmkv = createMMKV({ id: 'consistency' });

const mmkvStorage = createJSONStorage<ConsistencyState>(() => ({
  setItem: (key, value) => mmkv.set(key, value),
  getItem: (key) => mmkv.getString(key) ?? null,
  removeItem: (key) => mmkv.remove(key),
}));

const EDITABLE_WINDOW_DAYS = 7;

export type ConsistencyState = {
  confirmations: Record<string, PrayerConfirmation>;

  // Derived: consecutive days with any confirmation ending today or in the past
  streak: number;

  confirm: (date: string, isOnTime: boolean) => void;
  toggleConfirmation: (date: string, sunriseTime: Date) => void;
  computeStreak: () => void;
};

function computeStreakFromConfirmations(
  confirmations: Record<string, PrayerConfirmation>,
): number {
  const today = toISODate(new Date());
  let streak = 0;
  let cursor = today;

  // Walk backwards day by day until we find a gap
  for (let i = 0; i < 365; i++) {
    const record = confirmations[cursor];
    if (!record || record.confirmedAt === null) break;
    streak++;
    // Decrement cursor by one day
    const d = new Date(cursor + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    cursor = toISODate(d);
  }

  return streak;
}

export const useConsistencyStore = create<ConsistencyState>()(
  persist(
    (set) => ({
      confirmations: {},
      streak: 0,

      confirm: (date, isOnTime) => {
        set((state) => {
          const updated: Record<string, PrayerConfirmation> = {
            ...state.confirmations,
            [date]: { date, confirmedAt: new Date(), isOnTime },
          };
          return {
            confirmations: updated,
            streak: computeStreakFromConfirmations(updated),
          };
        });
      },

      toggleConfirmation: (date, sunriseTime) => {
        const today = toISODate(new Date());
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - EDITABLE_WINDOW_DAYS);
        const cutoff = toISODate(cutoffDate);

        if (date < cutoff) return; // outside 7-day edit window — no-op

        set((state) => {
          const existing = state.confirmations[date];
          let updated: Record<string, PrayerConfirmation>;

          if (existing?.confirmedAt != null) {
            // Toggle off
            updated = {
              ...state.confirmations,
              [date]: { date, confirmedAt: null, isOnTime: false },
            };
          } else {
            // Toggle on — late if toggling a past day or after sunrise
            const isOnTime = date === today && new Date() < sunriseTime;
            updated = {
              ...state.confirmations,
              [date]: { date, confirmedAt: new Date(), isOnTime },
            };
          }

          return {
            confirmations: updated,
            streak: computeStreakFromConfirmations(updated),
          };
        });
      },

      computeStreak: () => {
        set((state) => ({
          streak: computeStreakFromConfirmations(state.confirmations),
        }));
      },
    }),
    { name: 'consistency', storage: mmkvStorage },
  ),
);
