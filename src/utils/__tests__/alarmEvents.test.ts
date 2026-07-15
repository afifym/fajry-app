import { EventType } from '@notifee/react-native';

import {
  FAJR_ALARM_ID_PREFIX,
  SLEEP_ALARM_ID_PREFIX,
  SNOOZE_ALARM_ID,
  consumePendingAlarmLaunch,
  getAlarmRouteForNotificationId,
  isAlarmNotificationId,
  isSleepAlarmNotificationId,
  isWakeAlarmNotificationId,
  markPendingAlarmLaunch,
  shouldLaunchAlarmScreen,
} from '../alarmEvents';

describe('alarmEvents', () => {
  it('identifies wake alarm notification ids', () => {
    expect(isWakeAlarmNotificationId(`${FAJR_ALARM_ID_PREFIX}2024-01-15`)).toBe(true);
    expect(isWakeAlarmNotificationId(SNOOZE_ALARM_ID)).toBe(true);
    expect(isWakeAlarmNotificationId(`${SLEEP_ALARM_ID_PREFIX}2024-01-15`)).toBe(false);
    expect(isWakeAlarmNotificationId(undefined)).toBe(false);
  });

  it('identifies sleep alarm notification ids', () => {
    expect(isSleepAlarmNotificationId(`${SLEEP_ALARM_ID_PREFIX}2024-01-15`)).toBe(true);
    expect(isSleepAlarmNotificationId(`${FAJR_ALARM_ID_PREFIX}2024-01-15`)).toBe(false);
  });

  it('combines wake and sleep ids for alarm routing', () => {
    expect(isAlarmNotificationId(`${FAJR_ALARM_ID_PREFIX}2024-01-15`)).toBe(true);
    expect(isAlarmNotificationId(`${SLEEP_ALARM_ID_PREFIX}2024-01-15`)).toBe(true);
    expect(getAlarmRouteForNotificationId(`${FAJR_ALARM_ID_PREFIX}2024-01-15`)).toBe('/alarm');
    expect(getAlarmRouteForNotificationId(`${SLEEP_ALARM_ID_PREFIX}2024-01-15`)).toBe('/bedtime');
  });

  it('opens the alarm screen for delivered and press events only', () => {
    expect(
      shouldLaunchAlarmScreen(EventType.DELIVERED, `${FAJR_ALARM_ID_PREFIX}2024-01-15`),
    ).toBe(true);
    expect(
      shouldLaunchAlarmScreen(EventType.PRESS, `${SLEEP_ALARM_ID_PREFIX}2024-01-15`),
    ).toBe(true);
    expect(
      shouldLaunchAlarmScreen(EventType.DISMISSED, `${FAJR_ALARM_ID_PREFIX}2024-01-15`),
    ).toBe(false);
    expect(shouldLaunchAlarmScreen(EventType.PRESS, 'other-id')).toBe(false);
  });

  it('tracks pending alarm launches with notification id across app restarts', () => {
    expect(consumePendingAlarmLaunch()).toBe(null);
    markPendingAlarmLaunch(`${SLEEP_ALARM_ID_PREFIX}2024-01-15`);
    expect(consumePendingAlarmLaunch()).toBe(`${SLEEP_ALARM_ID_PREFIX}2024-01-15`);
    expect(consumePendingAlarmLaunch()).toBe(null);
  });
});
