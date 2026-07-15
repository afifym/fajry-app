import 'expo-router/entry';
import notifee from '@notifee/react-native';
import { Platform } from 'react-native';

import {
  markPendingAlarmLaunch,
  shouldLaunchAlarmScreen,
} from './src/utils/alarmEvents';

// Handle notification events while the app is in the background or killed state.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const notificationId = detail.notification?.id;
  if (shouldLaunchAlarmScreen(type, notificationId)) {
    markPendingAlarmLaunch(notificationId!);
  }
});

if (Platform.OS === 'android') {
  // Runner for notifications displayed with asForegroundService: true.
  // Task 9 will implement the alarm foreground service body.
  notifee.registerForegroundService((_notification) => {
    return new Promise(() => {
      // Promise intentionally never resolves here;
      // scheduling.ts cancels the foreground service notification when the alarm is dismissed.
    });
  });
}
