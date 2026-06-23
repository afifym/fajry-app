import {
  buildAlarmSchedule,
  getFajrAndSunrise,
  getNextBedtime,
  isConfirmationWindowOpen,
  toISODate,
} from '../prayerTimes';
import type { Location } from '@/types';

const CAIRO: Location = { lat: 30.06263, lng: 31.24967, cityName: 'Cairo', country: 'EG' };
const LONDON: Location = { lat: 51.50853, lng: -0.12574, cityName: 'London', country: 'GB' };

describe('getFajrAndSunrise', () => {
  it('returns plausible fajr and sunrise for Cairo on a known date (MWL)', () => {
    const date = new Date(2024, 0, 15, 0, 0, 0); // 15 Jan 2024 local midnight
    const { fajrTime, sunriseTime } = getFajrAndSunrise(date, CAIRO, 'MuslimWorldLeague');

    // Cairo is UTC+2; fajr ~5:25 local = 3:25 UTC
    // Use UTC hours so the test passes regardless of runner timezone
    expect(fajrTime.getUTCHours()).toBeGreaterThanOrEqual(3);
    expect(fajrTime.getUTCHours()).toBeLessThanOrEqual(5);

    // Sunrise is always after Fajr
    expect(sunriseTime.getTime()).toBeGreaterThan(fajrTime.getTime());
  });

  it('returns plausible fajr for London in summer (longer days)', () => {
    const date = new Date(2024, 5, 21, 0, 0, 0); // 21 Jun 2024
    const { fajrTime, sunriseTime } = getFajrAndSunrise(date, LONDON, 'MuslimWorldLeague');

    // London is UTC+1 in summer; fajr ~2:40 local = 1:40 UTC
    expect(fajrTime.getUTCHours()).toBeLessThanOrEqual(3);
    expect(sunriseTime.getTime()).toBeGreaterThan(fajrTime.getTime());
  });
});

describe('buildAlarmSchedule', () => {
  it('returns exactly 7 entries', () => {
    const schedule = buildAlarmSchedule(CAIRO, 'MuslimWorldLeague', 0);
    expect(schedule).toHaveLength(7);
  });

  it('applies pre-alarm offset correctly', () => {
    const withOffset = buildAlarmSchedule(CAIRO, 'MuslimWorldLeague', 10);
    const withoutOffset = buildAlarmSchedule(CAIRO, 'MuslimWorldLeague', 0);

    // With 10-minute offset, alarm fires 10 minutes earlier (fajrTime is unchanged — it's the true prayer time)
    const diffMs = withoutOffset[0].alarmTime.getTime() - withOffset[0].alarmTime.getTime();
    expect(diffMs).toBe(10 * 60_000);
  });

  it('produces entries with ascending dates', () => {
    const schedule = buildAlarmSchedule(CAIRO, 'MuslimWorldLeague', 0);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].date > schedule[i - 1].date).toBe(true);
    }
  });

  it('sunrise is always after fajrTime (even with offset)', () => {
    const schedule = buildAlarmSchedule(CAIRO, 'MuslimWorldLeague', 30);
    for (const day of schedule) {
      expect(day.sunriseTime.getTime()).toBeGreaterThan(day.fajrTime.getTime());
    }
  });
});

describe('isConfirmationWindowOpen', () => {
  it('returns true when current time is between fajr and sunrise', () => {
    const fajr = new Date(Date.now() - 30 * 60_000);   // 30 min ago
    const sunrise = new Date(Date.now() + 30 * 60_000); // 30 min from now
    expect(isConfirmationWindowOpen(fajr, sunrise)).toBe(true);
  });

  it('returns false before fajr', () => {
    const fajr = new Date(Date.now() + 60 * 60_000);    // 1 hour from now
    const sunrise = new Date(Date.now() + 90 * 60_000);
    expect(isConfirmationWindowOpen(fajr, sunrise)).toBe(false);
  });

  it('returns false after sunrise', () => {
    const fajr = new Date(Date.now() - 120 * 60_000);
    const sunrise = new Date(Date.now() - 30 * 60_000); // 30 min ago
    expect(isConfirmationWindowOpen(fajr, sunrise)).toBe(false);
  });
});

describe('toISODate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const d = new Date(2024, 0, 5); // 5 Jan 2024
    expect(toISODate(d)).toBe('2024-01-05');
  });
});

describe('getNextBedtime', () => {
  it('returns Fajr minus desired sleep hours for the first future slot', () => {
    const schedule = buildAlarmSchedule(CAIRO, 'MuslimWorldLeague', 0);
    const desiredSleepHours = 6;
    const now = new Date(schedule[0].fajrTime.getTime() - desiredSleepHours * 3_600_000 - 60_000);

    const bed = getNextBedtime(schedule, desiredSleepHours, now);
    expect(bed).not.toBeNull();
    expect(bed!.getTime()).toBe(
      schedule[0].fajrTime.getTime() - desiredSleepHours * 3_600_000,
    );
  });

  it('skips past bedtimes and returns the next day when tonight has passed', () => {
    const schedule = buildAlarmSchedule(CAIRO, 'MuslimWorldLeague', 0);
    const desiredSleepHours = 6;
    const now = new Date(schedule[0].fajrTime.getTime() - 60_000);

    const bed = getNextBedtime(schedule, desiredSleepHours, now);
    expect(bed).not.toBeNull();
    expect(bed!.getTime()).toBe(
      schedule[1].fajrTime.getTime() - desiredSleepHours * 3_600_000,
    );
  });
});
