import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConsistencyStore } from '@/store/consistencyStore';
import { ConsistencyCalendar } from '@/components/ConsistencyCalendar';

export default function ConsistencyScreen() {
  const streak = useConsistencyStore((state) => state.streak);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </Pressable>
        <Text style={s.title}>Consistency</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.streakCard}>
          <Text style={s.streakLabel}>CURRENT STREAK</Text>
          <Text style={s.streakValue}>{streak}</Text>
          <Text style={s.streakUnit}>{streak === 1 ? 'day' : 'days'}</Text>
          <Text style={s.streakHint}>
            {streak === 0
              ? 'Confirm your first prayer to begin.'
              : 'Consecutive days with a confirmed Fajr.'}
          </Text>
        </View>

        <ConsistencyCalendar />

        <Text style={s.editHint}>
          Tap any day within the last 7 days to toggle your prayer record.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },

  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1A1C22',
  },
  backBtn: { marginBottom: 4 },
  backText: { color: '#5A5E6A', fontSize: 16 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '600' },

  content: { padding: 24, gap: 28, paddingBottom: 48 },

  streakCard: {
    backgroundColor: '#0E0E0E',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2028',
    padding: 28,
    alignItems: 'center',
    gap: 4,
  },
  streakLabel: { color: '#4B5060', fontSize: 11, fontWeight: '600', letterSpacing: 2 },
  streakValue: { color: '#ffffff', fontSize: 64, fontWeight: '200', lineHeight: 72 },
  streakUnit: { color: '#5A5E6A', fontSize: 18 },
  streakHint: { color: '#4B5060', fontSize: 13, textAlign: 'center', marginTop: 8 },

  editHint: {
    color: '#4B5060',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
