import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import { Platform } from 'react-native';

import { ensureIosAlarmKitAuthorized, isIosAlarmKitAvailable } from '@/utils/iosAlarmKit';

export const CHANNEL_FAJR_ALARM = 'fajr-alarm';
export const CHANNEL_SNOOZE = 'snooze';
export const CHANNEL_SLEEP_REMINDER = 'sleep-reminder';

export async function setupNotifeeChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await notifee.createChannel({
    id: CHANNEL_FAJR_ALARM,
    name: 'Fajr Alarm',
    importance: AndroidImportance.HIGH,
    bypassDnd: true,
    vibration: true,
    sound: 'default',
  });

  await notifee.createChannel({
    id: CHANNEL_SNOOZE,
    name: 'Fajr Snooze',
    importance: AndroidImportance.HIGH,
    bypassDnd: true,
    vibration: true,
    sound: 'default',
  });

  await notifee.createChannel({
    id: CHANNEL_SLEEP_REMINDER,
    name: 'Bedtime Alarm',
    importance: AndroidImportance.HIGH,
    bypassDnd: true,
    vibration: true,
    sound: 'default',
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const existing = await notifee.getNotificationSettings();
    const alreadyOk = existing.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    const settings = alreadyOk
      ? existing
      : await notifee.requestPermission({
          alert: true,
          sound: true,
          badge: true,
          criticalAlert: true,
        });
    const notifeeOk = settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    if (await isIosAlarmKitAvailable()) {
      return (await ensureIosAlarmKitAuthorized()) && notifeeOk;
    }
    return notifeeOk;
  }

  const existing = await notifee.getNotificationSettings();
  if (existing.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
    return true;
  }
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}
