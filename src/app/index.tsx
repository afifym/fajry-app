import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { FajrClockRing } from "@/components/FajrClockRing";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { useConsistencyStore } from "@/store/consistencyStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { AlarmDay } from "@/types";
import { detectLocationChange, requestGPSLocation } from "@/utils/location";
import { isConfirmationWindowOpen, todayISODate } from "@/utils/prayerTimes";
import { rebuildScheduleOnAppOpen } from "@/utils/scheduling";

const HomeScreen = () => {
  const location = useSettingsStore((state) => state.location);

  if (!location) {
    return <Redirect href="/onboarding" />;
  }

  return <HomeScreenContent />;
};

export default HomeScreen;

const HomeScreenContent = () => {
  const settings = useSettingsStore();
  const { streak, confirm } = useConsistencyStore();

  const [schedule, setSchedule] = useState<AlarmDay[]>([]);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(() => {
    const today = todayISODate();
    return !!useConsistencyStore.getState().confirmations[today]?.confirmedAt;
  });

  const location = settings.location!;

  const checkConfirmationWindow = useCallback((s: AlarmDay[]) => {
    const today = s.find((d) => d.date === todayISODate());
    if (!today) return;
    // Use true fajrTime (not alarmTime) — window opens at prayer time, not the pre-alarm offset
    setConfirmationOpen(
      isConfirmationWindowOpen(today.fajrTime, today.sunriseTime),
    );
  }, []);

  useEffect(() => {
    async function rebuild() {
      const s = await rebuildScheduleOnAppOpen({
        location,
        calculationMethod: settings.calculationMethod,
        adhanRecitation: settings.adhanRecitation,
        preAlarmOffsetMinutes: settings.preAlarmOffsetMinutes,
        alarmEnabled: settings.alarmEnabled,
        sleepReminderEnabled: settings.sleepReminderEnabled,
        desiredSleepHours: settings.desiredSleepHours,
      });
      setSchedule(s);
      checkConfirmationWindow(s);
    }
    rebuild();
  }, []); // intentionally run only on mount

  useEffect(() => {
    // Tick confirmation window every minute
    const id = setInterval(() => checkConfirmationWindow(schedule), 60_000);
    return () => clearInterval(id);
  }, [schedule, checkConfirmationWindow]);

  useEffect(() => {
    // Check for location change in background (non-blocking)
    async function checkLocation() {
      try {
        const gps = await requestGPSLocation();
        if (detectLocationChange(location, gps)) {
          Alert.alert(
            "Location Changed",
            "Your GPS position has moved more than 50 km from your stored location. Update?",
            [
              { text: "Keep Current", style: "cancel" },
              {
                text: "Update",
                onPress: () => {
                  useSettingsStore.getState().setLocation({
                    lat: gps.lat,
                    lng: gps.lng,
                    cityName: gps.cityName,
                    country: gps.country,
                  });
                },
              },
            ],
          );
        }
      } catch {
        // GPS unavailable — ignore silently
      }
    }
    checkLocation();
  }, [location]);

  function handleConfirm() {
    if (confirmed) return;
    setConfirmed(true);
    confirm(todayISODate(), true);
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push("/settings")}
            accessibilityLabel="Change location"
          >
            <Text style={styles.locationText}>{location.cityName}</Text>
            <Text style={styles.locationCountry}>{location.country}</Text>
          </Pressable>

          <View style={styles.navIcons}>
            <Pressable
              style={styles.navButton}
              onPress={() => router.push("/settings")}
              accessibilityLabel="Settings"
            >
              <Text style={styles.navIcon}>⚙</Text>
            </Pressable>
            <Pressable
              style={styles.navButton}
              onPress={() => router.push("/consistency")}
              accessibilityLabel="Consistency Calendar"
            >
              <Text style={styles.navIcon}>☽</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.main}>
          <FajrClockRing
            fajrTime={schedule.find((d) => d.fajrTime.getTime() > Date.now())?.fajrTime ?? null}
          />

          <View style={styles.streakRow}>
            <Text style={styles.streakLabel}>STREAK</Text>
            <Text style={styles.streakValue}>{streak}</Text>
            <Text style={styles.streakUnit}>
              {streak === 1 ? "day" : "days"}
            </Text>
          </View>

          {confirmationOpen && !confirmed && (
            <View style={styles.confirmSection}>
              <Text style={styles.confirmHint}>
                Prayed on time? Confirm below.
              </Text>
              <SlideToConfirm
                onConfirm={handleConfirm}
                label="Slide to confirm prayer"
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  locationText: { color: "#ffffff", fontSize: 15, fontWeight: "500" },
  locationCountry: { color: "#4B5060", fontSize: 12, marginTop: 1 },
  navIcons: { flexDirection: "row", gap: 4 },
  navButton: { padding: 8 },
  navIcon: { color: "#5A5E6A", fontSize: 22 },

  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  streakRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  streakLabel: {
    color: "#4B5060",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
  },
  streakValue: { color: "#ffffff", fontSize: 40, fontWeight: "300" },
  streakUnit: { color: "#5A5E6A", fontSize: 16 },

  confirmSection: { alignItems: "center", gap: 12 },
  confirmHint: { color: "#9EA3AD", fontSize: 14 },
});
