import { StyleSheet, Switch, Text, View } from 'react-native';

import { Bed, Icon } from '@/components/Icon';
import { AlarmEditSheet } from '@/components/AlarmEditSheet';
import { TimeWheelPicker } from '@/components/TimeWheelPicker';
import { useSettingsStore } from '@/store/settingsStore';
import {
  bedtimeFromSleepHours,
  sleepHoursFromBedtime,
} from '@/utils/alarmPickerTime';
import { getNextBedtime } from '@/utils/prayerTimes';
import type { AlarmDay } from '@/types';
import { rebuildScheduleOnAppOpen } from '@/utils/scheduling';

type Props = {
  visible: boolean;
  onClose: () => void;
  schedule: AlarmDay[];
  onScheduleChange: (schedule: AlarmDay[]) => void;
  now: Date;
};

function formatTime(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

function formatSleepHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function sleepHint(hours: number, enabled: boolean): string {
  if (!enabled) return 'Reminder off';
  const label = hours === 1 ? '1 hr' : `${formatSleepHours(hours)} hr`;
  return `${label} before Fajr`;
}

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

  async function handleSleepHoursChange(hours: number) {
    const clamped = Math.max(0.5, Math.min(12, Math.round(hours * 2) / 2));
    useSettingsStore.getState().setDesiredSleepHours(clamped);
    const next = await applyAndRebuild({ desiredSleepHours: clamped });
    if (next) onScheduleChange(next);
  }

  async function handleReminderToggle(enabled: boolean) {
    useSettingsStore.getState().setSleepReminderEnabled(enabled);
    const next = await applyAndRebuild({ sleepReminderEnabled: enabled });
    if (next) onScheduleChange(next);
  }

  const nextFajr = schedule.find((d) => d.fajrTime.getTime() > Date.now());
  const bedTime = getNextBedtime(schedule, settings.desiredSleepHours, now);
  const pickerValue = bedTime
    ?? (nextFajr ? bedtimeFromSleepHours(nextFajr.fajrTime, settings.desiredSleepHours) : new Date());

  function handleBedtimeChange(date: Date) {
    if (!nextFajr) return;
    void handleSleepHoursChange(sleepHoursFromBedtime(nextFajr.fajrTime, date));
  }

  const minBed = nextFajr ? bedtimeFromSleepHours(nextFajr.fajrTime, 12) : undefined;
  const maxBed = nextFajr ? bedtimeFromSleepHours(nextFajr.fajrTime, 0.5) : undefined;

  return (
    <AlarmEditSheet visible={visible} onClose={onClose} title="Go to Bed">
      <View style={s.body}>
        <View style={s.labelRow}>
          <Icon icon={Bed} size={14} color="#C9A84C" />
          <Text style={s.label}>GO TO BED</Text>
        </View>
        <Text style={[s.time, !settings.sleepReminderEnabled && s.timeMuted]}>
          {bedTime ? formatTime(bedTime) : '—'}
        </Text>
        <Text style={s.hint}>
          {sleepHint(settings.desiredSleepHours, settings.sleepReminderEnabled)}
        </Text>

        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Sleep reminder</Text>
          <Switch
            value={settings.sleepReminderEnabled}
            onValueChange={(v) => void handleReminderToggle(v)}
            trackColor={{ true: '#C9A84C', false: '#253352' }}
            accessibilityLabel="Sleep reminder"
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
          Set when the nightly reminder fires. Includes a rotating Reflection in the notification.
        </Text>
      </View>
    </AlarmEditSheet>
  );
}

const s = StyleSheet.create({
  body: { alignItems: 'center', gap: 12, paddingBottom: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  time: { color: '#ffffff', fontSize: 36, fontWeight: '300' },
  timeMuted: { opacity: 0.45 },
  hint: { color: '#4A5568', fontSize: 14 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  toggleLabel: { color: '#8892A4', fontSize: 14, flex: 1 },
  footerHint: {
    color: '#4A5568',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingTop: 4,
  },
});
