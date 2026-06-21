import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { useAudioPlayer } from 'expo-audio';

import { useSettingsStore } from '@/store/settingsStore';
import { useConsistencyStore } from '@/store/consistencyStore';
import { getFajrAndSunrise, todayISODate } from '@/utils/prayerTimes';
import { scheduleSnooze } from '@/utils/scheduling';
import { SlideToConfirm } from '@/components/SlideToConfirm';
import { CountdownTimer } from '@/components/CountdownTimer';

type Phase = 'ringing' | 'dismissed';

// Static require() calls must be at module level for Metro bundler
const ADHAN_SOURCES = {
  makkah: require('../../assets/audio/makkah.wav'),
  madinah: require('../../assets/audio/madinah.wav'),
  mishary: require('../../assets/audio/mishary.wav'),
} as const;

function formatClock(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  const period = date.getHours() >= 12 ? 'PM' : 'AM';
  return `${h}:${m} ${period}`;
}

const AlarmScreen = () => {
  const settings = useSettingsStore();
  const { confirm } = useConsistencyStore();

  const [phase, setPhase] = useState<Phase>('ringing');
  const [now, setNow] = useState(new Date());

  // Entrance animation — runs entirely on the UI thread
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    translateY.value = withDelay(
      60,
      withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );
  }, []); // intentionally empty — fires once on mount

  // Adhan audio — loops while ringing, stopped via ref on dismiss/snooze
  const player = useAudioPlayer(ADHAN_SOURCES[settings.adhanRecitation]);
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => {
    player.loop = true;
    player.play();
    return () => { player.pause(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const location = settings.location;

  // Derive today's Fajr & Sunrise from settings — memoized to avoid re-running adhan on every clock tick
  const { fajrTime, sunriseTime } = useMemo(() => {
    if (!location) return { fajrTime: new Date(), sunriseTime: new Date() };
    return getFajrAndSunrise(new Date(), location, settings.calculationMethod);
  }, [location, settings.calculationMethod]);

  useEffect(() => {
    // Live clock
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Derived from the live clock so it updates without a separate effect
  const snoozeDisabled = new Date(now.getTime() + settings.snoozeDurationMinutes * 60_000) >= sunriseTime;

  const handleSnooze = useCallback(async () => {
    const result = await scheduleSnooze(settings.snoozeDurationMinutes, sunriseTime);
    if (result === 'refused') {
      Alert.alert(
        'Cannot Snooze',
        'Snoozing would push past Sunrise. Pray now.',
        [{ text: 'OK' }],
      );
      return;
    }
    playerRef.current.pause();
    router.back();
  }, [settings.snoozeDurationMinutes, sunriseTime]);

  const handleDismiss = useCallback(() => {
    playerRef.current.pause();
    setPhase('dismissed');
  }, []);

  const handleConfirm = useCallback(() => {
    confirm(todayISODate(), true);
    router.replace('/');
  }, [confirm]);

  if (phase === 'dismissed') {
    return (
      <GestureHandlerRootView style={styles.root}>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.centred}>
            <Text style={styles.headingSmall}>Did you pray?</Text>
            <Text style={styles.hint}>Confirm to mark today as complete.</Text>
            <SlideToConfirm onConfirm={handleConfirm} label="Slide to confirm prayer" />
            <Pressable style={styles.skipLink} onPress={() => router.replace('/')}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Prevent swipe-back while alarm is ringing */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      <SafeAreaView style={styles.safe}>
        {/* Reanimated entrance: opacity + slide-up, fully on UI thread */}
        <Animated.View style={[styles.flex, entranceStyle]}>
          <View style={styles.top}>
            <Text style={styles.clock}>{formatClock(now)}</Text>
          </View>

          <View style={styles.centred}>
            <Text style={styles.label}>FAJR</Text>
            <Text style={styles.fajrTime}>{formatClock(fajrTime)}</Text>

            <Text style={styles.untilSunrise}>until sunrise</Text>
            <CountdownTimer targetTime={sunriseTime} />

          </View>

          <View style={styles.actions}>
            {snoozeDisabled ? (
              <View style={styles.snoozeDisabled}>
                <Text style={styles.snoozeDisabledText}>
                  Snooze unavailable — Sunrise is too close
                </Text>
              </View>
            ) : (
              <Pressable
                style={styles.snoozeButton}
                onPress={handleSnooze}
                accessibilityLabel={`Snooze ${settings.snoozeDurationMinutes} minutes`}
              >
                <Text style={styles.snoozeText}>Snooze {settings.snoozeDurationMinutes} min</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.dismissButton}
              onPress={handleDismiss}
              accessibilityLabel="Dismiss alarm"
            >
              <Text style={styles.dismissText}>Dismiss</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default AlarmScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  safe: { flex: 1 },
  flex: { flex: 1, justifyContent: 'space-between' },

  top: {
    paddingTop: 16,
    alignItems: 'center',
  },
  clock: {
    color: '#5A5E6A',
    fontSize: 18,
    fontWeight: '400',
  },

  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  label: {
    color: '#4B5060',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  fajrTime: {
    color: '#ffffff',
    fontSize: 60,
    fontWeight: '200',
    letterSpacing: -1.5,
  },
  untilSunrise: {
    color: '#4B5060',
    fontSize: 13,
    marginTop: 16,
  },

  headingSmall: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '300',
  },
  hint: {
    color: '#9EA3AD',
    fontSize: 15,
    marginBottom: 24,
  },

  actions: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 14,
  },
  snoozeButton: {
    backgroundColor: '#141416',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2E38',
  },
  snoozeText: { color: '#9EA3AD', fontSize: 17 },
  snoozeDisabled: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  snoozeDisabledText: {
    color: '#4B5060',
    fontSize: 13,
    textAlign: 'center',
  },
  dismissButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  dismissText: { color: '#000000', fontSize: 17, fontWeight: '600' },

  skipLink: { marginTop: 24 },
  skipText: { color: '#5A5E6A', fontSize: 14 },
});
