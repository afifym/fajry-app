import { StyleSheet, Text, View } from 'react-native';
import { CountdownTimer } from './CountdownTimer';
import type { AlarmDay } from '@/types';

type Props = {
  slots: AlarmDay[];
};

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

export function AlarmSlot({ slots }: Props) {
  const next = slots.find((d) => d.alarmTime.getTime() > Date.now());

  if (!next) {
    return (
      <View style={styles.card}>
        <Text style={styles.noAlarm}>No upcoming alarm</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>FAJR</Text>
      <Text style={styles.time}>{formatTime(next.alarmTime)}</Text>
      <Text style={styles.countdownLabel}>in</Text>
      <CountdownTimer targetTime={next.alarmTime} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0E0E0E',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2028',
    padding: 32,
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  label: {
    color: '#4B5060',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  time: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '200',
    letterSpacing: -1,
  },
  countdownLabel: {
    color: '#4B5060',
    fontSize: 13,
    marginTop: 4,
  },
  noAlarm: {
    color: '#5A5E6A',
    fontSize: 16,
  },
});
