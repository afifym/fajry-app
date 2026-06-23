import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Flame, Icon } from '@/components/Icon';
import { Palette } from '@/constants/theme';

type Props = {
  streak: number;
  onPress: () => void;
};

const FLAME_SIZE = 14;

export function StreakButton({ streak, onPress }: Props) {
  const unit = streak === 1 ? 'day' : 'days';
  const active = streak > 0;

  return (
    <Pressable
      style={({ pressed }) => [s.root, pressed && s.rootPressed]}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Streak, ${streak} ${unit}`}
      accessibilityHint="Opens your prayer consistency calendar"
    >
      <View style={s.row}>
        <Icon
          icon={Flame}
          size={FLAME_SIZE}
          color={active ? Palette.gold : Palette.textMuted}
        />
        <Text style={s.line}>
          <Text style={[s.count, !active && s.countMuted]}>{streak} </Text>
          <Text style={s.label}>{unit} streak</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
  },
  rootPressed: {
    opacity: 0.72,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  line: {
    fontSize: 14,
    fontWeight: '500',
  },
  count: {
    color: Palette.gold,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  countMuted: {
    color: Palette.textMuted,
  },
  label: {
    color: Palette.textSecondary,
  },
});
