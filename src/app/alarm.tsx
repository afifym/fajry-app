import { Stack, Redirect, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CountdownTimer } from "@/components/CountdownTimer";
import { ElMessiriText } from "@/components/el-messiri-text";
import { HomeBg } from "@/components/HomeBg";
import { Palette, Radius } from "@/constants/theme";
import { useSettingsStore } from "@/store/settingsStore";
import { dismissActiveAlarm } from "@/utils/alarmEvents";
import { getFajrAndSunrise } from "@/utils/prayerTimes";
import { getTodayReflection } from "@/utils/reflections";

function formatClock(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m} ${period}`;
}

const AlarmScreen = () => {
  const settings = useSettingsStore();
  const [now, setNow] = useState(new Date());
  const reflection = useMemo(() => getTodayReflection(), []);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.quad),
    });
    translateY.value = withDelay(
      60,
      withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const location = settings.location;
  const sunriseTime = useMemo(() => {
    if (!location) return new Date();
    return getFajrAndSunrise(new Date(), location, settings.calculationMethod)
      .sunriseTime;
  }, [location, settings.calculationMethod]);

  const handleDismiss = useCallback(async () => {
    await dismissActiveAlarm();
    router.replace("/");
  }, []);

  if (Platform.OS === "ios") {
    return <Redirect href="/" />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <HomeBg />
      <SafeAreaView style={styles.safe}>
        <Animated.View style={[styles.flex, entranceStyle]}>
          <View style={styles.top}>
            <ElMessiriText size={18} weight="regular" style={styles.clock}>
              {formatClock(now)}
            </ElMessiriText>
          </View>

          <View style={styles.centred}>
            <ElMessiriText size={11} weight="semiBold" style={styles.label}>
              TIME FOR FAJR
            </ElMessiriText>

            <View style={styles.reflectionCard}>
              <ElMessiriText size={20} weight="medium" lines={6} style={styles.reflectionText}>
                {reflection.text}
              </ElMessiriText>
              <ElMessiriText size={13} weight="regular" style={styles.reflectionSource}>
                {reflection.source}
              </ElMessiriText>
            </View>

            <ElMessiriText size={13} weight="regular" style={styles.untilSunrise}>
              until sunrise
            </ElMessiriText>
            <CountdownTimer targetTime={sunriseTime} />
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.dismissButton}
              onPress={handleDismiss}
              accessibilityLabel="Dismiss Fajr alarm"
            >
              <ElMessiriText size={17} weight="bold" style={styles.dismissText}>
                Dismiss
              </ElMessiriText>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default AlarmScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  safe: { flex: 1 },
  flex: { flex: 1, justifyContent: "space-between" },

  top: {
    paddingTop: 16,
    alignItems: "center",
  },
  clock: {
    color: Palette.textSecondary,
    letterSpacing: 0.5,
    textAlign: "center",
  },

  centred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },

  label: {
    color: Palette.textSecondary,
    letterSpacing: 2,
    textAlign: "center",
  },
  reflectionCard: {
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    padding: 24,
    gap: 12,
    width: "100%",
  },
  reflectionText: {
    color: Palette.text,
    textAlign: "center",
    lineHeight: 30,
  },
  reflectionSource: {
    color: Palette.textMuted,
    textAlign: "center",
  },
  untilSunrise: {
    color: Palette.textMuted,
    marginTop: 8,
    textAlign: "center",
  },

  actions: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  dismissButton: {
    backgroundColor: Palette.gold,
    borderRadius: Radius.md,
    paddingVertical: 18,
    alignItems: "center",
  },
  dismissText: { color: Palette.bg },
});
