import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { CitySearchList } from '@/components/CityPickerModal';
import { useSettingsStore } from '@/store/settingsStore';
import { inferRegionalDefault, requestGPSLocation } from '@/utils/location';
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

const OnboardingScreen = () => {
  const [step, setStep] = useState<Step>('intro');
  const [query, setQuery] = useState('');

  useEffect(() => {
    useSettingsStore.getState().setCalculationMethod(DEFAULT_METHOD);
  }, []);

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
        </View>

        <CitySearchList
          query={query}
          onQueryChange={setQuery}
          onSelect={handleCitySelected}
          autoFocus
          searchPlaceholder="City name…"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060C1A' },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 32, justifyContent: 'center', gap: 28 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },

  hero: { gap: 4 },
  title: { color: '#ffffff', fontSize: 48, fontWeight: '700', letterSpacing: -1 },
  tagline: { color: '#5A5E6A', fontSize: 18, fontWeight: '500' },

  body: { color: '#9EA3AD', fontSize: 16, lineHeight: 26 },

  methodCard: {
    backgroundColor: '#0D1526',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#1E2D4A',
    padding: 20,
    gap: 6,
  },
  methodLabel: { color: '#C9A84C', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  methodValue: { color: '#ffffff', fontSize: 16, fontWeight: '500' },
  methodHint: { color: '#4A5568', fontSize: 13 },

  cta: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: { color: '#000000', fontSize: 17, fontWeight: '600' },

  loadingText: { color: '#9EA3AD', fontSize: 16, marginTop: 8 },

  searchHeader: { padding: 24, gap: 14 },
});
