import '../global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  // DSN is provided via EXPO_PUBLIC_SENTRY_DSN env var.
  // In development the value is empty and no events are sent.
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  sendDefaultPii: false, // never attach location, PII, or session replay
});

function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 200,
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        {/* Alarm slides up from the bottom — matches the urgency of the notification */}
        <Stack.Screen
          name="alarm"
          options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
