import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AlarmClock, Bed, Icon } from '@/components/Icon';
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
    <View style={s.outline}>
      <View style={s.card}>
        <Pressable
          onPress={onBedPress}
          style={s.half}
          accessibilityLabel="Edit bedtime reminder"
          accessibilityRole="button"
        >
          <View style={[s.labelRow, !bedEnabled && s.muted]}>
            <Icon icon={Bed} size={14} color={Palette.gold} />
            <Text style={s.label} numberOfLines={1}>
              BEDTIME
            </Text>
          </View>
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
          <View style={[s.labelRow, !wakeEnabled && s.muted]}>
            <Icon icon={AlarmClock} size={14} color={Palette.gold} />
            <Text style={s.label} numberOfLines={1}>
              WAKE UP
            </Text>
          </View>
          <Text style={[s.time, !wakeEnabled && s.timeMuted]} numberOfLines={1}>
            {wakeTime ? formatTime(wakeTime) : '—'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outline: {
    borderRadius: Radius.lg + 1,
    padding: 1,
    backgroundColor: Palette.glassOutline,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  half: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 6,
    alignItems: 'center',
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Palette.glassOutline,
    marginVertical: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    alignSelf: 'stretch',
  },
  label: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  time: {
    color: Palette.text,
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  timeMuted: { opacity: 0.45 },
  muted: { opacity: 0.45 },
});
