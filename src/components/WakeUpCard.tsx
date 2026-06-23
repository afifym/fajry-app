import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AlarmClock, Icon, Minus, Plus } from '@/components/Icon';

type Props = {
  wakeTime: Date | null;
  offsetMinutes: number;
  onOffsetChange: (minutes: number) => void;
};

const MIN_OFFSET = 0;
const MAX_OFFSET = 60;

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

export const WakeUpCard = ({ wakeTime, offsetMinutes, onOffsetChange }: Props) => {
  const atMin = offsetMinutes <= MIN_OFFSET;
  const atMax = offsetMinutes >= MAX_OFFSET;

  return (
    <View style={s.card}>
      <View style={s.topRow}>
        <View style={s.labelRow}>
          <Icon icon={AlarmClock} size={14} color="#C9A84C" />
          <Text style={s.label}>WAKE UP</Text>
        </View>
        <Text style={s.time}>{wakeTime ? formatTime(wakeTime) : '—'}</Text>
      </View>

      <View style={s.bottomRow}>
        <Text style={s.hint}>{offsetLabel(offsetMinutes)}</Text>
        <View style={s.stepper}>
          <Pressable
            style={[s.stepBtn, atMin && s.stepBtnDisabled]}
            onPress={() => onOffsetChange(offsetMinutes - 1)}
            disabled={atMin}
            accessibilityLabel="Wake up one minute later"
          >
            <Icon icon={Minus} size={16} color={atMin ? '#4A5568' : '#8892A4'} />
          </Pressable>
          <Text style={s.stepValue}>{offsetMinutes}</Text>
          <Pressable
            style={[s.stepBtn, atMax && s.stepBtnDisabled]}
            onPress={() => onOffsetChange(offsetMinutes + 1)}
            disabled={atMax}
            accessibilityLabel="Wake up one minute earlier"
          >
            <Icon icon={Plus} size={16} color={atMax ? '#4A5568' : '#8892A4'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#0D1526',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2D4A',
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  time: { color: '#ffffff', fontSize: 22, fontWeight: '300' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: { color: '#4A5568', fontSize: 12, flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#060C1A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2D4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.45 },
  stepValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
});
