import notifee from '@notifee/react-native';
import { router } from 'expo-router';
import { useEffect } from 'react';

import {
  consumePendingAlarmLaunch,
  getAlarmRouteForNotificationId,
  shouldLaunchAlarmScreen,
} from '@/utils/alarmEvents';

function openAlarmScreenForNotification(notificationId: string | undefined): void {
  const route = getAlarmRouteForNotificationId(notificationId);
  if (route) router.replace(route);
}

/** Opens the reminder screen when a wake or bedtime notification fires. */
export function useAlarmLaunchListener(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    void (async () => {
      const pendingId = consumePendingAlarmLaunch();
      if (pendingId) {
        openAlarmScreenForNotification(pendingId);
        return;
      }

      const initial = await notifee.getInitialNotification();
      openAlarmScreenForNotification(initial?.notification?.id);
    })();

    return notifee.onForegroundEvent(({ type, detail }) => {
      if (shouldLaunchAlarmScreen(type, detail.notification?.id)) {
        openAlarmScreenForNotification(detail.notification?.id);
      }
    });
  }, [enabled]);
}
