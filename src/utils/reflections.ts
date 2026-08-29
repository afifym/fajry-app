import { createMMKV } from 'react-native-mmkv';

import reflectionsData from '@/assets/reflections.json';
import { toISODate } from './prayerTimes';
import type { Reflection } from '@/types';

const reflections = reflectionsData as Reflection[];
const storage = createMMKV({ id: 'reflections' });

const REFLECTION_INDEX_KEY = 'reflectionIndex';
const REFLECTION_DATE_KEY = 'reflectionDate';

export function resetReflectionState(): void {
  storage.remove(REFLECTION_INDEX_KEY);
  storage.remove(REFLECTION_DATE_KEY);
}

export function getTodayReflection(): Reflection {
  const today = toISODate(new Date());
  const lastDate = storage.getString(REFLECTION_DATE_KEY);

  let index: number;

  if (lastDate === today) {
    const rawIndex = storage.getString(REFLECTION_INDEX_KEY);
    index = rawIndex !== undefined ? parseInt(rawIndex, 10) : 0;
  } else {
    // New day — advance to the next reflection, wrap at end of cycle
    const rawIndex = storage.getString(REFLECTION_INDEX_KEY);
    const prev = rawIndex !== undefined ? parseInt(rawIndex, 10) : -1;
    index = (prev + 1) % reflections.length;
    storage.set(REFLECTION_INDEX_KEY, String(index));
    storage.set(REFLECTION_DATE_KEY, today);
  }

  return reflections[index] ?? reflections[0];
}
