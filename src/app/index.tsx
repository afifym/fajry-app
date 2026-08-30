import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {Alert, Pressable, StyleSheet, View, Text} from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { BedtimeEditModal } from "@/components/BedtimeEditModal";
import { CityPickerModal } from "@/components/CityPickerModal";
import { GlassSurface } from "@/components/GlassSurface";
import { GoldGradientText } from "@/components/GoldGradientText";
import { HomeBg } from "@/components/HomeBg";
import { Icon, Flame, MapPin, Settings } from "@/components/Icon";
import { SleepScheduleCard } from "@/components/SleepScheduleCard";
import { SleepWakeClock } from "@/components/SleepWakeClock";
import { StreakButton } from "@/components/StreakButton";
import { WakeUpEditModal } from "@/components/WakeUpEditModal";
import { ElMessiriText } from "@/components/el-messiri-text";
import { Palette, Radius } from "@/constants/theme";
import { useStoreReviewPrompt } from "@/hooks/use-store-review-prompt";
import { useConsistencyStore } from "@/store/consistencyStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { AlarmDay, City, Location } from "@/types";
import { detectLocationChange, requestGPSLocation } from "@/utils/location";
import { toNightFaceDisplayDate } from "@/utils/clockDragTime";
import {
  getNextSleepSession,
} from "@/utils/prayerTimes";
import {
  rebuildScheduleOnAppOpen,
  type RebuildSettings,
} from "@/utils/scheduling";

const HomeScreen = () => {
  const location = useSettingsStore((state) => state.location);

  if (!location) {
    return <Redirect href="/onboarding" />;
  }

  return <HomeScreenContent />;
};

export default HomeScreen;

function formatPrayerTimeParts(date: Date): { time: string; period: "AM" | "PM" } {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, "0");
  return {
    time: `${h}:${m}`,
    period: date.getHours() >= 12 ? "PM" : "AM",
  };
}

