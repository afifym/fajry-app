import { useCallback, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { FontFamily, Palette } from "@/constants/theme";
import { snapToFiveMinutes } from "@/utils/alarmPickerTime";

export type TimeWheelPickerProps = {
  value: Date;
  onValueChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
};

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const PERIODS = ["AM", "PM"] as const;

const ITEM_HEIGHT = 44;
const WHEEL_HEIGHT = 216;
const WHEEL_PAD = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

type Period = (typeof PERIODS)[number];

function parseParts(date: Date): { hour12: number; minute: number; period: Period } {
  const hour24 = date.getHours();
  return {
    hour12: hour24 % 12 || 12,
    minute: snapToFiveMinutes(date.getMinutes()),
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

function combineTime(base: Date, hour12: number, minute: number, period: Period): Date {
  const next = new Date(base);
  let hour24 = hour12 % 12;
  if (period === "PM") hour24 += 12;
  next.setHours(hour24, minute, 0, 0);
  return next;
}

function clampTime(date: Date, minimumDate?: Date, maximumDate?: Date): Date {
  let time = date.getTime();
  if (minimumDate) time = Math.max(time, minimumDate.getTime());
  if (maximumDate) time = Math.min(time, maximumDate.getTime());
  return new Date(time);
}

function WheelColumn({
  items,
  selectedIndex,
  onIndexChange,
  formatLabel,
  disabled,
}: {
  items: readonly (string | number)[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  formatLabel?: (item: string | number) => string;
  disabled?: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const suppressScrollRef = useRef(false);

  useEffect(() => {
    suppressScrollRef.current = true;
    scrollRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
    requestAnimationFrame(() => {
      suppressScrollRef.current = false;
    });
  }, [selectedIndex]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (suppressScrollRef.current || disabled) return;
      const index = Math.max(
        0,
        Math.min(
          items.length - 1,
          Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
        ),
      );
      onIndexChange(index);
    },
    [disabled, items.length, onIndexChange],
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={s.column}
      contentContainerStyle={s.columnContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      scrollEnabled={!disabled}
      onMomentumScrollEnd={handleScrollEnd}
      onScrollEndDrag={handleScrollEnd}
    >
      {items.map((item, index) => {
        const label = formatLabel ? formatLabel(item) : String(item);
        const selected = index === selectedIndex;
        return (
          <View key={`${item}-${index}`} style={s.item}>
            <Text style={[s.itemText, selected && s.itemTextSelected]}>{label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

export function TimeWheelPicker({
  value,
  onValueChange,
  minimumDate,
  maximumDate,
  disabled,
}: TimeWheelPickerProps) {
  const parts = parseParts(value);
  const hourIndex = Math.max(0, HOURS.indexOf(parts.hour12));
  const minuteIndex = Math.max(0, MINUTES.indexOf(parts.minute));
  const periodIndex = parts.period === "PM" ? 1 : 0;

  const emitChange = useCallback(
    (hour12: number, minute: number, period: Period) => {
      const next = clampTime(
        combineTime(value, hour12, minute, period),
        minimumDate,
        maximumDate,
      );
      onValueChange(next);
    },
    [maximumDate, minimumDate, onValueChange, value],
  );

  return (
    <View style={[s.wrap, disabled && s.disabled]}>
      <View style={s.wheelRow}>
        <WheelColumn
          items={HOURS}
          selectedIndex={hourIndex}
          disabled={disabled}
          onIndexChange={(index) =>
            emitChange(HOURS[index] ?? 12, parts.minute, parts.period)
          }
        />
        <WheelColumn
          items={MINUTES}
          selectedIndex={minuteIndex}
          disabled={disabled}
          formatLabel={(item) => String(item).padStart(2, "0")}
          onIndexChange={(index) =>
            emitChange(parts.hour12, MINUTES[index] ?? 0, parts.period)
          }
        />
        <WheelColumn
          items={PERIODS}
          selectedIndex={periodIndex}
          disabled={disabled}
          onIndexChange={(index) =>
            emitChange(parts.hour12, parts.minute, PERIODS[index] ?? "AM")
          }
        />
      </View>
      <View pointerEvents="none" style={s.selectionOverlay}>
        <View style={s.selectionBand} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    width: "100%",
    height: WHEEL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.4 },
  wheelRow: {
    flexDirection: "row",
    width: "100%",
    height: WHEEL_HEIGHT,
  },
  column: {
    flex: 1,
    height: WHEEL_HEIGHT,
  },
  columnContent: {
    paddingVertical: WHEEL_PAD,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontFamily: FontFamily.regular,
    fontSize: 20,
    color: Palette.textMuted,
  },
  itemTextSelected: {
    fontFamily: FontFamily.semiBold,
    fontSize: 22,
    color: Palette.gold,
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBand: {
    width: "92%",
    height: ITEM_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.borderSubtle,
  },
});
