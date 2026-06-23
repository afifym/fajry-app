import { AlarmClock, Icon } from '@/components/Icon';
import { AlarmEditSheet } from '@/components/AlarmEditSheet';
import { TimeWheelPicker } from '@/components/TimeWheelPicker';
import { useSettingsStore } from '@/store/settingsStore';
import { offsetFromWakeTime, wakeTimeFromOffset } from '@/utils/alarmPickerTime';
import type { AlarmDay } from '@/types';
import { rebuildScheduleOnAppOpen } from '@/utils/scheduling';
import { StyleSheet, Switch, Text, View } from 'react-native';

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
  if (minutes === 1) return '1 min before Fajr';
  return `${minutes} min before Fajr`;
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
    const clamped = Math.max(0, Math.min(60, minutes));
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
    void handleOffsetChange(offsetFromWakeTime(nextFajr.fajrTime, date));
  }

  const minTime = nextFajr ? wakeTimeFromOffset(nextFajr.fajrTime, 60) : undefined;
  const maxTime = nextFajr?.fajrTime;

  return (
    <AlarmEditSheet visible={visible} onClose={onClose} title="Wake Up">
      <View style={s.body}>
        <View style={s.labelRow}>
          <Icon icon={AlarmClock} size={14} color="#C9A84C" />
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
            trackColor={{ true: '#C9A84C', false: '#253352' }}
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
