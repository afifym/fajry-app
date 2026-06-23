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

    // Apply pre-alarm offset: alarm rings N minutes before true Fajr time
    const alarmTime = new Date(fajrTime.getTime() - preAlarmOffsetMinutes * 60_000);

    schedule.push({
      date: toISODate(date),
      fajrTime,    // true prayer time — used for confirmation window
      alarmTime,   // offset-adjusted trigger time — displayed and scheduled
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

/** Next sleep-reminder time: first future (Fajr − desired sleep hours) in the schedule. */
export function getNextBedtime(
  schedule: AlarmDay[],
  desiredSleepHours: number,
  now = new Date(),
): Date | null {
  const nowMs = now.getTime();
  for (const day of schedule) {
    const bedMs = day.fajrTime.getTime() - desiredSleepHours * 3_600_000;
    if (bedMs > nowMs) return new Date(bedMs);
  }
  return null;
}

/** Bed + wake for the upcoming (or in-progress) sleep session, paired to one Fajr night. */
export type SleepSession = {
  bedTime: Date;
  wakeTime: Date;
  fajrTime: Date;
  sunriseTime: Date;
  durationMs: number;
};

export function getNextSleepSession(
  schedule: AlarmDay[],
  desiredSleepHours: number,
  now = new Date(),
): SleepSession | null {
  const nowMs = now.getTime();

  for (const day of schedule) {
    const bedMs = day.fajrTime.getTime() - desiredSleepHours * 3_600_000;
    const wakeMs = day.alarmTime.getTime();
    if (bedMs <= nowMs && wakeMs > nowMs) {
      return {
        bedTime: new Date(bedMs),
        wakeTime: new Date(wakeMs),
        fajrTime: day.fajrTime,
        sunriseTime: day.sunriseTime,
        durationMs: wakeMs - bedMs,
      };
    }
  }

  const day = schedule.find((d) => d.alarmTime.getTime() > nowMs);
  if (!day) return null;

  const bedMs = day.fajrTime.getTime() - desiredSleepHours * 3_600_000;
  const wakeMs = day.alarmTime.getTime();
  return {
    bedTime: new Date(bedMs),
    wakeTime: new Date(wakeMs),
    fajrTime: day.fajrTime,
    sunriseTime: day.sunriseTime,
    durationMs: wakeMs - bedMs,
  };
}
