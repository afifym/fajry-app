import { Platform, StyleSheet, View, Text } from "react-native";


import { AlarmEditSheet } from "@/components/AlarmEditSheet";
import { GoldSwitch } from "@/components/GoldSwitch";
import { Bed, Icon } from "@/components/Icon";
import { TimeWheelPicker } from "@/components/TimeWheelPicker";
import { Palette } from "@/constants/theme";
import { useNotificationAuthorization } from "@/hooks/use-notification-authorization";
import { useSettingsStore } from "@/store/settingsStore";
import type { AlarmDay } from "@/types";
import {
  bedtimeFromSleepHours,
  eveningPickerBounds,
  restrictToEveningHours,
  sleepHoursFromBedtime,
  snapToFiveMinutes,
} from "@/utils/alarmPickerTime";
import { getNextSleepSession } from "@/utils/prayerTimes";
import { enableOsNotificationAccess } from "@/utils/notifications";
import { rebuildScheduleOnAppOpen } from "@/utils/scheduling";

type Props = {
  visible: boolean;
  onClose: () => void;
  schedule: AlarmDay[];
  onScheduleChange: (schedule: AlarmDay[]) => void;
  now: Date;
  /** Time shown on the bedtime card; the picker follows this when present. */
  bedTime?: Date | null;
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
  bedTime: bedTimeProp,
}: Props) {
  const settings = useSettingsStore();
  const { authorized, refresh: refreshNotifications } =
    useNotificationAuthorization();
  const reminderOn = settings.sleepReminderEnabled && authorized;
  const nextFajr = schedule.find((d) => d.fajrTime.getTime() > Date.now());

  async function handleSleepHoursChange(hours: number) {
    const snapped = snapToFiveMinutes(Math.round(hours * 60)) / 60;
    useSettingsStore.getState().setDesiredSleepHours(snapped);
    const next = await applyAndRebuild({ desiredSleepHours: snapped });
    if (next) onScheduleChange(next);
  }

  async function handleReminderToggle(enabled: boolean) {
    if (enabled) {
      const ok = await enableOsNotificationAccess();
      await refreshNotifications();
      if (!ok) return;
    }
    useSettingsStore.getState().setSleepReminderEnabled(enabled);
    const next = await applyAndRebuild({ sleepReminderEnabled: enabled });
    if (next) onScheduleChange(next);
  }

  const sleepSession = getNextSleepSession(
    schedule,
    settings.desiredSleepHours,
    now,
  );
  const pickerValue = restrictToEveningHours(
    bedTimeProp ??
      sleepSession?.bedTime ??
      (nextFajr
        ? bedtimeFromSleepHours(nextFajr.fajrTime, settings.desiredSleepHours)
        : new Date()),
  );
  const { minimumDate: minBed, maximumDate: maxBed } =
    eveningPickerBounds(pickerValue);

  function handleBedtimeChange(date: Date) {
    if (!nextFajr) return;
    void handleSleepHoursChange(
      sleepHoursFromBedtime(nextFajr.fajrTime, restrictToEveningHours(date)),
    );
  }

  return (
    <AlarmEditSheet visible={visible} onClose={onClose}>
      <View style={s.body}>
        <View style={s.toggleRow}>
          <View style={s.labelRow}>
            <Icon icon={Bed} size={16} color={Palette.gold} />
            <Text style={s.label}>BEDTIME REMINDER</Text>
          </View>
          <GoldSwitch
            value={reminderOn}
            onValueChange={(v) => void handleReminderToggle(v)}
            accessibilityLabel="Bedtime reminder"
          />
        </View>

        <TimeWheelPicker
          key={visible ? "open" : "closed"}
          value={pickerValue}
          onValueChange={handleBedtimeChange}
          minimumDate={minBed}
          maximumDate={maxBed}
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
