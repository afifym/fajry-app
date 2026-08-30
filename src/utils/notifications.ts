import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import { Alert, Linking, Platform } from 'react-native';

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

export function notificationAccessForStatus(
  status: number,
): 'granted' | 'request' | 'settings' {
  if (status >= AuthorizationStatus.AUTHORIZED) return 'granted';
  if (status === AuthorizationStatus.NOT_DETERMINED) return 'request';
  return 'settings';
}

export async function getNotificationAccess(): Promise<
  'granted' | 'request' | 'settings'
> {
  const { authorizationStatus } = await notifee.getNotificationSettings();
  return notificationAccessForStatus(authorizationStatus);
}

export async function areNotificationsAuthorized(): Promise<boolean> {
  return (await getNotificationAccess()) === 'granted';
}

export async function openAppNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}

/** Ask the OS, or send the user to Settings if they already denied. */
export async function enableOsNotificationAccess(): Promise<boolean> {
  const access = await getNotificationAccess();
  if (access === 'settings') {
    return new Promise((resolve) => {
      Alert.alert(
        'Turn on notifications',
        'Fajry needs notifications for the bedtime reminder and Fajr alarm.',
        [
          { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Open Settings',
            onPress: () => {
              void openAppNotificationSettings();
              resolve(false);
            },
          },
        ],
      );
    });
  }
  return requestNotificationPermissions();
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
