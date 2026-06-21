import '../global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});

const RootLayout = () => {
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
