import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConsistencyCalendar } from '@/components/ConsistencyCalendar';
import { HomeBg } from '@/components/HomeBg';
import { useConsistencyStore } from '@/store/consistencyStore';

const ConsistencyScreen = () => {
  const streak = useConsistencyStore((state) => state.streak);

  return (
    <SafeAreaView style={s.root}>
      <HomeBg />
      <View style={s.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </Pressable>
        <Text style={s.title}>Consistency</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.streakCard}>
          <Text style={s.streakLabel}>STREAK</Text>
          <View style={s.streakRight}>
            <Text style={s.streakValue}>{streak}</Text>
            <Text style={s.streakUnit}> {streak === 1 ? 'day' : 'days'}</Text>
          </View>
        </View>

        <Text style={s.streakHint}>
          {streak === 0
            ? 'Confirm your first prayer to begin.'
            : 'Consecutive days with a confirmed Fajr.'}
        </Text>

        <View style={s.calendarCard}>
          <ConsistencyCalendar />
        </View>

        <Text style={s.editHint}>
          Tap any day within the last 7 days to toggle your prayer record.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ConsistencyScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060C1A' },

  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1E2D4A',
  },
  backBtn: { marginBottom: 4 },
  backText: { color: '#8892A4', fontSize: 16 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '600' },

  content: { paddingHorizontal: 24, paddingTop: 8, gap: 12, paddingBottom: 48 },

  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D1526',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2D4A',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  streakLabel: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
  },
  streakRight: { flexDirection: 'row', alignItems: 'baseline' },
  streakValue: { color: '#06B6D4', fontSize: 36, fontWeight: '300' },
  streakUnit: { color: '#8892A4', fontSize: 14 },
  streakHint: { color: '#4A5568', fontSize: 13, textAlign: 'center' },

  calendarCard: {
    backgroundColor: '#0D1526',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2D4A',
    padding: 20,
    marginTop: 4,
  },

  editHint: {
    color: '#4A5568',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
