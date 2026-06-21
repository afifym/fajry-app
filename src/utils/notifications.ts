import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import { Platform } from 'react-native';

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
    name: 'Sleep Reminder',
    importance: AndroidImportance.DEFAULT,
    vibration: false,
    sound: 'default',
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const settings = await notifee.requestPermission({
      alert: true,
      sound: true,
      badge: true,
      criticalAlert: true,
    });
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  }

  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}