const HomeScreenContent = () => {
  const settings = useSettingsStore();
  const { streak } = useConsistencyStore();
  useStoreReviewPrompt();

  const [schedule, setSchedule] = useState<AlarmDay[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editSheet, setEditSheet] = useState<"bedtime" | "wakeup" | null>(null);
  const [clockPreview, setClockPreview] = useState<{
    bedTime: Date;
    wakeTime: Date;
  } | null>(null);
  const [now, setNow] = useState(() => new Date());

  const location = settings.location!;

  useFocusEffect(
    useCallback(() => {
      async function rebuild() {
        const s = useSettingsStore.getState();
        if (!s.location) return;
        try {
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
        } catch {
          // OS notification permission is optional — keep the last schedule on screen.
        }
      }
      void rebuild();
    }, []),
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const nextFajr = schedule.find((d) => d.fajrTime.getTime() > Date.now());
  const prayerTimeParts = nextFajr
    ? formatPrayerTimeParts(nextFajr.fajrTime)
    : null;
  const sleepSession = getNextSleepSession(
    schedule,
    settings.desiredSleepHours,
    now,
  );

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

  const handleClockPreview = useCallback((times: { bedTime: Date; wakeTime: Date } | null) => {
    setClockPreview(times);
  }, []);

  useEffect(() => {
    if (!clockPreview || !sleepSession) return;
    const sameBed =
      clockPreview.bedTime.getHours() === sleepSession.bedTime.getHours() &&
      clockPreview.bedTime.getMinutes() === sleepSession.bedTime.getMinutes();
    const sameWake =
      clockPreview.wakeTime.getHours() === sleepSession.wakeTime.getHours() &&
      clockPreview.wakeTime.getMinutes() === sleepSession.wakeTime.getMinutes();
    if (sameBed && sameWake) setClockPreview(null);
  }, [clockPreview, sleepSession]);

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
            <GlassSurface radius={Radius.sm} contentStyle={styles.headerLocationInner}>
              <Icon icon={MapPin} size={18} color={Palette.gold} />
              <Text style={styles.locationText} numberOfLines={1}>
                {location.cityName}, {location.country}
              </Text>
            </GlassSurface>
          </Pressable>
          <View style={styles.navIcons}>
            <Pressable
              onPress={() => router.push("/settings")}
              accessibilityLabel="Settings"
            >
              <GlassSurface radius={Radius.sm} contentStyle={styles.navButton}>
                <Icon icon={Settings} size={20} color={Palette.gold} />
              </GlassSurface>
            </Pressable>
            <Pressable
              onPress={() => router.push("/consistency")}
              accessibilityLabel="Prayer consistency"
            >
              <GlassSurface radius={Radius.sm} contentStyle={styles.navButton}>
                <Icon icon={Flame} size={21} color={Palette.gold} />
              </GlassSurface>
            </Pressable>
          </View>
        </View>

        {/* Main */}
        <View style={styles.main}>
          <View style={styles.heroStack}>
            <View style={styles.infoSection}>
              <View style={styles.fajrBlock}>
                <ElMessiriText
                  size={14}
                  weight="semiBold"
                  height={18}
                  style={styles.prayerLabel}
                >
                  Next Fajr
                </ElMessiriText>
                <View style={styles.prayerTimeWrap}>
                  {prayerTimeParts ? (
                    <View style={styles.prayerTimeAnchor}>
                      <GoldGradientText size={96} weight="bold" reversed>
                        {prayerTimeParts.time}
                      </GoldGradientText>
                      <View style={styles.prayerTimePeriodAnchor} pointerEvents="none">
                        <ElMessiriText
                          size={30}
                          weight="bold"
                          style={styles.prayerTimePeriod}
                        >
                          {prayerTimeParts.period}
                        </ElMessiriText>
                      </View>
                    </View>
                  ) : (
                    <ElMessiriText size={96} weight="bold" style={styles.prayerTime}>
                      —
                    </ElMessiriText>
                  )}
                </View>
              </View>
              <StreakButton
                streak={streak}
                onPress={() => router.push("/consistency")}
              />
            </View>

            <SleepScheduleCard
              bedTime={
                clockPreview?.bedTime ??
                (sleepSession
                  ? toNightFaceDisplayDate(sleepSession.bedTime, sleepSession.fajrTime)
                  : null)
              }
              wakeTime={
                clockPreview?.wakeTime ??
                (sleepSession
                  ? toNightFaceDisplayDate(sleepSession.wakeTime, sleepSession.fajrTime)
                  : null)
              }
              bedEnabled={settings.sleepReminderEnabled}
              wakeEnabled={settings.alarmEnabled}
              onBedPress={() => setEditSheet("bedtime")}
              onWakePress={() => setEditSheet("wakeup")}
            >
              <SleepWakeClock
                bedTime={clockPreview?.bedTime ?? sleepSession?.bedTime ?? null}
                wakeTime={clockPreview?.wakeTime ?? sleepSession?.wakeTime ?? null}
                fajrTime={sleepSession?.fajrTime ?? null}
                sunriseTime={sleepSession?.sunriseTime ?? null}
                durationMs={clockPreview ? undefined : sleepSession?.durationMs}
                bedEnabled={settings.sleepReminderEnabled}
                wakeEnabled={settings.alarmEnabled}
                onBedTimeChange={handleBedTimeChange}
                onWakeTimeChange={handleWakeTimeChange}
                onTimesPreview={handleClockPreview}
              />
            </SleepScheduleCard>
          </View>
        </View>
      </SafeAreaView>

      <CityPickerModal
        visible={pickerOpen}
        title="Change Location"
        closeLabel="Done"
        presentationStyle="pageSheet"
        onClose={() => setPickerOpen(false)}
        onSelect={handleCityPick}
      />

      <BedtimeEditModal
        visible={editSheet === "bedtime"}
        onClose={() => setEditSheet(null)}
        schedule={schedule}
        onScheduleChange={(s) => {
          setSchedule(s);
        }}
        now={now}
      />
      <WakeUpEditModal
        visible={editSheet === "wakeup"}
        onClose={() => setEditSheet(null)}
        schedule={schedule}
        onScheduleChange={(s) => {
          setSchedule(s);
        }}
        wakeTime={
          clockPreview?.wakeTime ??
          (sleepSession
            ? toNightFaceDisplayDate(sleepSession.wakeTime, sleepSession.fajrTime)
            : null)
        }
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
    alignSelf: "flex-start",
    flexShrink: 1,
    maxWidth: "100%",
  },
  headerLocationInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    paddingHorizontal: 14,
  },
  navIcons: { flexDirection: "row", gap: 10 },
  navButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  main: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    justifyContent: "space-between",
  },

  heroStack: {
    gap: 20,
    paddingTop: 60,
  },

  infoSection: {
    alignItems: "center",
    gap: 6,
    marginBottom: 36,
  },
  fajrBlock: {
    alignItems: "center",
    gap: 0,
  },
  prayerLabel: {
    color: Palette.textSecondary,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  prayerTime: {
    color: Palette.gold,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  prayerTimeWrap: {
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: -10,
  },
  prayerTimeAnchor: {
    position: "relative",
  },
  prayerTimePeriodAnchor: {
    position: "absolute",
    left: "100%",
    bottom: 0,
    marginLeft: 4,
  },
  prayerTimePeriod: {
    color: Palette.gold,
    letterSpacing: 0.5,
  },
  locationText: {
    color: Palette.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
  },
});
