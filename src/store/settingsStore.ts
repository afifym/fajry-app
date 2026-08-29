import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { inferRegionalDefault } from '@/utils/location';
import type { AdhanRecitation, CalculationMethodKey, Location } from '@/types';

const mmkv = createMMKV({ id: 'settings' });

const mmkvStorage = createJSONStorage<SettingsState>(() => ({
  setItem: (key, value) => mmkv.set(key, value),
  getItem: (key) => mmkv.getString(key) ?? null,
  removeItem: (key) => mmkv.remove(key),
}));

export type SettingsState = {
  calculationMethod: CalculationMethodKey;
  adhanRecitation: AdhanRecitation;
  snoozeDurationMinutes: number;
  preAlarmOffsetMinutes: number;
  location: Location | null;
  alarmEnabled: boolean;
  sleepReminderEnabled: boolean;
  desiredSleepHours: number;

  setCalculationMethod: (method: CalculationMethodKey) => void;
  setAdhanRecitation: (recitation: AdhanRecitation) => void;
  setSnoozeDuration: (minutes: number) => void;
  setPreAlarmOffset: (minutes: number) => void;
  setLocation: (location: Location) => void;
  setAlarmEnabled: (enabled: boolean) => void;
  setSleepReminderEnabled: (enabled: boolean) => void;
  setDesiredSleepHours: (hours: number) => void;
  resetSettings: () => void;
};

const SETTINGS_DEFAULTS = {
  calculationMethod: inferRegionalDefault('') as CalculationMethodKey,
  adhanRecitation: 'makkah' as AdhanRecitation,
  snoozeDurationMinutes: 5,
  preAlarmOffsetMinutes: 0,
  location: null as Location | null,
  alarmEnabled: true,
  sleepReminderEnabled: true,
  desiredSleepHours: 6,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...SETTINGS_DEFAULTS,

      setCalculationMethod: (method) => set({ calculationMethod: method }),
      setAdhanRecitation: (recitation) => set({ adhanRecitation: recitation }),
      setSnoozeDuration: (minutes) => set({ snoozeDurationMinutes: minutes }),
      setPreAlarmOffset: (minutes) => set({ preAlarmOffsetMinutes: minutes }),
      setLocation: (location) => set({ location }),
      setAlarmEnabled: (enabled) => set({ alarmEnabled: enabled }),
      setSleepReminderEnabled: (enabled) => set({ sleepReminderEnabled: enabled }),
      setDesiredSleepHours: (hours) => set({ desiredSleepHours: hours }),
      resetSettings: () => set({ ...SETTINGS_DEFAULTS }),
    }),
    { name: 'settings', storage: mmkvStorage },
  ),
);
