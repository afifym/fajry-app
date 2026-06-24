import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CityPickerModal } from "@/components/CityPickerModal";
import { HomeBg } from "@/components/HomeBg";
import { Check, ChevronRight, Back, Icon } from "@/components/Icon";
import { Palette, Radius } from "@/constants/theme";
import { useSettingsStore } from "@/store/settingsStore";
import type { AdhanRecitation, CalculationMethodKey, City } from "@/types";
import { rebuildScheduleOnAppOpen } from "@/utils/scheduling";

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

const SettingsScreen = () => {
  const settings = useSettingsStore();
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [recitationModalOpen, setRecitationModalOpen] = useState(false);

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

  const handleSnoozeChange = useCallback(async (text: string) => {
    const v = parseInt(text, 10);
    if (!isNaN(v) && v >= 1 && v <= 30) {
      useSettingsStore.getState().setSnoozeDuration(v);
      await applyAndRebuild(useSettingsStore.getState());
    }
  }, []);

  const handleOffsetChange = useCallback(async (text: string) => {
    const v = parseInt(text, 10);
    if (!isNaN(v) && v >= 0 && v <= 60) {
      useSettingsStore.getState().setPreAlarmOffset(v);
      await applyAndRebuild(useSettingsStore.getState());
    }
  }, []);

  const handleAlarmToggle = useCallback(async (val: boolean) => {
    useSettingsStore.getState().setAlarmEnabled(val);
    await applyAndRebuild(useSettingsStore.getState());
  }, []);

  const handleSleepReminderToggle = useCallback(async (val: boolean) => {
    useSettingsStore.getState().setSleepReminderEnabled(val);
    await applyAndRebuild(useSettingsStore.getState());
  }, []);

  const handleSleepHoursChange = useCallback(async (text: string) => {
    const v = parseFloat(text);
    if (!isNaN(v) && v >= 0.5 && v <= 12) {
      useSettingsStore.getState().setDesiredSleepHours(v);
      await applyAndRebuild(useSettingsStore.getState());
    }
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
              <Icon icon={Back} size={20} weight="regular" color={Palette.text} />
            </View>
          </View>
        </Pressable>
        <Text style={st.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={st.content}>
        <SettingSection label="Prayer">
          <SettingRow label="Calculation Method" isLast={false}>
            <Pressable
              onPress={() => setMethodModalOpen(true)}
              style={st.picker}
            >
              <Text style={st.pickerValue} numberOfLines={1}>
                {currentMethodLabel}
              </Text>
              <Icon icon={ChevronRight} size={20} color={Palette.textMuted} />
            </Pressable>
          </SettingRow>

          <SettingRow label="Pre-alarm Offset (minutes)" isLast>
            <TextInput
              style={st.numInput}
              keyboardType="number-pad"
              defaultValue={String(settings.preAlarmOffsetMinutes)}
              onEndEditing={(e) => handleOffsetChange(e.nativeEvent.text)}
              selectTextOnFocus
              accessibilityLabel="Pre-alarm offset in minutes"
            />
          </SettingRow>
        </SettingSection>

        <SettingSection label="Alarm">
          <SettingRow label="Alarm Enabled" isLast={false}>
            <Switch
              value={settings.alarmEnabled}
              onValueChange={handleAlarmToggle}
              trackColor={{ true: Palette.gold, false: Palette.border }}
              thumbColor={Palette.text}
            />
          </SettingRow>

          <SettingRow label="Adhan Recitation" isLast={false}>
            <Pressable
              onPress={() => setRecitationModalOpen(true)}
              style={st.picker}
            >
              <Text style={st.pickerValue}>{currentRecitationLabel}</Text>
              <Icon icon={ChevronRight} size={20} color={Palette.textMuted} />
            </Pressable>
          </SettingRow>

          <SettingRow label="Snooze Duration (minutes)" isLast>
            <TextInput
              style={st.numInput}
              keyboardType="number-pad"
              defaultValue={String(settings.snoozeDurationMinutes)}
              onEndEditing={(e) => handleSnoozeChange(e.nativeEvent.text)}
              selectTextOnFocus
              accessibilityLabel="Snooze duration in minutes"
            />
          </SettingRow>
        </SettingSection>

        <SettingSection label="Sleep Reminder">
          <SettingRow
            label="Sleep Reminder"
            isLast={!settings.sleepReminderEnabled}
          >
            <Switch
              value={settings.sleepReminderEnabled}
              onValueChange={handleSleepReminderToggle}
              trackColor={{ true: Palette.gold, false: Palette.border }}
              thumbColor={Palette.text}
            />
          </SettingRow>

          {settings.sleepReminderEnabled && (
            <SettingRow label="Desired Sleep (hours)" isLast>
              <TextInput
                style={st.numInput}
                keyboardType="decimal-pad"
                defaultValue={String(settings.desiredSleepHours)}
                onEndEditing={(e) => handleSleepHoursChange(e.nativeEvent.text)}
                selectTextOnFocus
                accessibilityLabel="Desired sleep hours"
              />
            </SettingRow>
          )}
        </SettingSection>

        <SettingSection label="Location">
          <SettingRow label="City" isLast>
            <Pressable onPress={() => setCityModalOpen(true)} style={st.picker}>
              <Text style={st.pickerValue} numberOfLines={1}>
                {settings.location
                  ? `${settings.location.cityName}, ${settings.location.country}`
                  : "Not set"}
              </Text>
              <Icon icon={ChevronRight} size={20} color={Palette.textMuted} />
            </Pressable>
          </SettingRow>
        </SettingSection>

        <SectionHeader label="Test" />

        <Pressable
          style={st.testAlarmBtn}
          onPress={() => router.push("/alarm")}
          accessibilityLabel="Trigger alarm screen"
        >
          <Text style={st.testAlarmText}>Trigger Alarm</Text>
        </Pressable>
      </ScrollView>

      {/* Calculation method picker modal */}
      <PickerModal
        visible={methodModalOpen}
        title="Calculation Method"
        onClose={() => setMethodModalOpen(false)}
      >
        {CALCULATION_METHODS.map((m) => (
          <Pressable
            key={m.key}
            style={[
              st.optionRow,
              m.key === settings.calculationMethod && st.optionRowActive,
            ]}
            onPress={() => handleMethodSelect(m.key)}
          >
            <Text
              style={[
                st.optionText,
                m.key === settings.calculationMethod && st.optionTextActive,
              ]}
            >
              {m.label}
            </Text>
            {m.key === settings.calculationMethod && (
              <Icon icon={Check} size={18} color={Palette.gold} />
            )}
          </Pressable>
        ))}
      </PickerModal>

      {/* Adhan recitation picker modal */}
      <PickerModal
        visible={recitationModalOpen}
        title="Adhan Recitation"
        onClose={() => setRecitationModalOpen(false)}
      >
        {ADHAN_RECITATIONS.map((r) => (
          <Pressable
            key={r.key}
            style={[
              st.optionRow,
              r.key === settings.adhanRecitation && st.optionRowActive,
            ]}
            onPress={() => handleRecitationSelect(r.key)}
          >
            <Text
              style={[
                st.optionText,
                r.key === settings.adhanRecitation && st.optionTextActive,
              ]}
            >
              {r.label}
            </Text>
            {r.key === settings.adhanRecitation && (
              <Icon icon={Check} size={18} color={Palette.gold} />
            )}
          </Pressable>
        ))}
      </PickerModal>

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

const SectionHeader = ({ label }: { label: string }) => {
  return <Text style={st.sectionHeader}>{label.toUpperCase()}</Text>;
};

const SettingSection = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <View style={st.section}>
      <SectionHeader label={label} />
      <View style={st.outline}>
        <View style={st.sectionCard}>{children}</View>
      </View>
    </View>
  );
};

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

const PickerModal = ({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={st.modalRoot}>
        <View style={st.modalHeader}>
          <Text style={st.modalTitle}>{title}</Text>
          <Pressable onPress={onClose}>
            <Text style={st.modalClose}>Done</Text>
          </Pressable>
        </View>
        <ScrollView>{children}</ScrollView>
      </SafeAreaView>
    </Modal>
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

  section: { gap: 8 },
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
  testAlarmText: { color: Palette.gold, fontSize: 16, fontWeight: '500' },

  sectionHeader: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

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
  pickerValue: { color: Palette.textSecondary, fontSize: 15, textAlign: 'right' },

  numInput: {
    color: Palette.text,
    fontSize: 15,
    backgroundColor: Palette.bgInset,
    borderRadius: Radius.sm - 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    textAlign: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.glassOutline,
  },

  modalRoot: { flex: 1, backgroundColor: Palette.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.borderSubtle,
  },
  modalTitle: { color: Palette.text, fontSize: 18, fontWeight: '600' },
  modalClose: { color: Palette.gold, fontSize: 16 },

  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.bgInset,
  },
  optionRowActive: { backgroundColor: Palette.bgCard },
  optionText: { color: Palette.text, fontSize: 16 },
  optionTextActive: { color: Palette.gold, fontWeight: '500' },
});
