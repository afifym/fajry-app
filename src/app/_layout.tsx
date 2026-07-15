import '../global.css';

import {
  ElMessiri_400Regular,
  ElMessiri_500Medium,
  ElMessiri_600SemiBold,
  ElMessiri_700Bold,
  useFonts,
} from '@expo-google-fonts/el-messiri';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';

import { useAlarmLaunchListener } from '@/hooks/use-alarm-launch-listener';
import { Palette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Palette.bg,
    card: Palette.bg,
  },
};

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  sendDefaultPii: false,
});

const RootLayout = () => {
  const [fontsLoaded, fontError] = useFonts({
    ElMessiri_400Regular,
    ElMessiri_500Medium,
    ElMessiri_600SemiBold,
    ElMessiri_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(Palette.bg);
  }, []);

  useAlarmLaunchListener(fontsLoaded || !!fontError);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={NavTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade',
          animationDuration: 200,
          contentStyle: { backgroundColor: Palette.bg },
        }}
      >
        {/* Alarm slides up from the bottom — matches the urgency of the notification */}
        <Stack.Screen
          name="alarm"
          options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
        />
        <Stack.Screen
          name="bedtime"
          options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
