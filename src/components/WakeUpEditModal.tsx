import { StyleSheet, Switch, Text, View } from 'react-native';

import { AlarmClock, Icon } from '@/components/Icon';
import { AlarmEditSheet } from '@/components/AlarmEditSheet';
import { TimeWheelPicker } from '@/components/TimeWheelPicker';
import { Palette } from '@/constants/theme';
import { useSettingsStore } from '@/store/settingsStore';
import type { AlarmDay } from '@/types';
import { clampWakeOffsetMinutes, offsetFromWakeTime, snapToFiveMinutes, wakeTimeFromOffset } from '@/utils/alarmPickerTime';
import { rebuildScheduleOnAppOpen } from '@/utils/scheduling';

type Props = {
  visible: boolean;
  onClose: () => void;
  schedule: AlarmDay[];
  onScheduleChange: (schedule: AlarmDay[]) => void;
};

function formatTime(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

function offsetLabel(minutes: number, enabled: boolean): string {
  if (!enabled) return 'Alarm off';
  if (minutes === 0) return 'At Fajr time';
  if (minutes > 0) {
    if (minutes === 1) return '1 min before Fajr';
    return `${minutes} min before Fajr`;
  }
  const after = Math.abs(minutes);
  if (after === 1) return '1 min after Fajr';
  return `${after} min after Fajr`;
}

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

export function WakeUpEditModal({ visible, onClose, schedule, onScheduleChange }: Props) {
  const settings = useSettingsStore();

  async function handleAlarmToggle(enabled: boolean) {
    useSettingsStore.getState().setAlarmEnabled(enabled);
    const next = await applyAndRebuild({ alarmEnabled: enabled });
    if (next) onScheduleChange(next);
  }

  async function handleOffsetChange(minutes: number) {
    if (!nextFajr) return;
    const snapped = snapToFiveMinutes(minutes);
    const clamped = clampWakeOffsetMinutes(snapped, nextFajr.fajrTime, nextFajr.sunriseTime);
    useSettingsStore.getState().setPreAlarmOffset(clamped);
    const next = await applyAndRebuild({ preAlarmOffsetMinutes: clamped });
    if (next) onScheduleChange(next);
  }

  const nextFajr = schedule.find((d) => d.fajrTime.getTime() > Date.now());
  const nextAlarm = schedule.find((d) => d.alarmTime.getTime() > Date.now());
  const pickerValue = nextAlarm?.alarmTime
    ?? (nextFajr ? wakeTimeFromOffset(nextFajr.fajrTime, settings.preAlarmOffsetMinutes) : new Date());

  function handleWakeTimeChange(date: Date) {
    if (!nextFajr) return;
    void handleOffsetChange(offsetFromWakeTime(nextFajr.fajrTime, date, nextFajr.sunriseTime));
  }

  const minTime = nextFajr ? wakeTimeFromOffset(nextFajr.fajrTime, 60) : undefined;
  const maxTime = nextFajr?.sunriseTime;

  return (
    <AlarmEditSheet visible={visible} onClose={onClose} title="Wake Up">
      <View style={s.body}>
        <View style={s.labelRow}>
          <Icon icon={AlarmClock} size={14} color={Palette.gold} />
          <Text style={s.label}>WAKE UP</Text>
        </View>
        <Text style={[s.time, !settings.alarmEnabled && s.timeMuted]}>
          {nextAlarm ? formatTime(nextAlarm.alarmTime) : '—'}
        </Text>
        <Text style={s.hint}>
          {offsetLabel(settings.preAlarmOffsetMinutes, settings.alarmEnabled)}
        </Text>

        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Wake up alarm</Text>
          <Switch
            value={settings.alarmEnabled}
            onValueChange={(v) => void handleAlarmToggle(v)}
            trackColor={{ true: Palette.gold, false: Palette.border }}
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
          Set when the alarm fires. Allows time for wudu or preparation before Fajr Time.
        </Text>
      </View>
    </AlarmEditSheet>
  );
}

const s = StyleSheet.create({
  body: { alignItems: 'center', gap: 12, paddingBottom: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    color: Palette.gold,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  time: { color: Palette.gold, fontSize: 36, fontWeight: '400' },
  timeMuted: { opacity: 0.45 },
  hint: { color: Palette.textMuted, fontSize: 14 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  toggleLabel: { color: Palette.textSecondary, fontSize: 14, flex: 1 },
  footerHint: {
    color: Palette.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingTop: 4,
  },
});
