import { Stack, router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAudioPlayer } from "expo-audio";

import { CountdownTimer } from "@/components/CountdownTimer";
import { ElMessiriText } from "@/components/el-messiri-text";
import { GoldGradientText } from "@/components/GoldGradientText";
import { HomeBg } from "@/components/HomeBg";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { Palette, Radius } from "@/constants/theme";
import { useConsistencyStore } from "@/store/consistencyStore";
import { useSettingsStore } from "@/store/settingsStore";
import { getFajrAndSunrise, todayISODate } from "@/utils/prayerTimes";
import { scheduleSnooze } from "@/utils/scheduling";

type Phase = "ringing" | "dismissed";

const ADHAN_SOURCES = {
  makkah: require("../../assets/audio/makkah.wav"),
  madinah: require("../../assets/audio/madinah.wav"),
  mishary: require("../../assets/audio/mishary.wav"),
} as const;

function formatClock(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";
  return `${h}:${m} ${period}`;
}

function formatPrayerTimeParts(date: Date): { time: string; period: "AM" | "PM" } {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, "0");
  return {
    time: `${h}:${m}`,
    period: date.getHours() >= 12 ? "PM" : "AM",
  };
}

const AlarmScreen = () => {
  const settings = useSettingsStore();
  const { confirm } = useConsistencyStore();

  const [phase, setPhase] = useState<Phase>("ringing");
  const [now, setNow] = useState(new Date());

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

  const player = useAudioPlayer(ADHAN_SOURCES[settings.adhanRecitation]);
  const playerRef = useRef(player);
  playerRef.current = player;
  const audioStoppedRef = useRef(false);

  const stopAdhan = useCallback(() => {
    if (audioStoppedRef.current) return;
    audioStoppedRef.current = true;
    try {
      playerRef.current.pause();
    } catch {
      // Native audio object may already be released during navigation/unmount.
    }
  }, []);

  useEffect(() => {
    if (phase !== "ringing") return;

    audioStoppedRef.current = false;
    const adhanPlayer = playerRef.current;
    adhanPlayer.loop = true;
    adhanPlayer.play();

    return () => {
      stopAdhan();
    };
  }, [phase, stopAdhan]);

  const location = settings.location;

  const { fajrTime, sunriseTime } = useMemo(() => {
    if (!location) return { fajrTime: new Date(), sunriseTime: new Date() };
    return getFajrAndSunrise(new Date(), location, settings.calculationMethod);
  }, [location, settings.calculationMethod]);

  const fajrTimeParts = formatPrayerTimeParts(fajrTime);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const snoozeDisabled =
    new Date(now.getTime() + settings.snoozeDurationMinutes * 60_000) >=
    sunriseTime;

  const handleSnooze = useCallback(async () => {
    const result = await scheduleSnooze(
      settings.snoozeDurationMinutes,
      sunriseTime,
    );
    if (result === "refused") {
      Alert.alert(
        "Cannot Snooze",
        "Snoozing would push past Sunrise. Pray now.",
        [{ text: "OK" }],
      );
      return;
    }
    stopAdhan();
    router.back();
  }, [settings.snoozeDurationMinutes, sunriseTime, stopAdhan]);

  const handleDismiss = useCallback(() => {
    setPhase("dismissed");
  }, []);

  const handleConfirm = useCallback(() => {
    confirm(todayISODate(), true);
    stopAdhan();
    router.replace("/");
  }, [confirm, stopAdhan]);

  if (phase === "dismissed") {
    return (
      <GestureHandlerRootView style={styles.root}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <HomeBg />
        <SafeAreaView style={styles.safe}>
          <View style={styles.dismissedWrap}>
            <View style={styles.confirmCard}>
              <ElMessiriText size={28} weight="semiBold" style={styles.headingSmall}>
                Did you pray?
              </ElMessiriText>
              <ElMessiriText size={15} weight="regular" style={styles.hint}>
                Confirm to mark today as complete.
              </ElMessiriText>
              <SlideToConfirm
                onConfirm={handleConfirm}
                label="Slide to confirm prayer"
              />
            </View>
            <Pressable
              style={styles.skipLink}
              onPress={() => router.replace("/")}
              accessibilityLabel="Skip for now"
            >
              <ElMessiriText size={14} weight="medium" style={styles.skipText}>
                Skip for now
              </ElMessiriText>
            </Pressable>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
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
              FAJR
            </ElMessiriText>
            <View style={styles.fajrTimeWrap}>
              <View style={styles.fajrTimeAnchor}>
                <GoldGradientText size={72} weight="bold" reversed>
                  {fajrTimeParts.time}
                </GoldGradientText>
                <View style={styles.fajrPeriodAnchor} pointerEvents="none">
                  <ElMessiriText size={24} weight="bold" style={styles.fajrPeriod}>
                    {fajrTimeParts.period}
                  </ElMessiriText>
                </View>
              </View>
            </View>

            <ElMessiriText size={13} weight="regular" style={styles.untilSunrise}>
              until sunrise
            </ElMessiriText>
            <CountdownTimer targetTime={sunriseTime} />
          </View>

          <View style={styles.actions}>
            {snoozeDisabled ? (
              <View style={styles.snoozeDisabled}>
                <ElMessiriText size={13} weight="regular" style={styles.snoozeDisabledText}>
                  Snooze unavailable — Sunrise is too close
                </ElMessiriText>
              </View>
            ) : (
              <Pressable
                style={styles.snoozeButton}
                onPress={handleSnooze}
                accessibilityLabel={`Snooze ${settings.snoozeDurationMinutes} minutes`}
              >
                <ElMessiriText size={17} weight="medium" style={styles.snoozeText}>
                  Snooze {settings.snoozeDurationMinutes} min
                </ElMessiriText>
              </Pressable>
            )}

            <Pressable
              style={styles.dismissButton}
              onPress={handleDismiss}
              accessibilityLabel="Dismiss alarm"
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
    gap: 8,
  },

  label: {
    color: Palette.textSecondary,
    letterSpacing: 2,
    textAlign: "center",
  },
  fajrTimeWrap: {
    alignItems: "center",
    marginTop: 4,
  },
  fajrTimeAnchor: {
    position: "relative",
  },
  fajrPeriodAnchor: {
    position: "absolute",
    left: "100%",
    bottom: 0,
    marginLeft: 4,
  },
  fajrPeriod: {
    color: Palette.gold,
    letterSpacing: 0.5,
  },
  untilSunrise: {
    color: Palette.textMuted,
    marginTop: 16,
    textAlign: "center",
  },

  dismissedWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  confirmCard: {
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    padding: 24,
    gap: 12,
    alignItems: "center",
  },
  headingSmall: {
    color: Palette.text,
    textAlign: "center",
  },
  hint: {
    color: Palette.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },

  actions: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 14,
  },
  snoozeButton: {
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.md,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
  },
  snoozeText: { color: Palette.text },
  snoozeDisabled: {
    paddingVertical: 14,
    alignItems: "center",
  },
  snoozeDisabledText: {
    color: Palette.textMuted,
    textAlign: "center",
  },
  dismissButton: {
    backgroundColor: Palette.gold,
    borderRadius: Radius.md,
    paddingVertical: 18,
    alignItems: "center",
  },
  dismissText: { color: Palette.bg },

  skipLink: { alignItems: "center" },
  skipText: { color: Palette.textMuted },
});
