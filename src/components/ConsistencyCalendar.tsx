import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useConsistencyStore } from '@/store/consistencyStore';
import { toISODate } from '@/utils/prayerTimes';
import type { PrayerConfirmation } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EDITABLE_WINDOW = 7;

type DayState = 'on-time' | 'late' | 'missed' | 'future';

function getDayState(
  isoDate: string,
  confirmation: PrayerConfirmation | undefined,
  today: string,
): DayState {
  if (isoDate > today) return 'future';
  if (!confirmation || confirmation.confirmedAt === null) return 'missed';
  return confirmation.isOnTime ? 'on-time' : 'late';
}

function buildCalendarDays(year: number, month: number): string[] {
  const days: string[] = [];
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun

  // Include trailing days of previous month so last-7-days editable window is always visible
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

  // Days in current month
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

// Use a fixed far-future sunrise for calendar toggle (actual time unknown at this point)
const FAR_FUTURE = new Date(Date.now() + 24 * 60 * 60_000);

export function ConsistencyCalendar() {
  const { confirmations, toggleConfirmation } = useConsistencyStore();
  const today = toISODate(new Date());
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - EDITABLE_WINDOW);
  const cutoff = toISODate(cutoffDate);

  const days = buildCalendarDays(year, month);

  function handleDayPress(isoDate: string) {
    if (!isoDate || isoDate > today || isoDate < cutoff) return;
    toggleConfirmation(isoDate, FAR_FUTURE);
  }

  return (
    <View style={s.container}>
      <Text style={s.monthLabel}>{MONTH_NAMES[month]} {year}</Text>

      {/* Day headers */}
      <View style={s.grid}>
        {DAYS.map((d) => (
          <Text key={d} style={s.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={s.grid}>
        {days.map((isoDate, i) => {
          if (!isoDate) {
            return <View key={`empty-${i}`} style={s.cell} />;
          }

          const state = getDayState(isoDate, confirmations[isoDate], today);
          const dayNum = parseInt(isoDate.slice(-2), 10);
          const editable = isoDate <= today && isoDate >= cutoff;

          return (
            <Pressable
              key={isoDate}
              style={[s.cell, s[`cell_${state}`], !editable && state !== 'future' && s.cellReadOnly]}
              onPress={() => handleDayPress(isoDate)}
              disabled={isoDate > today || isoDate < cutoff}
              accessibilityLabel={`${isoDate}: ${state}`}
            >
              <Text style={[s.dayNum, s[`dayNum_${state}`]]}>{dayNum}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.legend}>
        <LegendDot color={COLORS['on-time']} label="On time" />
        <LegendDot color={COLORS.late} label="Late" />
        <LegendDot color={COLORS.missed} label="Missed" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

const COLORS = {
  'on-time': '#34C759',
  late: '#FF9500',
  missed: '#1A1C22',
  future: 'transparent',
};

const s = StyleSheet.create({
  container: { gap: 12 },
  monthLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: `${100 / 7}%` as `${number}%`,
    textAlign: 'center',
    color: '#4B5060',
    fontSize: 11,
    fontWeight: '600',
    paddingVertical: 6,
  },
  cell: {
    width: `${100 / 7}%` as `${number}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 2,
  },
  cell_future: { opacity: 0.3 },
  cell_missed: { backgroundColor: COLORS.missed },
  'cell_on-time': { backgroundColor: COLORS['on-time'] },
  cell_late: { backgroundColor: COLORS.late },
  cellReadOnly: { opacity: 0.5 },
  dayNum: { color: '#ffffff', fontSize: 13, fontWeight: '500' },
  dayNum_future: { color: '#3A3E48' },
  dayNum_missed: { color: '#3A3E48' },
  'dayNum_on-time': { color: '#000000', fontWeight: '600' },
  dayNum_late: { color: '#000000', fontWeight: '600' },

  legend: { flexDirection: 'row', gap: 20, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#9EA3AD', fontSize: 12 },
});
