import 'expo-router/entry';
import notifee, { EventType } from '@notifee/react-native';
import { Platform } from 'react-native';

// Handle notification events while the app is in the background or killed state.
// Foreground events are handled in-screen via notifee.onForegroundEvent().
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS && detail.pressAction) {
    // Specific actions (snooze, dismiss) are handled in scheduling.ts helpers.
    // Task 9 will populate this handler.
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
