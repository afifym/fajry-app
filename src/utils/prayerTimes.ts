import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan';

import type { AlarmDay, CalculationMethodKey, Location } from '@/types';

type FajrAndSunrise = { fajrTime: Date; sunriseTime: Date };

export function getFajrAndSunrise(
  date: Date,
  location: Location,
  method: CalculationMethodKey,
): FajrAndSunrise {
  const coords = new Coordinates(location.lat, location.lng);
  const params = CalculationMethod[method]();
  const times = new PrayerTimes(coords, date, params);
  return { fajrTime: times.fajr, sunriseTime: times.sunrise };
}

export function buildAlarmSchedule(
  location: Location,
  method: CalculationMethodKey,
  preAlarmOffsetMinutes: number,
): AlarmDay[] {
  const schedule: AlarmDay[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    // Reset to midnight local time so adhan calculates for the calendar day
    date.setHours(0, 0, 0, 0);

    const { fajrTime, sunriseTime } = getFajrAndSunrise(date, location, method);

    // Apply pre-alarm offset: ring N minutes before fajrTime
    const alarmTime = new Date(fajrTime.getTime() - preAlarmOffsetMinutes * 60_000);

    schedule.push({
      date: toISODate(date),
      fajrTime: alarmTime,
      sunriseTime,
      scheduled: false, // updated after notifee scheduling
    });
  }

  return schedule;
}

export function isConfirmationWindowOpen(fajrTime: Date, sunriseTime: Date): boolean {
  const now = new Date();
  return now >= fajrTime && now < sunriseTime;
}

// YYYY-MM-DD in local time
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}
