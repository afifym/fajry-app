import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConsistencyCalendar } from '@/components/ConsistencyCalendar';
import { Icon, Back, Flame } from '@/components/Icon';
import { HomeBg } from '@/components/HomeBg';
import { Palette, Radius } from '@/constants/theme';
import { useConsistencyStore } from '@/store/consistencyStore';

const ConsistencyScreen = () => {
  const streak = useConsistencyStore((state) => state.streak);
  const active = streak > 0;

  return (
    <SafeAreaView style={s.root}>
      <HomeBg />
      <View style={s.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back">
          <View style={s.buttonOutline}>
            <View style={s.backBtn}>
              <Icon icon={Back} size={20} weight="regular" color={Palette.text} />
            </View>
          </View>
        </Pressable>
        <Text style={s.headerTitle}>Streak</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.heroStack}>
          <View style={s.infoSection}>
            <View style={s.heroRow}>
              <Icon
                icon={Flame}
                size={44}
                color={active ? Palette.gold : Palette.textMuted}
              />
              <Text style={[s.heroValue, !active && s.heroValueMuted]}>
                {streak}
              </Text>
            </View>
            <Text style={s.heroHint}>
              {streak === 0
                ? 'Confirm Fajr to start your streak.'
                : 'Consecutive days you prayed Fajr.'}
            </Text>
          </View>

          <View style={s.outline}>
            <View style={s.calendarCard}>
              <ConsistencyCalendar />
            </View>
          </View>

          <Text style={s.editHint}>
            Tap any day within the last 7 days to mark Prayed or Missed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConsistencyScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    color: Palette.text,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  buttonOutline: {
    borderRadius: Radius.sm + 1,
    padding: 1,
    backgroundColor: Palette.glassOutline,
    alignSelf: 'flex-start',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Palette.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },

  heroStack: {
    gap: 20,
  },

  infoSection: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroValue: {
    color: Palette.gold,
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 60,
    textAlign: 'center',
  },
  heroValueMuted: {
    color: Palette.textMuted,
  },
  heroHint: {
    color: Palette.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },

  outline: {
    borderRadius: Radius.md + 1,
    padding: 1,
    backgroundColor: Palette.glassOutline,
  },
  calendarCard: {
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.md,
    paddingHorizontal: 8,
    paddingVertical: 24,
  },

  editHint: {
    color: Palette.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
