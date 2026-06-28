import { type ReactNode } from "react";
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
  children?: ReactNode;
};

function formatTime(date: Date): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m} ${date.getHours() >= 12 ? "PM" : "AM"}`;
}

const TIME_SIZE = 24;
const TIME_HEIGHT = Math.round(TIME_SIZE * 1.32);

function TimeText({
  children,
  muted,
}: {
  children: string;
  muted: boolean;
}) {
  return (
    <ElMessiriText
      size={TIME_SIZE}
      weight="bold"
      height={TIME_HEIGHT}
      style={[s.time, muted && s.timeMuted]}
      numberOfLines={1}
    >
      {children}
    </ElMessiriText>
  );
}

export function SleepScheduleCard({
  bedTime,
  wakeTime,
  bedEnabled,
  wakeEnabled,
  onBedPress,
  onWakePress,
  children,
}: Props) {
  return (
    <GlassSurface>
      <View style={s.scheduleRow}>
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
          <TimeText muted={!bedEnabled}>
            {bedTime ? formatTime(bedTime) : "—"}
          </TimeText>
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
          <TimeText muted={!wakeEnabled}>
            {wakeTime ? formatTime(wakeTime) : "—"}
          </TimeText>
        </Pressable>
      </View>

      {children ? <View style={s.clockSection}>{children}</View> : null}
    </GlassSurface>
  );
}

const s = StyleSheet.create({
  scheduleRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  half: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 8,
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
  clockSection: {
    alignItems: "center",
    paddingBottom: 8,
  },
});
