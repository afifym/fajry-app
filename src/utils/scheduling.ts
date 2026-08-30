import notifee, { AndroidCategory, AndroidImportance, TriggerType } from '@notifee/react-native';
import * as Sentry from '@sentry/react-native';

import type { AdhanRecitation, AlarmDay, CalculationMethodKey, Location } from '@/types';
import {
  FAJR_ALARM_ID_PREFIX,
  SLEEP_ALARM_ID_PREFIX,
  SNOOZE_ALARM_ID,
  TEST_ALARM_ID,
} from '@/utils/alarmEvents';
import {
  cancelAllIosAlarmKit,
  cancelIosAlarmKit,
  ensureIosAlarmKitAuthorized,
  isIosAlarmKitAvailable,
  scheduleIosAlarmKit,
} from '@/utils/iosAlarmKit';
import { buildAlarmSchedule } from './prayerTimes';
import { getTodayReflection } from './reflections';
import {
  CHANNEL_FAJR_ALARM,
  CHANNEL_SLEEP_REMINDER,
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
  try {
    const ids = await notifee.getTriggerNotificationIds();
    const toCancel = ids.filter((id) => id.startsWith(FAJR_PREFIX) || id.startsWith(SLEEP_PREFIX));
    if (toCancel.length > 0) {
      await notifee.cancelTriggerNotifications(toCancel);
    }
  } catch (error) {
    Sentry.captureException(error);
  }
  await cancelAllIosAlarmKit();
}

/** Cancel every scheduled Fajr, sleep, snooze, and test alarm. */
export async function cancelAllAppAlarms(): Promise<void> {
  try {
    const ids = await notifee.getTriggerNotificationIds();
    if (ids.length > 0) {
      await notifee.cancelTriggerNotifications(ids);
    }
  } catch (error) {
    Sentry.captureException(error);
  }
  await cancelAllIosAlarmKit();
}

async function tryCreateTriggerNotification(
  notification: ReturnType<typeof alarmNotification>,
  timestamp: number,
): Promise<void> {
  try {
    await notifee.createTriggerNotification(notification, {
      type: TriggerType.TIMESTAMP,
      timestamp,
      alarmManager: { allowWhileIdle: true },
    });
  } catch (error) {
    Sentry.addBreadcrumb({
      category: 'alarm',
      message: 'Could not schedule a notification (permission denied or OS blocked)',
      level: 'warning',
    });
    Sentry.captureException(error);
  }
}

async function scheduleWakeAlarm(
  id: string,
  title: string,
  body: string,
  timestamp: number,
): Promise<void> {
  try {
    if (await isIosAlarmKitAvailable()) {
      if (await ensureIosAlarmKitAuthorized()) {
        await scheduleIosAlarmKit(id, timestamp, title);
      }
      return;
    }
  } catch (error) {
    Sentry.captureException(error);
    return;
  }

  await tryCreateTriggerNotification(
    alarmNotification(id, title, body, CHANNEL_FAJR_ALARM),
    timestamp,
  );
}

export async function scheduleSnooze(
  snoozeDurationMinutes: number,
  sunriseTime: Date,
): Promise<'scheduled' | 'refused'> {
  const wakeAt = new Date(Date.now() + snoozeDurationMinutes * 60_000);
  if (wakeAt >= sunriseTime) return 'refused';

  await notifee.cancelTriggerNotification(SNOOZE_ALARM_ID);
  await cancelIosAlarmKit(SNOOZE_ALARM_ID);
  await scheduleWakeAlarm(
    SNOOZE_ALARM_ID,
    'Time for Fajr Prayer',
    'Snooze ended — rise and pray.',
    wakeAt.getTime(),
  );

  return 'scheduled';
}

export async function rebuildScheduleOnAppOpen(
  settings: RebuildSettings,
): Promise<AlarmDay[]> {
  try {
    await setupNotifeeChannels();
  } catch (error) {
    Sentry.captureException(error);
  }
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

    await scheduleWakeAlarm(
      `${FAJR_PREFIX}${day.date}`,
      'Time for Fajr Prayer',
      reflection.text,
      day.alarmTime.getTime(),
    );

    if (settings.sleepReminderEnabled) {
      const reminderAt = day.fajrTime.getTime() - settings.desiredSleepHours * 3_600_000;

      if (reminderAt > now) {
        await tryCreateTriggerNotification(
          alarmNotification(
            `${SLEEP_PREFIX}${day.date}`,
            'Time to sleep',
            reflection.text,
            CHANNEL_SLEEP_REMINDER,
          ),
          reminderAt,
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
  await cancelIosAlarmKit(TEST_ALARM_ID);
  await scheduleWakeAlarm(
    TEST_ALARM_ID,
    'Time for Fajr Prayer',
    'Test alarm — rise and pray.',
    Date.now() + TEST_ALARM_DELAY_MS,
  );
}
