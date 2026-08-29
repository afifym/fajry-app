import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CityPickerModal } from "@/components/CityPickerModal";
import { HomeBg } from "@/components/HomeBg";
import { OptionPickerModal } from "@/components/OptionPickerModal";
import { ChevronRight, Back, Icon } from "@/components/Icon";
import { Palette, Radius } from "@/constants/theme";
import { useSettingsStore } from "@/store/settingsStore";
import type { AdhanRecitation, CalculationMethodKey, City } from "@/types";
import { rebuildScheduleOnAppOpen, scheduleTestAlarm, TEST_ALARM_DELAY_MS } from "@/utils/scheduling";
import { resetAppFlow } from "@/utils/resetAppFlow";

const CALCULATION_METHODS: { key: CalculationMethodKey; label: string }[] = [
  { key: "MuslimWorldLeague", label: "Muslim World League" },
  { key: "Egyptian", label: "Egyptian General Authority" },
  { key: "Karachi", label: "Univ. of Islamic Sciences, Karachi" },
  { key: "UmmAlQura", label: "Umm Al-Qura, Makkah" },
  { key: "Dubai", label: "Dubai" },
  { key: "MoonsightingCommittee", label: "Moonsighting Committee" },
  { key: "NorthAmerica", label: "ISNA (North America)" },
  { key: "Kuwait", label: "Kuwait" },
  { key: "Qatar", label: "Qatar" },
  { key: "Singapore", label: "MUIS Singapore" },
  { key: "Tehran", label: "Inst. of Geophysics, Tehran" },
  { key: "Turkey", label: "Turkey" },
  { key: "Other", label: "Other" },
];

const ADHAN_RECITATIONS: { key: AdhanRecitation; label: string }[] = [
  { key: "makkah", label: "Makkah" },
  { key: "madinah", label: "Madinah" },
  { key: "mishary", label: "Mishary Rashid Alafasy" },
];

async function applyAndRebuild(
  settings: ReturnType<typeof useSettingsStore.getState>,
) {
  if (!settings.location) return;
  await rebuildScheduleOnAppOpen({
    location: settings.location,
    calculationMethod: settings.calculationMethod,
    adhanRecitation: settings.adhanRecitation,
    preAlarmOffsetMinutes: settings.preAlarmOffsetMinutes,
    alarmEnabled: settings.alarmEnabled,
    sleepReminderEnabled: settings.sleepReminderEnabled,
    desiredSleepHours: settings.desiredSleepHours,
  });
}

const TEST_ALARM_DELAY_SECONDS = TEST_ALARM_DELAY_MS / 1_000;

