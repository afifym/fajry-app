import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { CityPickerModal } from "@/components/CityPickerModal";
import { BedtimeEditModal } from "@/components/BedtimeEditModal";
import { HomeBg } from "@/components/HomeBg";
import { Icon, ChevronRight, Flame, MapPin, Settings } from "@/components/Icon";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { SleepScheduleCard } from "@/components/SleepScheduleCard";
import { SleepWakeClock } from "@/components/SleepWakeClock";
import { StreakButton } from "@/components/StreakButton";
import { WakeUpEditModal } from "@/components/WakeUpEditModal";
import { useConsistencyStore } from "@/store/consistencyStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Palette, Radius } from "@/constants/theme";
import type { AlarmDay, City, Location } from "@/types";
import { detectLocationChange, requestGPSLocation } from "@/utils/location";
import { getNextSleepSession, isConfirmationWindowOpen, todayISODate } from "@/utils/prayerTimes";
import { rebuildScheduleOnAppOpen, type RebuildSettings } from "@/utils/scheduling";

const HomeScreen = () => {
  const location = useSettingsStore((state) => state.location);

  if (!location) {
    return <Redirect href="/onboarding" />;
  }

  return <HomeScreenContent />;
};

export default HomeScreen;

function formatPrayerTime(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

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
  const [editSheet, setEditSheet] = useState<'bedtime' | 'wakeup' | null>(null);
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

  useFocusEffect(
    useCallback(() => {
      async function rebuild() {
        const s = useSettingsStore.getState();
        if (!s.location) return;
        const next = await rebuildScheduleOnAppOpen({
          location: s.location,
          calculationMethod: s.calculationMethod,
          adhanRecitation: s.adhanRecitation,
          preAlarmOffsetMinutes: s.preAlarmOffsetMinutes,
          alarmEnabled: s.alarmEnabled,
          sleepReminderEnabled: s.sleepReminderEnabled,
          desiredSleepHours: s.desiredSleepHours,
        });
        setSchedule(next);
        checkConfirmationWindow(next);
      }
      void rebuild();
    }, [checkConfirmationWindow]),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      checkConfirmationWindow(schedule);
    }, 60_000);
    return () => clearInterval(id);
  }, [schedule, checkConfirmationWindow]);

  const nextFajr = schedule.find((d) => d.fajrTime.getTime() > Date.now());
  const sleepSession = getNextSleepSession(schedule, settings.desiredSleepHours, now);

  async function rebuildFromSettings(overrides: Partial<RebuildSettings> = {}) {
    const s = useSettingsStore.getState();
    const newSchedule = await rebuildScheduleOnAppOpen({
      location: s.location!,
      calculationMethod: s.calculationMethod,
      adhanRecitation: s.adhanRecitation,
      preAlarmOffsetMinutes: s.preAlarmOffsetMinutes,
      alarmEnabled: s.alarmEnabled,
      sleepReminderEnabled: s.sleepReminderEnabled,
      desiredSleepHours: s.desiredSleepHours,
      ...overrides,
    });
    setSchedule(newSchedule);
    checkConfirmationWindow(newSchedule);
  }

  async function applyLocationChange(loc: Location) {
    useSettingsStore.getState().setLocation(loc);
    await rebuildFromSettings({ location: loc });
  }

  async function handleBedTimeChange(sleepHours: number) {
    useSettingsStore.getState().setDesiredSleepHours(sleepHours);
    await rebuildFromSettings({ desiredSleepHours: sleepHours });
  }

  async function handleWakeTimeChange(offsetMinutes: number) {
    useSettingsStore.getState().setPreAlarmOffset(offsetMinutes);
    await rebuildFromSettings({ preAlarmOffsetMinutes: offsetMinutes });
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
        {/* Nav */}
        <View style={styles.header}>
          <Pressable
            style={styles.headerLocation}
            onPress={() => setPickerOpen(true)}
            accessibilityLabel="Change location"
          >
            <Icon icon={MapPin} size={15} color={Palette.gold} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location.cityName}, {location.country}
            </Text>
            <Icon icon={ChevronRight} size={14} color={Palette.textMuted} />
          </Pressable>
          <View style={styles.navIcons}>
            <Pressable
              style={styles.navButton}
              onPress={() => router.push("/settings")}
              accessibilityLabel="Settings"
            >
              <Icon icon={Settings} size={17} color={Palette.gold} />
            </Pressable>
            <Pressable
              style={styles.navButton}
              onPress={() => router.push("/consistency")}
              accessibilityLabel="Prayer consistency"
            >
              <Icon icon={Flame} size={18} color={Palette.gold} />
            </Pressable>
          </View>
        </View>

        {/* Main */}
        <View style={styles.main}>
          <View style={styles.heroStack}>
            <View style={styles.infoSection}>
              <Text style={styles.prayerLabel}>Next Fajr</Text>
              <Text style={styles.prayerTime}>
                {nextFajr ? formatPrayerTime(nextFajr.fajrTime) : '—'}
              </Text>
              <StreakButton
                streak={streak}
                onPress={() => router.push("/consistency")}
              />
            </View>

            <SleepScheduleCard
              bedTime={sleepSession?.bedTime ?? null}
              wakeTime={sleepSession?.wakeTime ?? null}
              bedEnabled={settings.sleepReminderEnabled}
              wakeEnabled={settings.alarmEnabled}
              onBedPress={() => setEditSheet('bedtime')}
              onWakePress={() => setEditSheet('wakeup')}
            />

            <View style={styles.clockSection}>
              <SleepWakeClock
                bedTime={sleepSession?.bedTime ?? null}
                wakeTime={sleepSession?.wakeTime ?? null}
                fajrTime={sleepSession?.fajrTime ?? null}
                sunriseTime={sleepSession?.sunriseTime ?? null}
                durationMs={sleepSession?.durationMs}
                bedEnabled={settings.sleepReminderEnabled}
                wakeEnabled={settings.alarmEnabled}
                onBedTimeChange={handleBedTimeChange}
                onWakeTimeChange={handleWakeTimeChange}
              />
            </View>
          </View>

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
      </SafeAreaView>

      <CityPickerModal
        visible={pickerOpen}
        title="Change Location"
        onClose={() => setPickerOpen(false)}
        onSelect={handleCityPick}
      />

      <BedtimeEditModal
        visible={editSheet === 'bedtime'}
        onClose={() => setEditSheet(null)}
        schedule={schedule}
        onScheduleChange={(s) => {
          setSchedule(s);
          checkConfirmationWindow(s);
        }}
        now={now}
      />
      <WakeUpEditModal
        visible={editSheet === 'wakeup'}
        onClose={() => setEditSheet(null)}
        schedule={schedule}
        onScheduleChange={(s) => {
          setSchedule(s);
          checkConfirmationWindow(s);
        }}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  headerLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Palette.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    alignSelf: "flex-start",
    flexShrink: 1,
    maxWidth: "100%",
  },
  navIcons: { flexDirection: "row", gap: 10 },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Palette.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },


  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },

  heroStack: {
    gap: 20,
    paddingTop: 48,
  },

  infoSection: {
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  prayerLabel: {
    color: Palette.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  prayerTime: {
    color: Palette.gold,
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 60,
    textAlign: 'center',
  },
  locationText: {
    color: Palette.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    flexShrink: 1,
  },

  clockSection: {
    alignItems: "center",
  },

  confirmCard: {
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    padding: 20,
    gap: 10,
    alignItems: "center",
  },
  confirmTitle: {
    color: Palette.gold,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
  },
  confirmHint: { color: Palette.textSecondary, fontSize: 14 },
});
