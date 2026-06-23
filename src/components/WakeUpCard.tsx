import { StyleSheet, Text, View } from 'react-native';

import { AlarmClock, Icon } from '@/components/Icon';

type Props = {
  wakeTime: Date | null;
  offsetMinutes: number;
};

function formatTime(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

function offsetLabel(minutes: number): string {
  if (minutes === 0) return 'At Fajr time';
  if (minutes === 1) return '1 min before Fajr';
  return `${minutes} min before Fajr`;
}

export const WakeUpCard = ({ wakeTime, offsetMinutes }: Props) => (
  <View style={s.card}>
    <View style={s.labelRow}>
      <Icon icon={AlarmClock} size={14} color="#C9A84C" />
      <Text style={s.label}>WAKE UP</Text>
    </View>
    <View style={s.right}>
      <Text style={s.time}>{wakeTime ? formatTime(wakeTime) : '—'}</Text>
      <Text style={s.hint}>{offsetLabel(offsetMinutes)}</Text>
    </View>
  </View>
);

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D1526',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2D4A',
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  right: { alignItems: 'flex-end', gap: 2 },
  time: { color: '#ffffff', fontSize: 22, fontWeight: '300' },
  hint: { color: '#4A5568', fontSize: 12 },
});
