import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { CityPickerModal } from "@/components/CityPickerModal";
import { BedtimeEditModal } from "@/components/BedtimeEditModal";
import { SleepWakeClock } from "@/components/SleepWakeClock";
import { GoToBedCard } from "@/components/GoToBedCard";
import { StreakButton } from "@/components/StreakButton";
import { Icon, ChevronRight, Moon, Settings } from "@/components/Icon";
import { HomeBg } from "@/components/HomeBg";
import { SlideToConfirm } from "@/components/SlideToConfirm";
import { WakeUpCard } from "@/components/WakeUpCard";
import { WakeUpEditModal } from "@/components/WakeUpEditModal";
import { useConsistencyStore } from "@/store/consistencyStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { AlarmDay, City, Location } from "@/types";
import { detectLocationChange, requestGPSLocation } from "@/utils/location";
import { getNextBedtime, isConfirmationWindowOpen, todayISODate } from "@/utils/prayerTimes";
import { rebuildScheduleOnAppOpen, type RebuildSettings } from "@/utils/scheduling";

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

function formatFajrTime(date: Date): string {
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
  const nextAlarm = schedule.find((d) => d.alarmTime.getTime() > Date.now());
  const nextBedtime = getNextBedtime(schedule, settings.desiredSleepHours, now);

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
          <View style={styles.headerSpacer} />
          <View style={styles.navIcons}>
            <Pressable
              style={styles.navButton}
              onPress={() => router.push("/settings")}
              accessibilityLabel="Settings"
            >
              <Icon icon={Settings} size={17} />
            </Pressable>
            <Pressable
              style={styles.navButton}
              onPress={() => router.push("/consistency")}
              accessibilityLabel="Prayer consistency"
            >
              <Icon icon={Moon} size={18} />
            </Pressable>
          </View>
        </View>

        {/* Main */}
        <View style={styles.main}>
          <View style={styles.infoSection}>
            <View style={styles.infoLeft}>
              <Text style={styles.dateText}>{formatTodayLabel(now)}</Text>
              <Text style={styles.fajrTime}>
                {nextFajr ? formatFajrTime(nextFajr.fajrTime) : '—'}
              </Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                accessibilityLabel="Change location"
              >
                <View style={styles.locationRow}>
                  <Text style={styles.locationText} numberOfLines={1}>
                    <Text style={styles.locationIn}>in </Text>
                    {location.cityName}, {location.country}
                  </Text>
                  <Icon icon={ChevronRight} size={14} color="#4A5568" />
                </View>
              </Pressable>
            </View>

            <StreakButton
              streak={streak}
              onPress={() => router.push("/consistency")}
            />
          </View>

          {/* Clock ring */}
          <View style={styles.clockSection}>
            <SleepWakeClock
              bedTime={nextBedtime}
              wakeTime={nextAlarm?.alarmTime ?? null}
              bedEnabled={settings.sleepReminderEnabled}
              wakeEnabled={settings.alarmEnabled}
            />
          </View>

          {/* Bottom: streak card + optional confirm */}
          <View style={styles.bottomSection}>
            <View style={styles.alarmCardsRow}>
              <GoToBedCard
                bedTime={nextBedtime}
                enabled={settings.sleepReminderEnabled}
                onPress={() => setEditSheet('bedtime')}
              />
              <WakeUpCard
                wakeTime={nextAlarm?.alarmTime ?? null}
                enabled={settings.alarmEnabled}
                onPress={() => setEditSheet('wakeup')}
              />
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
  root: { flex: 1, backgroundColor: "#060C1A" },
  safe: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerSpacer: { flex: 1 },
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
    color: "#4A5568",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },

  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 12,
    gap: 16,
  },
  infoLeft: { flex: 1, gap: 6 },
  fajrTime: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 46,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    flexShrink: 1,
  },
  locationText: { color: "#8892A4", fontSize: 14, fontWeight: "500", flexShrink: 1 },
  locationIn: { color: "#4A5568", fontWeight: "400" },

  clockSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  bottomSection: {
    gap: 12,
  },

  alarmCardsRow: {
    flexDirection: 'row',
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
});
