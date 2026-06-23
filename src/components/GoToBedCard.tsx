import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette, Radius } from '@/constants/theme';

type Props = {
  bedTime: Date | null;
  enabled: boolean;
  onPress: () => void;
};

function formatTime(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

export const GoToBedCard = ({ bedTime, enabled, onPress }: Props) => (
  <Pressable
    onPress={onPress}
    style={s.card}
    accessibilityLabel="Edit go to bed reminder"
    accessibilityRole="button"
  >
    <Text style={s.label} numberOfLines={1}>
      GO TO BED
    </Text>
    <Text style={[s.time, !enabled && s.timeMuted]} numberOfLines={1}>
      {bedTime ? formatTime(bedTime) : '—'}
    </Text>
  </Pressable>
);

const s = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 6,
    alignItems: 'center',
  },
  label: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  time: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  timeMuted: { opacity: 0.45 },
});
