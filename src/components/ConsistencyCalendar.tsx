import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Palette } from '@/constants/theme';
import { useConsistencyStore } from '@/store/consistencyStore';
import { toISODate } from '@/utils/prayerTimes';
import type { PrayerConfirmation } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLUMNS = 7;
const EDITABLE_WINDOW = 7;

type DayState = 'prayed' | 'missed' | 'future';

function getDayState(
  isoDate: string,
  confirmation: PrayerConfirmation | undefined,
  today: string,
): DayState {
  if (isoDate > today) return 'future';
  if (!confirmation || confirmation.confirmedAt === null) return 'missed';
  return 'prayed';
}

function buildCalendarDays(year: number, month: number): string[] {
  const days: string[] = [];
  const firstDay = new Date(year, month, 1).getDay();

  if (firstDay > 0) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = String(prevMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      days.push(`${prevYear}-${m}-${dd}`);
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push(`${year}-${m}-${dd}`);
  }
  return days;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const FAR_FUTURE = new Date(Date.now() + 24 * 60 * 60_000);
const TIMING = { duration: 240, easing: Easing.out(Easing.cubic) };

type CalendarDayCellProps = {
  isoDate: string;
  state: DayState;
  cellSize: number;
  dayNum: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  editable: boolean;
  onPress: () => void;
};

function CalendarDayCell({
  isoDate,
  state,
  cellSize,
  dayNum,
  isToday,
  isCurrentMonth,
  editable,
  onPress,
}: CalendarDayCellProps) {
  const isPrayed = state === 'prayed';
  const progress = useSharedValue(isPrayed ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(isPrayed ? 1 : 0, TIMING);
  }, [isPrayed, progress]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 90 }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.back(1.35)) }),
    );
    onPress();
  };

  const sizeStyle = cellSize > 0 ? { width: cellSize, height: cellSize } : s.cell;
  const stateLabel = state === 'prayed' ? 'Prayed' : state === 'missed' ? 'Missed' : 'Future';

  const animatedCellStyle = useAnimatedStyle(() => {
    if (state === 'future') {
      return { transform: [{ scale: scale.value }] };
    }

    return {
      transform: [{ scale: scale.value }],
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [Palette.bgCard, Palette.goldDim],
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        [Palette.glassOutline, Palette.goldMuted],
      ),
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [Palette.textSecondary, Palette.gold],
    ),
  }));

  return (
    <Pressable
      onPress={handlePress}
      disabled={!editable || state === 'future'}
      accessibilityLabel={`${isoDate}: ${stateLabel}`}
    >
      <View style={[sizeStyle, isToday && s.cellTodayWrap]}>
        <Animated.View
          style={[
            s.cell,
            s.cellFill,
            state === 'future' && s.cell_future,
            state !== 'future' && s.cellBorder,
            !editable && state !== 'future' && s.cellReadOnly,
            animatedCellStyle,
          ]}
        >
          {state === 'future' ? (
            <Animated.Text
              style={[s.dayNum, s.dayNum_future, !isCurrentMonth && s.dayNumOutsideMonth]}
            >
              {dayNum}
            </Animated.Text>
          ) : (
            <Animated.Text
              style={[
                s.dayNum,
                animatedTextStyle,
                isPrayed && s.dayNum_prayed,
                !isCurrentMonth && s.dayNumOutsideMonth,
              ]}
            >
              {dayNum}
            </Animated.Text>
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}

export const ConsistencyCalendar = () => {
  const { confirmations, toggleConfirmation } = useConsistencyStore();
  const [cellSize, setCellSize] = useState(0);
  const today = toISODate(new Date());
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - EDITABLE_WINDOW);
  const cutoff = toISODate(cutoffDate);

  const days = buildCalendarDays(year, month);

  const onGridLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) {
      setCellSize(Math.floor(width / COLUMNS));
    }
  }, []);

  function handleDayPress(isoDate: string) {
    if (!isoDate || isoDate > today || isoDate < cutoff) return;
    toggleConfirmation(isoDate, FAR_FUTURE);
  }

  return (
    <View style={s.container}>
      <Text style={s.monthLabel}>
        {MONTH_NAMES[month]} {year}
      </Text>

      <View style={s.calendar} onLayout={onGridLayout}>
        <View style={s.grid}>
          {DAYS.map((d) => (
            <Text
              key={d}
              style={[s.dayHeader, cellSize > 0 && { width: cellSize }]}
            >
              {d}
            </Text>
          ))}
        </View>

        <View style={s.grid}>
          {days.map((isoDate) => (
            <CalendarDayCell
              key={isoDate}
              isoDate={isoDate}
              state={getDayState(isoDate, confirmations[isoDate], today)}
              cellSize={cellSize}
              dayNum={parseInt(isoDate.slice(-2), 10)}
              isToday={isoDate === today}
              isCurrentMonth={parseInt(isoDate.slice(5, 7), 10) - 1 === month}
              editable={isoDate <= today && isoDate >= cutoff}
              onPress={() => handleDayPress(isoDate)}
            />
          ))}
        </View>
      </View>

      <View style={s.legend}>
        <LegendDot color={Palette.goldDim} border={Palette.goldMuted} label="Prayed" />
        <LegendDot color={Palette.bgCard} border={Palette.glassOutline} label="Missed" />
      </View>
    </View>
  );
};

const LegendDot = ({
  color,
  border,
  label,
}: {
  color: string;
  border?: string;
  label: string;
}) => (
  <View style={s.legendItem}>
    <View
      style={[
        s.legendDot,
        { backgroundColor: color },
        border ? { borderWidth: StyleSheet.hairlineWidth, borderColor: border } : null,
      ]}
    />
    <Text style={s.legendText}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  container: { gap: 14 },
  monthLabel: {
    color: Palette.gold,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  calendar: { width: '100%' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: `${100 / COLUMNS}%` as `${number}%`,
    textAlign: 'center',
    color: Palette.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    paddingVertical: 6,
  },
  cell: {
    width: `${100 / COLUMNS}%` as `${number}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  cellFill: {
    width: '100%',
    height: '100%',
    aspectRatio: undefined,
  },
  cell_future: { opacity: 0.28 },
  cellBorder: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  cellTodayWrap: {
    borderWidth: 1,
    borderColor: Palette.gold,
  },
  cellReadOnly: { opacity: 0.45 },
  dayNum: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '500',
  },
  dayNum_future: { color: Palette.textMuted },
  dayNum_prayed: { fontWeight: '700' },
  dayNumOutsideMonth: { opacity: 0.45 },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 4,
    paddingTop: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: Palette.textSecondary, fontSize: 12, fontWeight: '500' },
});