const SettingsScreen = () => {
  const settings = useSettingsStore();
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [recitationModalOpen, setRecitationModalOpen] = useState(false);
  const [testCountdown, setTestCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (testCountdown === null || testCountdown <= 0) return;

    const timer = setTimeout(() => {
      setTestCountdown((current) => {
        if (current === null || current <= 1) return null;
        return current - 1;
      });
    }, 1_000);

    return () => clearTimeout(timer);
  }, [testCountdown]);

  const handleTestAlarm = useCallback(async () => {
    if (testCountdown !== null) return;

    await scheduleTestAlarm();
    setTestCountdown(TEST_ALARM_DELAY_SECONDS);
  }, [testCountdown]);

  const handleMethodSelect = useCallback(async (key: CalculationMethodKey) => {
    useSettingsStore.getState().setCalculationMethod(key);
    setMethodModalOpen(false);
    await applyAndRebuild(useSettingsStore.getState());
  }, []);

  const handleRecitationSelect = useCallback(async (key: AdhanRecitation) => {
    useSettingsStore.getState().setAdhanRecitation(key);
    setRecitationModalOpen(false);
    await applyAndRebuild(useSettingsStore.getState());
  }, []);

  const handleStartOver = useCallback(() => {
    Alert.alert(
      "Start over?",
      "You'll go through the welcome screens again. Permissions you've already allowed won't be asked again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Over",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await resetAppFlow();
              if (router.canDismiss()) router.dismissAll();
              router.replace("/onboarding");
            })();
          },
        },
      ],
    );
  }, []);

  const handleCitySelect = useCallback(async (city: City) => {
    useSettingsStore.getState().setLocation({
      lat: city.lat,
      lng: city.lng,
      cityName: city.name,
      country: city.country,
    });
    setCityModalOpen(false);
    await applyAndRebuild(useSettingsStore.getState());
  }, []);

  const currentMethodLabel =
    CALCULATION_METHODS.find((m) => m.key === settings.calculationMethod)
      ?.label ?? settings.calculationMethod;
  const currentRecitationLabel =
    ADHAN_RECITATIONS.find((r) => r.key === settings.adhanRecitation)?.label ??
    settings.adhanRecitation;

  return (
    <SafeAreaView style={st.root}>
      <HomeBg />
      <View style={st.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back">
          <View style={st.buttonOutline}>
            <View style={st.backBtn}>
              <Icon icon={Back} size={24} weight="regular" color={Palette.text} />
            </View>
          </View>
        </Pressable>
        <Text style={st.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={st.content}>
        <View style={st.outline}>
          <View style={st.sectionCard}>
            <SettingRow label="Calculation Method" isLast={false}>
              <Pressable
                onPress={() => setMethodModalOpen(true)}
                style={st.picker}
              >
                <Text style={st.pickerValue} numberOfLines={1}>
                  {currentMethodLabel}
                </Text>
                <Icon icon={ChevronRight} size={24} color={Palette.gold} />
              </Pressable>
            </SettingRow>

            <SettingRow label="Adhan Recitation" isLast={false}>
              <Pressable
                onPress={() => setRecitationModalOpen(true)}
                style={st.picker}
              >
                <Text style={st.pickerValue}>{currentRecitationLabel}</Text>
                <Icon icon={ChevronRight} size={24} color={Palette.gold} />
              </Pressable>
            </SettingRow>

            <SettingRow label="City" isLast>
              <Pressable onPress={() => setCityModalOpen(true)} style={st.picker}>
                <Text style={st.pickerValue} numberOfLines={1}>
                  {settings.location
                    ? `${settings.location.cityName}, ${settings.location.country}`
                    : "Not set"}
                </Text>
                <Icon icon={ChevronRight} size={24} color={Palette.gold} />
              </Pressable>
            </SettingRow>
          </View>
        </View>

        <Pressable
          style={[st.testAlarmBtn, testCountdown !== null && st.testAlarmBtnDisabled]}
          onPress={handleTestAlarm}
          disabled={testCountdown !== null}
          accessibilityLabel="Test alarm"
        >
          <Text style={st.testAlarmText}>
            {testCountdown !== null
              ? `Alarm in ${testCountdown}s…`
              : "Test Alarm"}
          </Text>
        </Pressable>

        <Pressable
          style={st.testAlarmBtn}
          onPress={handleStartOver}
          accessibilityLabel="Start over"
          accessibilityRole="button"
        >
          <Text style={st.startOverText}>Start Over</Text>
        </Pressable>
      </ScrollView>

      <OptionPickerModal
        visible={methodModalOpen}
        title="Calculation Method"
        options={CALCULATION_METHODS}
        selectedKey={settings.calculationMethod}
        presentationStyle="pageSheet"
        onClose={() => setMethodModalOpen(false)}
        onSelect={handleMethodSelect}
      />

      <OptionPickerModal
        visible={recitationModalOpen}
        title="Adhan Recitation"
        options={ADHAN_RECITATIONS}
        selectedKey={settings.adhanRecitation}
        presentationStyle="pageSheet"
        onClose={() => setRecitationModalOpen(false)}
        onSelect={handleRecitationSelect}
      />

      <CityPickerModal
        visible={cityModalOpen}
        title="Choose City"
        closeLabel="Done"
        presentationStyle="pageSheet"
        onClose={() => setCityModalOpen(false)}
        onSelect={handleCitySelect}
      />
    </SafeAreaView>
  );
};

export default SettingsScreen;

const SettingRow = ({
  label,
  children,
  isLast = true,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) => {
  return (
    <View style={[st.row, !isLast && st.rowDivider]}>
      <Text style={st.rowLabel}>{label}</Text>
      {children}
    </View>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  flex: { flex: 1 },

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

  content: { paddingBottom: 48, paddingHorizontal: 24, gap: 20, paddingTop: 16 },

  outline: {
    borderRadius: Radius.md + 1,
    padding: 1,
    backgroundColor: Palette.glassOutline,
  },
  sectionCard: {
    backgroundColor: Palette.bgCard,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },

  testAlarmBtn: {
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: Palette.bgCard,
  },
  testAlarmBtnDisabled: { opacity: 0.6 },
  testAlarmText: { color: Palette.gold, fontSize: 16, fontWeight: '500' },
  startOverText: { color: Palette.textSecondary, fontSize: 16, fontWeight: '500' },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.glassOutline,
  },
  rowLabel: { color: Palette.text, fontSize: 15, flex: 1 },

  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '55%',
  },
  pickerValue: { color: Palette.gold, fontSize: 15, textAlign: 'right' },
});
