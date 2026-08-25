import notifee, { EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

export const FAJR_ALARM_ID_PREFIX = 'fajr-';
export const SLEEP_ALARM_ID_PREFIX = 'sleep-';
export const SNOOZE_ALARM_ID = 'snooze-current';
export const TEST_ALARM_ID = `${FAJR_ALARM_ID_PREFIX}test`;

export type AlarmRoute = '/alarm' | '/bedtime';

const mmkv = createMMKV({ id: 'alarm-events' });
const PENDING_ALARM_ID_KEY = 'pending-alarm-id';

export function isWakeAlarmNotificationId(id: string | undefined): boolean {
  if (!id) return false;
  return id.startsWith(FAJR_ALARM_ID_PREFIX) || id === SNOOZE_ALARM_ID;
}

export function isSleepAlarmNotificationId(id: string | undefined): boolean {
  if (!id) return false;
  return id.startsWith(SLEEP_ALARM_ID_PREFIX);
}

export function isAlarmNotificationId(id: string | undefined): boolean {
  return isWakeAlarmNotificationId(id) || isSleepAlarmNotificationId(id);
}

export function getAlarmRouteForNotificationId(
  id: string | undefined,
): AlarmRoute | null {
  if (isSleepAlarmNotificationId(id)) return '/bedtime';
  if (isWakeAlarmNotificationId(id)) {
    return Platform.OS === 'ios' ? null : '/alarm';
  }
  return null;
}

export function markPendingAlarmLaunch(notificationId: string): void {
  mmkv.set(PENDING_ALARM_ID_KEY, notificationId);
}

export function consumePendingAlarmLaunch(): string | null {
  const id = mmkv.getString(PENDING_ALARM_ID_KEY);
  if (id) mmkv.remove(PENDING_ALARM_ID_KEY);
  return id ?? null;
}

export function shouldLaunchAlarmScreen(
  type: EventType,
  notificationId: string | undefined,
): boolean {
  if (!getAlarmRouteForNotificationId(notificationId)) return false;
  return (
    type === EventType.DELIVERED ||
    type === EventType.PRESS ||
    type === EventType.ACTION_PRESS
  );
}

/** Stop the ringing notification and Android foreground service. */
export async function dismissActiveAlarm(): Promise<void> {
  const displayed = await notifee.getDisplayedNotifications();
  const alarmIds = displayed
    .map((entry) => entry.notification?.id)
    .filter((id): id is string => isAlarmNotificationId(id));

  if (alarmIds.length > 0) {
    await notifee.cancelDisplayedNotifications(alarmIds);
  }

  await notifee.stopForegroundService();
}

// Backwards-compatible alias used by wake-alarm code paths.
export const shouldOpenAlarmScreen = shouldLaunchAlarmScreen;
