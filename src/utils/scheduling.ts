import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';

import type { AdhanRecitation, AlarmDay, CalculationMethodKey, Location } from '@/types';
import { buildAlarmSchedule } from './prayerTimes';
import { getTodayReflection } from './reflections';
import {
  CHANNEL_FAJR_ALARM,
  CHANNEL_SLEEP_REMINDER,
  CHANNEL_SNOOZE,
  setupNotifeeChannels,
} from './notifications';

const FAJR_PREFIX = 'fajr-';
const SLEEP_PREFIX = 'sleep-';
const SNOOZE_ID = 'snooze-current';

export type RebuildSettings = {
  location: Location;
  calculationMethod: CalculationMethodKey;
  adhanRecitation: AdhanRecitation;
  preAlarmOffsetMinutes: number;
  alarmEnabled: boolean;
  sleepReminderEnabled: boolean;
  desiredSleepHours: number;
};

async function cancelFajrAndSleepAlarms(): Promise<void> {
  const ids = await notifee.getTriggerNotificationIds();
  const toCancel = ids.filter((id) => id.startsWith(FAJR_PREFIX) || id.startsWith(SLEEP_PREFIX));
  if (toCancel.length > 0) {
    await notifee.cancelTriggerNotifications(toCancel);
  }
}

export async function scheduleSnooze(
  snoozeDurationMinutes: number,
  sunriseTime: Date,
): Promise<'scheduled' | 'refused'> {
  const wakeAt = new Date(Date.now() + snoozeDurationMinutes * 60_000);
  if (wakeAt >= sunriseTime) return 'refused';

  await notifee.cancelTriggerNotification(SNOOZE_ID);
  await notifee.createTriggerNotification(
    {
      id: SNOOZE_ID,
      title: 'Time for Fajr Prayer',
      body: 'Snooze ended — rise and pray.',
      android: {
        channelId: CHANNEL_SNOOZE,
        importance: AndroidImportance.HIGH,
        asForegroundService: true,
      },
      ios: { sound: 'default' },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: wakeAt.getTime(),
      alarmManager: { allowWhileIdle: true },
    },
  );

  return 'scheduled';
}

export async function rebuildScheduleOnAppOpen(
  settings: RebuildSettings,
): Promise<AlarmDay[]> {
  await setupNotifeeChannels();
  await cancelFajrAndSleepAlarms();

  const schedule = buildAlarmSchedule(
    settings.location,
    settings.calculationMethod,
    settings.preAlarmOffsetMinutes,
  );

  if (!settings.alarmEnabled) {
    Sentry.addBreadcrumb({
      category: 'alarm',
      message: 'Alarm schedule rebuilt — 0 alarm(s) scheduled (alarm disabled)',
      level: 'info',
    });
    return schedule;
  }

  const now = Date.now();

  for (const day of schedule) {
    if (day.alarmTime.getTime() <= now) continue; // already past

    await notifee.createTriggerNotification(
      {
        id: `${FAJR_PREFIX}${day.date}`,
        title: 'Time for Fajr Prayer',
        body: 'Answer the call.',
        android: {
          channelId: CHANNEL_FAJR_ALARM,
          importance: AndroidImportance.HIGH,
          asForegroundService: Platform.OS === 'android',
        },
        ios: { sound: 'default', critical: true },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: day.alarmTime.getTime(),
        alarmManager: { allowWhileIdle: true },
      },
    );

    if (settings.sleepReminderEnabled) {
      const reminderAt = day.fajrTime.getTime() - settings.desiredSleepHours * 3_600_000;

      if (reminderAt > now) {
        const reflection = getTodayReflection();
        await notifee.createTriggerNotification(
          {
            id: `${SLEEP_PREFIX}${day.date}`,
            title: 'Time to sleep',
            body: reflection.text,
            android: { channelId: CHANNEL_SLEEP_REMINDER },
            ios: { sound: 'default' },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: reminderAt,
          },
        );
      }
    }
  }

  const result = schedule.map((day) => ({
    ...day,
    scheduled: day.alarmTime.getTime() > now,
  }));

  const scheduledCount = result.filter((d) => d.scheduled).length;
  Sentry.addBreadcrumb({
    category: 'alarm',
    message: `Alarm schedule rebuilt — ${scheduledCount} alarm(s) scheduled`,
    level: 'info',
  });

  return result;
}
