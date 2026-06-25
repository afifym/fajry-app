import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CitySearchList } from "@/components/CityPickerModal";
import { ElMessiriText } from "@/components/el-messiri-text";
import { GoldGradientText } from "@/components/GoldGradientText";
import { HomeBg } from "@/components/HomeBg";
import { Palette, Radius } from "@/constants/theme";
import { useSettingsStore } from "@/store/settingsStore";
import type { City, Location } from "@/types";
import { inferRegionalDefault, requestGPSLocation } from "@/utils/location";
import { requestNotificationPermissions } from "@/utils/notifications";
import { rebuildScheduleOnAppOpen } from "@/utils/scheduling";

const LOCALE_COUNTRY = (
  Intl.DateTimeFormat().resolvedOptions().locale.split("-").pop() ?? ""
).toUpperCase();
const DEFAULT_METHOD = inferRegionalDefault(LOCALE_COUNTRY);

type Step = "intro" | "loading" | "city-search";

const OnboardingScreen = () => {
  const [step, setStep] = useState<Step>("intro");
  const [query, setQuery] = useState("");

  useEffect(() => {
    useSettingsStore.getState().setCalculationMethod(DEFAULT_METHOD);
  }, []);

  async function handleGetStarted() {
    setStep("loading");
    try {
      const gpsLoc = await requestGPSLocation();
      await handleLocationResolved(gpsLoc);
    } catch {
      setStep("city-search");
    }
  }

  async function handleCitySelected(city: City) {
    const loc: Location = {
      lat: city.lat,
      lng: city.lng,
      cityName: city.name,
      country: city.country,
    };
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
    router.replace("/");
  }

  if (step === "intro") {
    return (
      <SafeAreaView style={st.root}>
        <HomeBg />
        <ScrollView contentContainerStyle={st.scrollContent} bounces={false}>
          <View style={st.hero}>
            <GoldGradientText size={64} weight="bold" reversed>
              Fajry
            </GoldGradientText>
            <ElMessiriText size={16} weight="medium" style={st.tagline}>
              Answer the Call
            </ElMessiriText>
          </View>

          <ElMessiriText size={16} weight="regular" lines={5} style={st.body}>
            A reliable Fajry alarm that works completely offline. Prayer times are
            calculated on-device using your location — no internet required.
          </ElMessiriText>

          <Pressable
            style={st.cta}
            onPress={handleGetStarted}
            accessibilityRole="button"
          >
            <ElMessiriText size={17} weight="bold" style={st.ctaText}>
              Get Started
            </ElMessiriText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === "loading") {
    return (
      <SafeAreaView style={st.root}>
        <HomeBg />
        <View style={st.centred}>
          <ActivityIndicator size="large" color={Palette.gold} />
          <ElMessiriText size={16} weight="regular" style={st.loadingText}>
            Getting your location…
          </ElMessiriText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.root}>
      <HomeBg />
      <KeyboardAvoidingView
        style={st.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={st.searchHeader}>
          <ElMessiriText size={24} weight="semiBold" style={st.searchTitle}>
            Find your city
          </ElMessiriText>
          <ElMessiriText size={15} weight="regular" lines={3} style={st.searchBody}>
            Location access was denied. Search for your city to continue.
          </ElMessiriText>
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

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 32,
    justifyContent: "center",
    gap: 24,
  },
  centred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  hero: { gap: 8, alignItems: "center" },
  tagline: {
    color: Palette.gold,
    letterSpacing: 0.5,
    textAlign: "center",
  },

  body: {
    color: Palette.textSecondary,
    lineHeight: 26,
    textAlign: "center",
  },

  cta: {
    backgroundColor: Palette.gold,
    borderRadius: Radius.md,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaText: { color: Palette.bg },

  loadingText: {
    color: Palette.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },

  searchHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  searchTitle: {
    color: Palette.text,
    textAlign: "center",
  },
  searchBody: {
    color: Palette.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
});
