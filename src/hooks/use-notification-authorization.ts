import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { areNotificationsAuthorized } from '@/utils/notifications';

/** Tracks whether the OS currently allows notifications. */
export function useNotificationAuthorization(): {
  authorized: boolean;
  refresh: () => Promise<void>;
} {
  const [authorized, setAuthorized] = useState(true);

  const refresh = useCallback(async () => {
    setAuthorized(await areNotificationsAuthorized());
  }, []);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { authorized, refresh };
}
