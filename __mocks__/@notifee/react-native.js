// Jest mock for @notifee/react-native.
// Stores scheduled notifications in memory so tests can inspect them.

const scheduled = {};
const cancelled = new Set();

const EventType = { UNKNOWN: -1, DELIVERED: 0, PRESS: 1, ACTION_PRESS: 2, DISMISSED: 3, APP_BLOCKED: 4, CHANNEL_BLOCKED: 5, CHANNEL_GROUP_BLOCKED: 6, FG_ALREADY_EXIST: 7 };
const TriggerType = { TIMESTAMP: 0, INTERVAL: 1 };
const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 };
const AndroidImportance = { NONE: 0, MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4 };

const notifee = {
  createChannel: jest.fn().mockResolvedValue(undefined),
  requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: AuthorizationStatus.AUTHORIZED }),
  getTriggerNotificationIds: jest.fn().mockImplementation(() => Promise.resolve(Object.keys(scheduled))),
  createTriggerNotification: jest.fn().mockImplementation((notification, _trigger) => {
    const id = notification.id ?? String(Date.now());
    scheduled[id] = { notification, trigger: _trigger };
    cancelled.delete(id);
    return Promise.resolve(id);
  }),
  cancelTriggerNotification: jest.fn().mockImplementation((id) => {
    cancelled.add(id);
    delete scheduled[id];
    return Promise.resolve();
  }),
  cancelTriggerNotifications: jest.fn().mockImplementation((ids) => {
    (ids ?? Object.keys(scheduled)).forEach((id) => {
      cancelled.add(id);
      delete scheduled[id];
    });
    return Promise.resolve();
  }),
  cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
  displayNotification: jest.fn().mockResolvedValue(undefined),
  onBackgroundEvent: jest.fn(),
  onForegroundEvent: jest.fn().mockReturnValue(() => {}),
  registerForegroundService: jest.fn(),

  // Test helpers — not part of the real API but useful for assertions
  __getScheduled: () => ({ ...scheduled }),
  __reset: () => {
    Object.keys(scheduled).forEach((k) => delete scheduled[k]);
    cancelled.clear();
    jest.clearAllMocks();
  },
};

module.exports = {
  __esModule: true,
  default: notifee,
  EventType,
  TriggerType,
  AuthorizationStatus,
  AndroidImportance,
};
