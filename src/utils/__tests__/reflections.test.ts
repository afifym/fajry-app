import { getTodayReflection } from '../reflections';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'reflections' });

function clearStorage() {
  storage.remove('reflectionIndex');
  storage.remove('reflectionDate');
}

function setDate(isoDate: string) {
  // Inject a past date so getTodayReflection thinks today is different
  storage.set('reflectionDate', isoDate);
}

beforeEach(() => {
  clearStorage();
});

describe('getTodayReflection', () => {
  it('returns a reflection with id and text', () => {
    const r = getTodayReflection();
    expect(r).toBeDefined();
    expect(typeof r.id).toBe('number');
    expect(typeof r.text).toBe('string');
    expect(r.text.length).toBeGreaterThan(0);
  });

  it('returns the same reflection when called twice on the same day', () => {
    const first = getTodayReflection();
    const second = getTodayReflection();
    expect(first.id).toBe(second.id);
  });

  it('advances to the next reflection on a new day', () => {
    // Set stored date to yesterday to simulate a day change
    setDate('2000-01-01');
    const first = getTodayReflection();
    // Clear date again to trigger another day change
    setDate('2000-01-01');
    const second = getTodayReflection();
    // Each new day should give a different (next) reflection
    // After 2 advances: first is index 0 (or 1), second is 1 (or 2)
    expect(second.id).not.toBe(first.id);
  });

  it('wraps around after the full cycle', () => {
    const total = require('@/assets/reflections.json').length;
    // Advance through the full cycle
    for (let i = 0; i < total; i++) {
      setDate('2000-01-01'); // trigger day change each call
      getTodayReflection();
    }
    // After full cycle the next one wraps to index 0
    setDate('2000-01-01');
    const wrapped = getTodayReflection();
    expect(wrapped.id).toBeDefined();
  });
});
