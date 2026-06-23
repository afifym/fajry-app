import { useCallback, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityPickerModal } from '@/components/CityPickerModal';
import { HomeBg } from '@/components/HomeBg';
import { useSettingsStore } from '@/store/settingsStore';
import { rebuildScheduleOnAppOpen } from '@/utils/scheduling';
import type { CalculationMethodKey, AdhanRecitation, City } from '@/types';

const CALCULATION_METHODS: { key: CalculationMethodKey; label: string }[] = [
  { key: 'MuslimWorldLeague', label: 'Muslim World League' },
  { key: 'Egyptian', label: 'Egyptian General Authority' },
  { key: 'Karachi', label: 'Univ. of Islamic Sciences, Karachi' },
  { key: 'UmmAlQura', label: 'Umm Al-Qura, Makkah' },
  { key: 'Dubai', label: 'Dubai' },
  { key: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
  { key: 'NorthAmerica', label: 'ISNA (North America)' },
  { key: 'Kuwait', label: 'Kuwait' },
  { key: 'Qatar', label: 'Qatar' },
  { key: 'Singapore', label: 'MUIS Singapore' },
  { key: 'Tehran', label: 'Inst. of Geophysics, Tehran' },
  { key: 'Turkey', label: 'Turkey' },
  { key: 'Other', label: 'Other' },
];

const ADHAN_RECITATIONS: { key: AdhanRecitation; label: string }[] = [
  { key: 'makkah', label: 'Makkah' },
  { key: 'madinah', label: 'Madinah' },
  { key: 'mishary', label: 'Mishary Rashid Alafasy' },
];

async function applyAndRebuild(settings: ReturnType<typeof useSettingsStore.getState>) {
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

  const handleMethodSelect = useCallback(
    async (key: CalculationMethodKey) => {
      useSettingsStore.getState().setCalculationMethod(key);
      setMethodModalOpen(false);
      await applyAndRebuild(useSettingsStore.getState());
    },
    [],
  );

  const handleRecitationSelect = useCallback(
    async (key: AdhanRecitation) => {
      useSettingsStore.getState().setAdhanRecitation(key);
      setRecitationModalOpen(false);
      await applyAndRebuild(useSettingsStore.getState());
    },
    [],
  );

  const handleCitySelect = useCallback(
    async (city: City) => {
      useSettingsStore.getState().setLocation({ lat: city.lat, lng: city.lng, cityName: city.name, country: city.country });
      setCityModalOpen(false);
      await applyAndRebuild(useSettingsStore.getState());
    },
    [],
  );

  const handleSnoozeChange = useCallback(
    async (text: string) => {
      const v = parseInt(text, 10);
      if (!isNaN(v) && v >= 1 && v <= 30) {
        useSettingsStore.getState().setSnoozeDuration(v);
        await applyAndRebuild(useSettingsStore.getState());
      }
    },
    [],
  );

  const handleOffsetChange = useCallback(
    async (text: string) => {
      const v = parseInt(text, 10);
      if (!isNaN(v) && v >= 0 && v <= 60) {
        useSettingsStore.getState().setPreAlarmOffset(v);
        await applyAndRebuild(useSettingsStore.getState());
      }
    },
    [],
  );

  const handleAlarmToggle = useCallback(
    async (val: boolean) => {
      useSettingsStore.getState().setAlarmEnabled(val);
      await applyAndRebuild(useSettingsStore.getState());
    },
    [],
  );

  const handleSleepReminderToggle = useCallback(
    async (val: boolean) => {
      useSettingsStore.getState().setSleepReminderEnabled(val);
      await applyAndRebuild(useSettingsStore.getState());
    },
    [],
  );

  const handleSleepHoursChange = useCallback(
    async (text: string) => {
      const v = parseFloat(text);
      if (!isNaN(v) && v >= 0.5 && v <= 12) {
        useSettingsStore.getState().setDesiredSleepHours(v);
        await applyAndRebuild(useSettingsStore.getState());
      }
    },
    [],
  );

  const currentMethodLabel = CALCULATION_METHODS.find((m) => m.key === settings.calculationMethod)?.label ?? settings.calculationMethod;
  const currentRecitationLabel = ADHAN_RECITATIONS.find((r) => r.key === settings.adhanRecitation)?.label ?? settings.adhanRecitation;

  return (
    <SafeAreaView style={st.root}>
      <HomeBg />
      <View style={st.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={st.backBtn}>
          <Text style={st.backText}>‹ Back</Text>
        </Pressable>
        <Text style={st.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={st.content}>
        <SectionHeader label="Prayer" />

        <SettingRow label="Calculation Method">
          <Pressable onPress={() => setMethodModalOpen(true)} style={st.picker}>
            <Text style={st.pickerValue} numberOfLines={1}>{currentMethodLabel}</Text>
            <Text style={st.chevron}>›</Text>
          </Pressable>
        </SettingRow>

        <SettingRow label="Pre-alarm Offset (minutes)">
          <TextInput
            style={st.numInput}
            keyboardType="number-pad"
            defaultValue={String(settings.preAlarmOffsetMinutes)}
            onEndEditing={(e) => handleOffsetChange(e.nativeEvent.text)}
            selectTextOnFocus
            accessibilityLabel="Pre-alarm offset in minutes"
          />
        </SettingRow>

        <SectionHeader label="Alarm" />

        <SettingRow label="Alarm Enabled">
          <Switch
            value={settings.alarmEnabled}
            onValueChange={handleAlarmToggle}
            trackColor={{ true: '#ffffff', false: '#253352' }}
            thumbColor="#000000"
          />
        </SettingRow>

        <SettingRow label="Adhan Recitation">
          <Pressable onPress={() => setRecitationModalOpen(true)} style={st.picker}>
            <Text style={st.pickerValue}>{currentRecitationLabel}</Text>
            <Text style={st.chevron}>›</Text>
          </Pressable>
        </SettingRow>

        <SettingRow label="Snooze Duration (minutes)">
          <TextInput
            style={st.numInput}
            keyboardType="number-pad"
            defaultValue={String(settings.snoozeDurationMinutes)}
            onEndEditing={(e) => handleSnoozeChange(e.nativeEvent.text)}
            selectTextOnFocus
            accessibilityLabel="Snooze duration in minutes"
          />
        </SettingRow>

        <SectionHeader label="Sleep Reminder" />

        <SettingRow label="Sleep Reminder">
          <Switch
            value={settings.sleepReminderEnabled}
            onValueChange={handleSleepReminderToggle}
            trackColor={{ true: '#ffffff', false: '#253352' }}
            thumbColor="#000000"
          />
        </SettingRow>

        {settings.sleepReminderEnabled && (
          <SettingRow label="Desired Sleep (hours)">
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

        <SectionHeader label="Location" />

        <SettingRow label="City">
          <Pressable onPress={() => setCityModalOpen(true)} style={st.picker}>
            <Text style={st.pickerValue} numberOfLines={1}>
              {settings.location ? `${settings.location.cityName}, ${settings.location.country}` : 'Not set'}
            </Text>
            <Text style={st.chevron}>›</Text>
          </Pressable>
        </SettingRow>

        <SectionHeader label="Test" />

        <Pressable style={st.testAlarmBtn} onPress={() => router.push('/alarm')} accessibilityLabel="Trigger alarm screen">
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
            style={[st.optionRow, m.key === settings.calculationMethod && st.optionRowActive]}
            onPress={() => handleMethodSelect(m.key)}
          >
            <Text style={[st.optionText, m.key === settings.calculationMethod && st.optionTextActive]}>
              {m.label}
            </Text>
            {m.key === settings.calculationMethod && <Text style={st.checkmark}>✓</Text>}
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
            style={[st.optionRow, r.key === settings.adhanRecitation && st.optionRowActive]}
            onPress={() => handleRecitationSelect(r.key)}
          >
            <Text style={[st.optionText, r.key === settings.adhanRecitation && st.optionTextActive]}>
              {r.label}
            </Text>
            {r.key === settings.adhanRecitation && <Text style={st.checkmark}>✓</Text>}
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

const SettingRow = ({ label, children }: { label: string; children: React.ReactNode }) => {
  return (
    <View style={st.row}>
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
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
  root: { flex: 1, backgroundColor: '#060C1A' },
  flex: { flex: 1 },

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

  content: { paddingBottom: 40 },

  testAlarmBtn: {
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C9A84C',
    paddingVertical: 16,
    alignItems: 'center',
  },
  testAlarmText: { color: '#C9A84C', fontSize: 16 },

  sectionHeader: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#0A1020',
  },
  rowLabel: { color: '#ffffff', fontSize: 16, flex: 1 },

  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '55%',
  },
  pickerValue: { color: '#8892A4', fontSize: 16, textAlign: 'right' },
  chevron: { color: '#4A5568', fontSize: 20 },

  numInput: {
    color: '#ffffff',
    fontSize: 16,
    backgroundColor: '#0A1020',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
    textAlign: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#253352',
  },

  // Modals
  modalRoot: { flex: 1, backgroundColor: '#060C1A' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1E2D4A',
  },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  modalClose: { color: '#C9A84C', fontSize: 16 },

  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#0A1020',
  },
  optionRowActive: { backgroundColor: '#0E0E0E' },
  optionText: { color: '#ffffff', fontSize: 16 },
  optionTextActive: { color: '#ffffff', fontWeight: '500' },
  checkmark: { color: '#ffffff', fontSize: 16 },
});
