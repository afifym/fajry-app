import { Platform, StyleSheet, View, Text } from "react-native";


import { AlarmEditSheet } from "@/components/AlarmEditSheet";
import { GoldSwitch } from "@/components/GoldSwitch";
import { AlarmClock, Icon } from "@/components/Icon";
import { TimeWheelPicker } from "@/components/TimeWheelPicker";
import { Palette } from "@/constants/theme";
import { useSettingsStore } from "@/store/settingsStore";
import type { AlarmDay } from "@/types";
import {
  nightFaceDateFromTime,
  nightFaceStart,
  offsetFromNightFaceWake,
  snapToFiveMinutes,
  wakeTimeFromOffset,
} from "@/utils/alarmPickerTime";
import { getNextSleepSession } from "@/utils/prayerTimes";
import { rebuildScheduleOnAppOpen } from "@/utils/scheduling";

type Props = {
  visible: boolean;
  onClose: () => void;
  schedule: AlarmDay[];
  onScheduleChange: (schedule: AlarmDay[]) => void;
  /** Time shown on the wake-up card; the picker follows this when present. */
  wakeTime?: Date | null;
};

async function applyAndRebuild(
  overrides: { preAlarmOffsetMinutes?: number; alarmEnabled?: boolean } = {},
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

export function WakeUpEditModal({
  visible,
  onClose,
  schedule,
  onScheduleChange,
  wakeTime,
}: Props) {
  const settings = useSettingsStore();

  async function handleAlarmToggle(enabled: boolean) {
    useSettingsStore.getState().setAlarmEnabled(enabled);
    const next = await applyAndRebuild({ alarmEnabled: enabled });
    if (next) onScheduleChange(next);
  }

  async function handleOffsetChange(minutes: number) {
    if (!nextFajr) return;
    const snapped = snapToFiveMinutes(minutes);
    useSettingsStore.getState().setPreAlarmOffset(snapped);
    const next = await applyAndRebuild({ preAlarmOffsetMinutes: snapped });
    if (next) onScheduleChange(next);
  }

  const nextFajr = schedule.find((d) => d.fajrTime.getTime() > Date.now());
  const sleepSession = getNextSleepSession(
    schedule,
    settings.desiredSleepHours,
  );
  const rawPickerValue =
    wakeTime ??
    sleepSession?.wakeTime ??
    (nextFajr
      ? wakeTimeFromOffset(nextFajr.fajrTime, settings.preAlarmOffsetMinutes)
      : new Date());
  const pickerValue = nextFajr
    ? nightFaceDateFromTime(nextFajr.fajrTime, rawPickerValue)
    : rawPickerValue;

  function handleWakeTimeChange(date: Date) {
    if (!nextFajr) return;
    void handleOffsetChange(
      offsetFromNightFaceWake(nextFajr.fajrTime, date, nextFajr.sunriseTime),
    );
  }

  const minTime = nextFajr ? nightFaceStart(nextFajr.fajrTime) : undefined;
  const maxTime = nextFajr?.sunriseTime;

  return (
    <AlarmEditSheet visible={visible} onClose={onClose}>
      <View style={s.body}>
        <View style={s.toggleRow}>
          <View style={s.labelRow}>
            <Icon icon={AlarmClock} size={16} color={Palette.gold} />
            <Text style={s.label}>WAKE UP ALARM</Text>
          </View>
          <GoldSwitch
            value={settings.alarmEnabled}
            onValueChange={(v) => void handleAlarmToggle(v)}
            accessibilityLabel="Wake up alarm"
          />
        </View>

        <TimeWheelPicker
          value={pickerValue}
          onValueChange={handleWakeTimeChange}
          minimumDate={minTime}
          maximumDate={maxTime}
          disabled={!settings.alarmEnabled}
        />

        <Text style={s.footerHint}>
          Set when the alarm fires. Allows time for wudu or preparation before
          Fajr Time.
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
