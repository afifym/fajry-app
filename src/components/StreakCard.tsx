import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  streak: number;
  confirmedToday: boolean;
  onPress: () => void;
};

export const StreakCard = ({ streak, confirmedToday, onPress }: Props) => {
  const hint = confirmedToday
    ? 'Fajr confirmed today.'
    : streak === 0
      ? 'Confirm Fajr to begin your streak.'
      : 'Consecutive days with Fajr confirmed.';

  return (
    <Pressable
      style={s.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Streak ${streak} ${streak === 1 ? 'day' : 'days'}. Open consistency calendar.`}
    >
      <View style={s.left}>
        <View style={s.labelRow}>
          <Text style={s.label}>STREAK</Text>
          {confirmedToday && (
            <View style={s.todayBadge}>
              <Text style={s.todayBadgeText}>TODAY</Text>
            </View>
          )}
        </View>
        <Text style={s.hint}>{hint}</Text>
      </View>
      <View style={s.rightGroup}>
        <View style={s.right}>
          <Text style={s.value}>{streak}</Text>
          <Text style={s.unit}>{streak === 1 ? 'day' : 'days'}</Text>
        </View>
        <Text style={s.chevron}>›</Text>
      </View>
    </Pressable>
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
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  todayBadge: {
    backgroundColor: '#06B6D4',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  todayBadgeText: {
    color: '#060C1A',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  hint: {
    color: '#4A5568',
    fontSize: 13,
    lineHeight: 18,
  },
  right: { flexDirection: 'row', alignItems: 'baseline' },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { color: '#06B6D4', fontSize: 36, fontWeight: '300' },
  unit: { color: '#8892A4', fontSize: 14, marginLeft: 4 },
  chevron: { color: '#4A5568', fontSize: 22, lineHeight: 24 },
});
