import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRight, Icon } from '@/components/Icon';

type Props = {
  streak: number;
  onPress: () => void;
};

export function StreakButton({ streak, onPress }: Props) {
  const unit = streak === 1 ? 'day' : 'days';

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Streak, ${streak} ${unit}`}
      accessibilityHint="Opens your prayer consistency calendar"
    >
      <View style={s.header}>
        <Text style={s.label}>STREAK</Text>
        <Icon icon={ChevronRight} size={15} color="#4A5568" />
      </View>

      <View style={s.stat}>
        <Text style={[s.value, streak === 0 && s.valueMuted]}>{streak}</Text>
        <Text style={s.unit}>{unit}</Text>
      </View>

      <Text style={s.caption}>
        {streak === 0 ? 'Tap to start' : 'Consecutive Fajrs'}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    minWidth: 112,
    backgroundColor: '#0D1526',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2D4A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  cardPressed: {
    opacity: 0.88,
    borderColor: '#06B6D4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#C9A84C',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  value: {
    color: '#06B6D4',
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
    fontVariant: ['tabular-nums'],
  },
  valueMuted: { color: '#4A5568' },
  unit: {
    color: '#8892A4',
    fontSize: 14,
    fontWeight: '500',
  },
  caption: {
    color: '#4A5568',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
});
