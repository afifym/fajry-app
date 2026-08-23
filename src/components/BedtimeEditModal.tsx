import { Platform, StyleSheet, View, Text } from "react-native";


import { AlarmEditSheet } from "@/components/AlarmEditSheet";
import { GoldSwitch } from "@/components/GoldSwitch";
import { Bed, Icon } from "@/components/Icon";
import { TimeWheelPicker } from "@/components/TimeWheelPicker";
import { Palette } from "@/constants/theme";
import { useSettingsStore } from "@/store/settingsStore";
import type { AlarmDay } from "@/types";
import {
  bedtimeFromSleepHours,
  maxDesiredSleepHours,
  sleepHoursFromBedtime,
  snapToFiveMinutes,
} from "@/utils/alarmPickerTime";
import { getNextSleepSession } from "@/utils/prayerTimes";
import { rebuildScheduleOnAppOpen } from "@/utils/scheduling";

type Props = {
  visible: boolean;
  onClose: () => void;
  schedule: AlarmDay[];
  onScheduleChange: (schedule: AlarmDay[]) => void;
  now: Date;
};

async function applyAndRebuild(
  overrides: {
    sleepReminderEnabled?: boolean;
    desiredSleepHours?: number;
  } = {},
) {
  const s = useSettingsStore.getState();
  if (!s.location) return null;
  return rebuildScheduleOnAppOpen({
    location: s.location,
    calculationMethod: s.calculationMethod,
    adhanRecitation: s.adhanRecitation,
    preAlarmOffsetMinutes: s.preAlarmOffsetMinutes,
    alarmEnabled: s.alarmEnabled,
    sleepReminderEnabled: s.sleepReminderEnabled,
    desiredSleepHours: s.desiredSleepHours,
    ...overrides,
  });
}

export function BedtimeEditModal({
  visible,
  onClose,
  schedule,
  onScheduleChange,
  now,
}: Props) {
  const settings = useSettingsStore();
  const nextFajr = schedule.find((d) => d.fajrTime.getTime() > Date.now());

  async function handleSleepHoursChange(hours: number) {
    const minutes = snapToFiveMinutes(Math.round(hours * 60));
    const maxMinutes = nextFajr
      ? Math.round(maxDesiredSleepHours(nextFajr.fajrTime) * 60)
      : 12 * 60;
    const clamped = Math.max(30, Math.min(maxMinutes, minutes)) / 60;
    useSettingsStore.getState().setDesiredSleepHours(clamped);
    const next = await applyAndRebuild({ desiredSleepHours: clamped });
    if (next) onScheduleChange(next);
  }

  async function handleReminderToggle(enabled: boolean) {
    useSettingsStore.getState().setSleepReminderEnabled(enabled);
    const next = await applyAndRebuild({ sleepReminderEnabled: enabled });
    if (next) onScheduleChange(next);
  }

  const sleepSession = getNextSleepSession(
    schedule,
    settings.desiredSleepHours,
    now,
  );
  const bedTime = sleepSession?.bedTime ?? null;
  const pickerValue =
    bedTime ??
    (nextFajr
      ? bedtimeFromSleepHours(nextFajr.fajrTime, settings.desiredSleepHours)
      : new Date());

  function handleBedtimeChange(date: Date) {
    if (!nextFajr) return;
    void handleSleepHoursChange(sleepHoursFromBedtime(nextFajr.fajrTime, date));
  }

  const minBed = nextFajr
    ? bedtimeFromSleepHours(nextFajr.fajrTime, maxDesiredSleepHours(nextFajr.fajrTime))
    : undefined;
  const maxBed = nextFajr
    ? bedtimeFromSleepHours(nextFajr.fajrTime, 0.5)
    : undefined;

  return (
    <AlarmEditSheet visible={visible} onClose={onClose}>
      <View style={s.body}>
        <View style={s.toggleRow}>
          <View style={s.labelRow}>
            <Icon icon={Bed} size={16} color={Palette.gold} />
            <Text style={s.label}>BEDTIME REMINDER</Text>
          </View>
          <GoldSwitch
            value={settings.sleepReminderEnabled}
            onValueChange={(v) => void handleReminderToggle(v)}
            accessibilityLabel="Bedtime reminder"
          />
        </View>

        <TimeWheelPicker
          value={pickerValue}
          onValueChange={handleBedtimeChange}
          minimumDate={minBed}
          maximumDate={maxBed}
          disabled={!settings.sleepReminderEnabled}
        />

        <Text style={s.footerHint}>
          Set when the nightly reminder fires. Includes a rotating Reflection in
          the notification.
        </Text>
      </View>
    </AlarmEditSheet>
  );
}

const s = StyleSheet.create({
  body: { alignItems: "center", gap: 12, paddingBottom: 8 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: {
    color: Palette.gold,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
    marginBottom: Platform.OS === "android" ? 28 : 0,
  },
  footerHint: {
    color: Palette.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    paddingTop: 4,
  },
});
