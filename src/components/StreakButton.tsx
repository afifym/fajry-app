import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRight, Flame, Icon } from '@/components/Icon';
import { Palette, Radius } from '@/constants/theme';

type Props = {
  streak: number;
  onPress: () => void;
};

export function StreakButton({ streak, onPress }: Props) {
  const unit = streak === 1 ? 'day' : 'days';

  return (
    <Pressable
      style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Streak, ${streak} ${unit}`}
      accessibilityHint="Opens your prayer consistency calendar"
    >
      <View style={s.topRow}>
        <View style={s.labelRow}>
          <Icon icon={Flame} size={14} color={Palette.gold} />
          <Text style={s.label}>STREAK</Text>
        </View>
        <Icon icon={ChevronRight} size={14} color={Palette.textMuted} />
      </View>
      <Text style={[s.value, streak === 0 && s.valueMuted]}>{streak}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    minWidth: 92,
    backgroundColor: Palette.bgElevated,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  buttonPressed: {
    opacity: 0.88,
    borderColor: Palette.goldMuted,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  value: {
    color: Palette.gold,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  valueMuted: { color: Palette.textMuted },
});
