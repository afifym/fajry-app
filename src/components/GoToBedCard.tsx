import { Pressable, StyleSheet, Text } from 'react-native';

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
    backgroundColor: '#0D1526',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2D4A',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 6,
    alignItems: 'center',
  },
  label: {
    color: '#C9A84C',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  time: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '300',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  timeMuted: { opacity: 0.45 },
});
