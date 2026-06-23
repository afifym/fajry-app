import { StyleSheet, Text, View } from 'react-native';

type Props = {
  streak: number;
};

export const StreakCard = ({ streak }: Props) => {
  const hint =
    streak === 0
      ? 'Confirm Fajr to begin your streak.'
      : 'Consecutive days with Fajr confirmed.';

  return (
    <View style={s.card}>
      <View style={s.left}>
        <Text style={s.label}>STREAK</Text>
        <Text style={s.hint}>{hint}</Text>
      </View>
      <View style={s.right}>
        <Text style={s.value}>{streak}</Text>
        <Text style={s.unit}>{streak === 1 ? 'day' : 'days'}</Text>
      </View>
    </View>
  );
};

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
  left: { flex: 1, gap: 4 },
  label: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  hint: {
    color: '#4A5568',
    fontSize: 13,
    lineHeight: 18,
  },
  right: { flexDirection: 'row', alignItems: 'baseline' },
  value: { color: '#06B6D4', fontSize: 36, fontWeight: '300' },
  unit: { color: '#8892A4', fontSize: 14, marginLeft: 4 },
});
