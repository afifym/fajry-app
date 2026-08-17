import notifee, { AndroidCategory, AndroidImportance, TriggerType } from '@notifee/react-native';
import * as Sentry from '@sentry/react-native';

import type { AdhanRecitation, AlarmDay, CalculationMethodKey, Location } from '@/types';
import {
  FAJR_ALARM_ID_PREFIX,
  SLEEP_ALARM_ID_PREFIX,
  SNOOZE_ALARM_ID,
  TEST_ALARM_ID,
} from '@/utils/alarmEvents';
import { buildAlarmSchedule } from './prayerTimes';
import { getTodayReflection } from './reflections';
import {
  CHANNEL_FAJR_ALARM,
  CHANNEL_SLEEP_REMINDER,
  CHANNEL_SNOOZE,
  setupNotifeeChannels,
} from './notifications';

const FAJR_PREFIX = FAJR_ALARM_ID_PREFIX;
const SLEEP_PREFIX = SLEEP_ALARM_ID_PREFIX;

export const TEST_ALARM_DELAY_MS = 5_000;

function alarmNotification(
  id: string,
  title: string,
  body: string,
  channelId: string,
) {
  return {
    id,
    title,
    body,
    android: {
      channelId,
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      asForegroundService: true,
      fullScreenAction: { id: 'default' },
      ongoing: true,
      autoCancel: false,
      pressAction: { id: 'default' },
    },
    ios: { sound: 'default' as const, critical: true },
  };
}

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

  await notifee.cancelTriggerNotification(SNOOZE_ALARM_ID);
  await notifee.createTriggerNotification(
    alarmNotification(
      SNOOZE_ALARM_ID,
      'Time for Fajr Prayer',
      'Snooze ended — rise and pray.',
      CHANNEL_SNOOZE,
    ),
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
  const reflection = getTodayReflection();

  for (const day of schedule) {
    if (day.alarmTime.getTime() <= now) continue; // already past

    await notifee.createTriggerNotification(
      alarmNotification(
        `${FAJR_PREFIX}${day.date}`,
        'Time for Fajr Prayer',
        reflection.text,
        CHANNEL_FAJR_ALARM,
      ),
      {
        type: TriggerType.TIMESTAMP,
        timestamp: day.alarmTime.getTime(),
        alarmManager: { allowWhileIdle: true },
      },
    );

    if (settings.sleepReminderEnabled) {
      const reminderAt = day.fajrTime.getTime() - settings.desiredSleepHours * 3_600_000;

      if (reminderAt > now) {
        await notifee.createTriggerNotification(
          alarmNotification(
            `${SLEEP_PREFIX}${day.date}`,
            'Time to sleep',
            reflection.text,
            CHANNEL_SLEEP_REMINDER,
          ),
          {
            type: TriggerType.TIMESTAMP,
            timestamp: reminderAt,
            alarmManager: { allowWhileIdle: true },
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

/** Schedules a test alarm using the same wake path as production Fajr alarms. */
export async function scheduleTestAlarm(): Promise<void> {
  await setupNotifeeChannels();
  await notifee.cancelTriggerNotification(TEST_ALARM_ID);

  await notifee.createTriggerNotification(
    alarmNotification(
      TEST_ALARM_ID,
      'Time for Fajr Prayer',
      'Test alarm — rise and pray.',
      CHANNEL_FAJR_ALARM,
    ),
    {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + TEST_ALARM_DELAY_MS,
      alarmManager: { allowWhileIdle: true },
    },
  );
}
