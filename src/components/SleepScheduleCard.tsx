import { Pressable, StyleSheet, Text, View } from "react-native";

import { AlarmClock, Bed, Icon } from "@/components/Icon";
import { GlassSurface } from "@/components/GlassSurface";
import { ElMessiriText } from "@/components/el-messiri-text";
import { Palette } from "@/constants/theme";

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
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m} ${date.getHours() >= 12 ? "PM" : "AM"}`;
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
    <GlassSurface contentStyle={s.card}>
      <Pressable
        onPress={onBedPress}
        style={s.half}
        accessibilityLabel="Edit bedtime reminder"
        accessibilityRole="button"
      >
        <View style={[s.labelRow, !bedEnabled && s.muted]}>
          <Icon icon={Bed} size={16} color={Palette.gold} />
          <Text style={s.label} numberOfLines={1}>
            BEDTIME
          </Text>
        </View>
        <ElMessiriText
          size={24}
          weight="bold"
          style={[s.time, !bedEnabled && s.timeMuted]}
          numberOfLines={1}
        >
          {bedTime ? formatTime(bedTime) : "—"}
        </ElMessiriText>
      </Pressable>

      <View style={s.separator} />

      <Pressable
        onPress={onWakePress}
        style={s.half}
        accessibilityLabel="Edit wake up alarm"
        accessibilityRole="button"
      >
        <View style={[s.labelRow, !wakeEnabled && s.muted]}>
          <Icon icon={AlarmClock} size={16} color={Palette.gold} />
          <Text style={s.label} numberOfLines={1}>
            WAKE UP
          </Text>
        </View>
        <ElMessiriText
          size={24}
          weight="bold"
          style={[s.time, !wakeEnabled && s.timeMuted]}
          numberOfLines={1}
        >
          {wakeTime ? formatTime(wakeTime) : "—"}
        </ElMessiriText>
      </Pressable>
    </GlassSurface>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  half: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
    alignItems: "center",
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Palette.glassOutline,
    marginVertical: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    alignSelf: "stretch",
  },
  label: {
    color: Palette.gold,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  time: {
    color: Palette.text,
    textAlign: "center",
    alignSelf: "stretch",
  },
  timeMuted: { opacity: 0.45 },
  muted: { opacity: 0.45 },
});
