import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/theme';

type Props = {
  bedTime: Date | null;
  wakeTime: Date | null;
  bedEnabled: boolean;
  wakeEnabled: boolean;
  onBedPress: () => void;
  onWakePress: () => void;
};

function formatTime(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

export function SleepScheduleCard({
  bedTime,
  wakeTime,
  bedEnabled,
  wakeEnabled,
  onBedPress,
  onWakePress,
}: Props) {
  return (
    <View style={s.card}>
      <Pressable
        onPress={onBedPress}
        style={s.half}
        accessibilityLabel="Edit go to bed reminder"
        accessibilityRole="button"
      >
        <Text style={s.label} numberOfLines={1}>
          GO TO BED
        </Text>
        <Text style={[s.time, !bedEnabled && s.timeMuted]} numberOfLines={1}>
          {bedTime ? formatTime(bedTime) : '—'}
        </Text>
      </Pressable>

      <View style={s.separator} />

      <Pressable
        onPress={onWakePress}
        style={s.half}
        accessibilityLabel="Edit wake up alarm"
        accessibilityRole="button"
      >
        <Text style={s.label} numberOfLines={1}>
          WAKE UP
        </Text>
        <Text style={[s.time, !wakeEnabled && s.timeMuted]} numberOfLines={1}>
          {wakeTime ? formatTime(wakeTime) : '—'}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
    overflow: 'hidden',
  },
  half: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 6,
    alignItems: 'center',
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Palette.borderSubtle,
    marginVertical: 12,
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
