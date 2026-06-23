import { Redirect, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { CityPickerModal } from "@/components/CityPickerModal";
import { FajrClockRing } from "@/components/FajrClockRing";
import { HomeBg } from "@/components/HomeBg";
import { GearIcon, LocationPinIcon, MoonIcon } from "@/components/HomeIcons";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { StreakCard } from "@/components/StreakCard";
import { useConsistencyStore } from "@/store/consistencyStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { AlarmDay, City, Location } from "@/types";
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

const formatTodayLabel = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

const HomeScreenContent = () => {
  const settings = useSettingsStore();
  const { streak, confirm } = useConsistencyStore();

  const [schedule, setSchedule] = useState<AlarmDay[]>([]);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(() => {
    const today = todayISODate();
    return !!useConsistencyStore.getState().confirmations[today]?.confirmedAt;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

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
    const id = setInterval(() => {
      setNow(new Date());
      checkConfirmationWindow(schedule);
    }, 60_000);
    return () => clearInterval(id);
  }, [schedule, checkConfirmationWindow]);

  async function applyLocationChange(loc: Location) {
    useSettingsStore.getState().setLocation(loc);
    const s = useSettingsStore.getState();
    const newSchedule = await rebuildScheduleOnAppOpen({
      location: loc,
      calculationMethod: s.calculationMethod,
      adhanRecitation: s.adhanRecitation,
      preAlarmOffsetMinutes: s.preAlarmOffsetMinutes,
      alarmEnabled: s.alarmEnabled,
      sleepReminderEnabled: s.sleepReminderEnabled,
      desiredSleepHours: s.desiredSleepHours,
    });
    setSchedule(newSchedule);
    checkConfirmationWindow(newSchedule);
  }

  useEffect(() => {
    // Check for location change in background (non-blocking)
    async function checkLocation() {
      try {
        const gps = await requestGPSLocation();
        const stored = useSettingsStore.getState().location;
        if (stored && detectLocationChange(stored, gps)) {
          Alert.alert(
            "Location Changed",
            "Your GPS position has moved more than 50 km from your stored location. Update?",
            [
              { text: "Keep Current", style: "cancel" },
              {
                text: "Update",
                onPress: () => {
                  void applyLocationChange({
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
  }, []); // run once on mount — manual location changes go through handleCityPick

  function handleConfirm() {
    if (confirmed) return;
    setConfirmed(true);
    confirm(todayISODate(), true);
  }

  async function handleCityPick(city: City) {
    setPickerOpen(false);
    await applyLocationChange({
      lat: city.lat,
      lng: city.lng,
      cityName: city.name,
      country: city.country,
    });
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <HomeBg />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityLabel="Change location"
          >
            <View style={styles.locationNameRow}>
              <LocationPinIcon />
              <Text style={styles.locationText}>{location.cityName}</Text>
              <Text style={styles.locationChevron}>›</Text>
            </View>
            <Text style={styles.locationCountry}>{location.country}</Text>
          </Pressable>
          <View style={styles.navIcons}>
            <Pressable
              style={styles.navButton}
              onPress={() => router.push("/settings")}
              accessibilityLabel="Settings"
            >
              <GearIcon />
            </Pressable>
            <Pressable
              style={styles.navButton}
              onPress={() => router.push("/consistency")}
              accessibilityLabel="Prayer consistency"
            >
              <MoonIcon />
            </Pressable>
          </View>
        </View>

        {/* Date strip */}
        <Text style={styles.dateText}>{formatTodayLabel(now)}</Text>

        {/* Main */}
        <View style={styles.main}>
          {/* Clock ring — vertically centered in the flex:1 area */}
          <View style={styles.clockSection}>
            <FajrClockRing
              fajrTime={
                schedule.find((d) => d.fajrTime.getTime() > Date.now())
                  ?.fajrTime ?? null
              }
            />
          </View>

          {/* Bottom: streak card + optional confirm */}
          <View style={styles.bottomSection}>
            <StreakCard streak={streak} onPress={() => router.push('/consistency')} />

            {confirmationOpen && !confirmed && (
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>FAJR WINDOW OPEN</Text>
                <Text style={styles.confirmHint}>Did you pray on time?</Text>
                <SlideToConfirm
                  onConfirm={handleConfirm}
                  label="Slide to confirm"
                />
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      <CityPickerModal
        visible={pickerOpen}
        title="Change Location"
        onClose={() => setPickerOpen(false)}
        onSelect={handleCityPick}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060C1A" },
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  locationNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: { color: "#ffffff", fontSize: 15, fontWeight: "500" },
  locationCountry: { color: "#8892A4", fontSize: 12, marginTop: 1 },
  navIcons: { flexDirection: "row", gap: 8 },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0D1526",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#1E2D4A",
    alignItems: "center",
    justifyContent: "center",
  },

  dateText: {
    textAlign: "center",
    color: "#4A5568",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
    paddingBottom: 4,
  },

  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  clockSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSection: {
    gap: 12,
  },

  confirmCard: {
    backgroundColor: "#0D1526",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#1E2D4A",
    padding: 20,
    gap: 10,
    alignItems: "center",
  },
  confirmTitle: {
    color: "#C9A84C",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
  },
  confirmHint: { color: "#8892A4", fontSize: 14 },

  locationChevron: { color: "#4A5568", fontSize: 16, marginLeft: 2, lineHeight: 20 },
});
