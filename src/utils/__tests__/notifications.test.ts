import { AuthorizationStatus } from '@notifee/react-native';

import { notificationAccessForStatus } from '../notifications';

describe('notificationAccessForStatus', () => {
  it('treats authorized and provisional as granted', () => {
    expect(notificationAccessForStatus(AuthorizationStatus.AUTHORIZED)).toBe('granted');
    expect(notificationAccessForStatus(AuthorizationStatus.PROVISIONAL)).toBe('granted');
  });

  it('asks the system dialog when permission has never been decided', () => {
    expect(notificationAccessForStatus(AuthorizationStatus.NOT_DETERMINED)).toBe(
      'request',
    );
  });

  it('sends a denied user to Settings', () => {
    expect(notificationAccessForStatus(AuthorizationStatus.DENIED)).toBe('settings');
  });
});
