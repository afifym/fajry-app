import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useSettingsStore } from '@/store/settingsStore';
import { inferRegionalDefault, requestGPSLocation, searchCities } from '@/utils/location';
import { requestNotificationPermissions } from '@/utils/notifications';
import { rebuildScheduleOnAppOpen } from '@/utils/scheduling';
import type { City, Location } from '@/types';

const LOCALE_COUNTRY = (Intl.DateTimeFormat().resolvedOptions().locale.split('-').pop() ?? '').toUpperCase();
const DEFAULT_METHOD = inferRegionalDefault(LOCALE_COUNTRY);

const METHOD_LABEL: Record<string, string> = {
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Egyptian General Authority of Survey',
  Karachi: 'University of Islamic Sciences, Karachi',
  UmmAlQura: 'Umm Al-Qura, Makkah',
  Dubai: 'Dubai',
  MoonsightingCommittee: 'Moonsighting Committee Worldwide',
  NorthAmerica: 'Islamic Society of North America',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
  Singapore: 'Majlis Ugama Islam Singapura',
  Tehran: 'Institute of Geophysics, Tehran',
  Turkey: 'Turkey',
  Other: 'Other',
};

type Step = 'intro' | 'loading' | 'city-search';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('intro');
  const [query, setQuery] = useState('');

  useEffect(() => {
    useSettingsStore.getState().setCalculationMethod(DEFAULT_METHOD);
  }, []);

  const cityResults = useMemo(
    () => (query.length >= 2 ? searchCities(query) : []),
    [query],
  );

  async function handleGetStarted() {
    setStep('loading');
    try {
      const gpsLoc = await requestGPSLocation();
      await handleLocationResolved(gpsLoc);
    } catch {
      setStep('city-search');
    }
  }

  async function handleCitySelected(city: City) {
    const loc: Location = { lat: city.lat, lng: city.lng, cityName: city.name, country: city.country };
    await handleLocationResolved(loc);
  }

  async function handleLocationResolved(loc: Location) {
    useSettingsStore.getState().setLocation(loc);
    await requestNotificationPermissions();
    const s = useSettingsStore.getState();
    await rebuildScheduleOnAppOpen({
      location: loc,
      calculationMethod: s.calculationMethod,
      adhanRecitation: s.adhanRecitation,
      preAlarmOffsetMinutes: s.preAlarmOffsetMinutes,
      alarmEnabled: s.alarmEnabled,
      sleepReminderEnabled: s.sleepReminderEnabled,
      desiredSleepHours: s.desiredSleepHours,
    });
    router.replace('/');
  }

  if (step === 'intro') {
    return (
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={s.scrollContent} bounces={false}>
          <View style={s.hero}>
            <Text style={s.title}>Fajr</Text>
            <Text style={s.tagline}>Answer the Call</Text>
          </View>

          <Text style={s.body}>
            A reliable Fajr alarm that works completely offline. Prayer times are calculated
            on-device using your location — no internet required.
          </Text>

          <View style={s.methodCard}>
            <Text style={s.methodLabel}>Default calculation method</Text>
            <Text style={s.methodValue}>{METHOD_LABEL[DEFAULT_METHOD] ?? DEFAULT_METHOD}</Text>
            <Text style={s.methodHint}>Based on your region. Change it anytime in Settings.</Text>
          </View>

          <Pressable style={s.cta} onPress={handleGetStarted} accessibilityRole="button">
            <Text style={s.ctaText}>Get Started</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'loading') {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centred}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={s.loadingText}>Getting your location…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.searchHeader}>
          <Text style={s.title}>Find your city</Text>
          <Text style={s.body}>Location access was denied. Search for your city to continue.</Text>
          <TextInput
            style={s.searchInput}
            placeholder="City name…"
            placeholderTextColor="#4B5060"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="City search"
          />
        </View>

        <FlatList<City>
          data={cityResults}
          keyExtractor={(item) => `${item.lat}_${item.lng}`}
          renderItem={({ item }) => (
            <Pressable style={s.cityRow} onPress={() => handleCitySelected(item)}>
              <Text style={s.cityName}>{item.name}</Text>
              <Text style={s.cityCountry}>{item.country}</Text>
            </Pressable>
          )}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 32, justifyContent: 'center', gap: 28 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },

  hero: { gap: 4 },
  title: { color: '#ffffff', fontSize: 48, fontWeight: '700', letterSpacing: -1 },
  tagline: { color: '#5A5E6A', fontSize: 18, fontWeight: '500' },

  body: { color: '#9EA3AD', fontSize: 16, lineHeight: 26 },

  methodCard: {
    backgroundColor: '#0E0E0E',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2028',
    padding: 20,
    gap: 6,
  },
  methodLabel: { color: '#5A5E6A', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  methodValue: { color: '#ffffff', fontSize: 16, fontWeight: '500' },
  methodHint: { color: '#5A5E6A', fontSize: 13 },

  cta: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: { color: '#000000', fontSize: 17, fontWeight: '600' },

  loadingText: { color: '#9EA3AD', fontSize: 16, marginTop: 8 },

  searchHeader: { padding: 24, gap: 14 },
  searchInput: {
    backgroundColor: '#0E0E0E',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2E38',
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: '#ffffff',
    fontSize: 16,
  },

  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#141416',
  },
  cityName: { color: '#ffffff', fontSize: 16 },
  cityCountry: { color: '#5A5E6A', fontSize: 13 },
});
