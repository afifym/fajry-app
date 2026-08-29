import { useAlarmStore } from '@/store/alarmStore';
import { useConsistencyStore } from '@/store/consistencyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { resetAppFlow } from '../resetAppFlow';
import { uniqueUseDays, recordAppUse, resetStoreReviewState } from '../storeReview';
import { toISODate } from '../prayerTimes';

const CAIRO = { lat: 30.06, lng: 31.25, cityName: 'Cairo', country: 'EG' };

describe('resetAppFlow', () => {
  beforeEach(() => {
    resetStoreReviewState();
    useSettingsStore.getState().resetSettings();
    useConsistencyStore.getState().resetConsistency();
    useAlarmStore.getState().resetSchedule();
  });

  it('clears location and other setup so onboarding can run again', async () => {
    useSettingsStore.getState().setLocation(CAIRO);
    useSettingsStore.getState().setDesiredSleepHours(8);
    useSettingsStore.getState().setSleepReminderEnabled(true);
    useConsistencyStore.getState().confirm(toISODate(new Date()), true);
    useAlarmStore.getState().setSchedule([
      {
        date: '2024-01-15',
        fajrTime: new Date(2024, 0, 15, 5, 30),
        sunriseTime: new Date(2024, 0, 15, 6, 41),
        alarmTime: new Date(2024, 0, 15, 5, 30),
        scheduled: true,
      },
    ]);
    recordAppUse(new Date(2024, 0, 15));

    await resetAppFlow();

    const settings = useSettingsStore.getState();
    expect(settings.location).toBeNull();
    expect(settings.desiredSleepHours).toBe(6);
    expect(settings.sleepReminderEnabled).toBe(true);
    expect(useConsistencyStore.getState().streak).toBe(0);
    expect(useConsistencyStore.getState().confirmations).toEqual({});
    expect(useAlarmStore.getState().schedule).toEqual([]);
    expect(uniqueUseDays()).toBe(0);
  });
});
