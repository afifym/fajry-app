/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/** El Messiri — loaded in root layout (@expo-google-fonts/el-messiri). */
export const FontFamily = {
  regular: 'ElMessiri_400Regular',
  medium: 'ElMessiri_500Medium',
  semiBold: 'ElMessiri_600SemiBold',
  bold: 'ElMessiri_700Bold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

/** Premium dark teal + gold palette (home / prayer UI). */
export const Palette = {
  bg: '#0A1612',
  bgCard: '#132520',
  bgElevated: '#1A2E28',
  bgInset: '#0F1F1B',
  border: '#2A4540',
  borderSubtle: '#1E3530',
  gold: '#E2B842',
  goldMuted: '#C49A38',
  goldDim: 'rgba(226, 184, 66, 0.26)',
  text: '#F0EDE6',
  textSecondary: '#8BA39C',
  textMuted: '#5C726C',
  pattern: '#1A3530',
  sleepTrack: '#0C1210',
  glassOutline: 'rgba(255, 255, 255, 0.16)',
  glassFill: 'rgba(26, 46, 40, 0.45)',
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
} as const;
