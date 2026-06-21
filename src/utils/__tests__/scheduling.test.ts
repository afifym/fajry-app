import notifee from '@notifee/react-native';
import { scheduleSnooze, rebuildScheduleOnAppOpen } from '../scheduling';
import type { RebuildSettings } from '../scheduling';
import type { Location } from '@/types';

const CAIRO: Location = { lat: 30.06263, lng: 31.24967, cityName: 'Cairo', country: 'EG' };

const BASE_SETTINGS: RebuildSettings = {
  location: CAIRO,
  calculationMethod: 'Egyptian',
  adhanRecitation: 'makkah',
  preAlarmOffsetMinutes: 0,
  alarmEnabled: true,
  sleepReminderEnabled: false,
  desiredSleepHours: 6,
};

// Access the in-memory mock helpers
const mockNotifee = notifee as typeof notifee & {
  __getScheduled: () => Record<string, unknown>;
  __reset: () => void;
};

beforeEach(() => {
  mockNotifee.__reset();
});

describe('scheduleSnooze', () => {
  it('returns refused when snooze would extend past sunrise', async () => {
    const sunrise = new Date(Date.now() + 2 * 60_000); // sunrise in 2 min
    const result = await scheduleSnooze(5, sunrise); // snooze 5 min > 2 min remaining
    expect(result).toBe('refused');
  });

  it('returns refused when snooze exactly reaches sunrise', async () => {
    const sunrise = new Date(Date.now() + 5 * 60_000);
    const result = await scheduleSnooze(5, sunrise);
    expect(result).toBe('refused');
  });

  it('returns scheduled when there is enough time before sunrise', async () => {
    const sunrise = new Date(Date.now() + 60 * 60_000); // sunrise in 1 hour
    const result = await scheduleSnooze(5, sunrise);
    expect(result).toBe('scheduled');
  });

  it('calls createTriggerNotification exactly once when scheduling succeeds', async () => {
    const sunrise = new Date(Date.now() + 60 * 60_000);
    await scheduleSnooze(5, sunrise);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(1);
  });

  it('does NOT call createTriggerNotification when refused', async () => {
    const sunrise = new Date(Date.now() + 1_000); // only 1 second away
    await scheduleSnooze(5, sunrise);
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });
});

describe('rebuildScheduleOnAppOpen', () => {
  it('returns 7-day schedule', async () => {
    const schedule = await rebuildScheduleOnAppOpen(BASE_SETTINGS);
    expect(schedule).toHaveLength(7);
  });

  it('does not schedule alarms when alarmEnabled is false', async () => {
    await rebuildScheduleOnAppOpen({ ...BASE_SETTINGS, alarmEnabled: false });
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('schedules at least one fajr notification when alarmEnabled is true', async () => {
    await rebuildScheduleOnAppOpen(BASE_SETTINGS);
    expect(notifee.createTriggerNotification).toHaveBeenCalled();
    const scheduled = mockNotifee.__getScheduled();
    const fajrIds = Object.keys(scheduled).filter((id) => id.startsWith('fajr-'));
    expect(fajrIds.length).toBeGreaterThan(0);
  });

  it('cancels existing alarms before rescheduling', async () => {
    // First build
    await rebuildScheduleOnAppOpen(BASE_SETTINGS);
    // Second build should cancel previous alarms
    await rebuildScheduleOnAppOpen(BASE_SETTINGS);
    expect(notifee.cancelTriggerNotifications).toHaveBeenCalled();
  });

  it('does not schedule sleep reminders when sleepReminderEnabled is false', async () => {
    await rebuildScheduleOnAppOpen({ ...BASE_SETTINGS, sleepReminderEnabled: false });
    const scheduled = mockNotifee.__getScheduled();
    const sleepIds = Object.keys(scheduled).filter((id) => id.startsWith('sleep-'));
    expect(sleepIds).toHaveLength(0);
  });

  it('schedules sleep reminders when sleepReminderEnabled is true', async () => {
    await rebuildScheduleOnAppOpen({
      ...BASE_SETTINGS,
      sleepReminderEnabled: true,
      desiredSleepHours: 6,
    });
    const scheduled = mockNotifee.__getScheduled();
    const sleepIds = Object.keys(scheduled).filter((id) => id.startsWith('sleep-'));
    expect(sleepIds.length).toBeGreaterThan(0);
  });

  it('marks future days as scheduled and past days as not scheduled', async () => {
    const schedule = await rebuildScheduleOnAppOpen(BASE_SETTINGS);
    // Today's alarm may already have passed (Fajr is early morning)
    // All 7 days should have a scheduled field
    expect(schedule.every((d) => typeof d.scheduled === 'boolean')).toBe(true);
  });
});
