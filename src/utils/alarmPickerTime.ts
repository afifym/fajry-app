/** Snap times and offsets to five-minute increments. */
export const TIME_SNAP_MINUTES = 5;

export function snapToFiveMinutes(minutes: number): number {
  return Math.round(minutes / TIME_SNAP_MINUTES) * TIME_SNAP_MINUTES;
}

/** Midnight through 12:00 — hides 13:00–24:00 on a 24-hour time wheel. */
export function morningPickerBounds(day: Date): { minimumDate: Date; maximumDate: Date } {
  const minimumDate = new Date(day);
  minimumDate.setHours(0, 0, 0, 0);
  const maximumDate = new Date(day);
  maximumDate.setHours(12, 0, 0, 0);
  return { minimumDate, maximumDate };
}

/** 12:00 through 23:55 — afternoon and evening only. */
export function eveningPickerBounds(day: Date): { minimumDate: Date; maximumDate: Date } {
  const minimumDate = new Date(day);
  minimumDate.setHours(12, 0, 0, 0);
  const maximumDate = new Date(day);
  maximumDate.setHours(23, 55, 0, 0);
  return { minimumDate, maximumDate };
}

function clampDate(date: Date, minimumDate: Date, maximumDate: Date): Date {
  const t = date.getTime();
  if (t < minimumDate.getTime()) return new Date(minimumDate);
  if (t > maximumDate.getTime()) return new Date(maximumDate);
  return date;
}

/** Keep a wake picker time in 00:00–12:00. 13:00–23:00 maps to the same clock hour AM. */
export function restrictToMorningHours(date: Date): Date {
  const next = new Date(date);
  if (next.getHours() > 12) {
    next.setHours(next.getHours() - 12, next.getMinutes(), 0, 0);
  }
  const { minimumDate, maximumDate } = morningPickerBounds(next);
  return clampDate(next, minimumDate, maximumDate);
}

/** Keep a bedtime picker time in 12:00–23:55. Morning hours map to PM. */
export function restrictToEveningHours(date: Date): Date {
  const next = new Date(date);
  if (next.getHours() < 12) {
    next.setHours(next.getHours() + 12, next.getMinutes(), 0, 0);
  }
  const { minimumDate, maximumDate } = eveningPickerBounds(next);
  return clampDate(next, minimumDate, maximumDate);
}

/** Map a time-wheel selection to pre-alarm offset minutes before Fajr (negative = after Fajr). */
export function maxMinutesAfterFajrUntilSunrise(fajrTime: Date, sunriseTime: Date): number {
  return Math.max(0, Math.round((sunriseTime.getTime() - fajrTime.getTime()) / 60_000));
}

export function clampWakeTime(picked: Date, fajrTime: Date, sunriseTime: Date): Date {
  const aligned = new Date(picked);
  aligned.setFullYear(fajrTime.getFullYear(), fajrTime.getMonth(), fajrTime.getDate());

  const sunriseAligned = new Date(sunriseTime);
  sunriseAligned.setFullYear(fajrTime.getFullYear(), fajrTime.getMonth(), fajrTime.getDate());

  const earliest = new Date(fajrTime.getTime() - 60 * 60_000);
  if (aligned.getTime() < earliest.getTime()) return earliest;
  if (aligned.getTime() > sunriseAligned.getTime()) return sunriseAligned;
  return aligned;
}

export function clampWakeOffsetMinutes(
  offsetMinutes: number,
  fajrTime: Date,
  sunriseTime?: Date,
): number {
  const minOffset = sunriseTime ? -maxMinutesAfterFajrUntilSunrise(fajrTime, sunriseTime) : 0;
  const clamped = Math.max(minOffset, Math.min(60, offsetMinutes));
  return snapToFiveMinutes(clamped);
}

export function offsetFromWakeTime(fajrTime: Date, picked: Date, sunriseTime?: Date): number {
  const aligned = sunriseTime
    ? clampWakeTime(picked, fajrTime, sunriseTime)
    : (() => {
        const d = new Date(picked);
        d.setFullYear(fajrTime.getFullYear(), fajrTime.getMonth(), fajrTime.getDate());
        const earliest = new Date(fajrTime.getTime() - 60 * 60_000);
        if (d.getTime() < earliest.getTime()) return earliest;
        if (d.getTime() > fajrTime.getTime()) return new Date(fajrTime);
        return d;
      })();
  const minutes = snapToFiveMinutes(
    Math.round((fajrTime.getTime() - aligned.getTime()) / 60_000),
  );
  return clampWakeOffsetMinutes(minutes, fajrTime, sunriseTime);
}

/**
 * Offset for a night-face wake. No Fajr/Shurooq window — the dial position is the time.
 */
export function offsetFromNightFaceWake(
  fajrTime: Date,
  picked: Date,
  _sunriseTime?: Date,
): number {
  const wake = nightFaceDateFromTime(fajrTime, picked);
  return snapToFiveMinutes(
    Math.round((fajrTime.getTime() - wake.getTime()) / 60_000),
  );
}

export function wakeTimeFromOffset(fajrTime: Date, offsetMinutes: number): Date {
  return new Date(fajrTime.getTime() - offsetMinutes * 60_000);
}

/** Put a clock time on the same night-face calendar as Fajr (PM is the evening before). */
export function nightFaceDateFromTime(fajrTime: Date, picked: Date): Date {
  const aligned = new Date(fajrTime);
  aligned.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  if (picked.getHours() >= NIGHT_START_HOUR) {
    aligned.setDate(aligned.getDate() - 1);
  }
  return aligned;
}

/** Earliest time on the night face: 6 PM the calendar day before Fajr. */
export function nightFaceStart(fajrTime: Date): Date {
  const start = new Date(fajrTime);
  start.setDate(start.getDate() - 1);
  start.setHours(NIGHT_START_HOUR, 0, 0, 0);
  return start;
}

/** 6 PM — seam between the PM left half and AM right half of the sleep clock. */
export const NIGHT_START_HOUR = 18;

/** Longest sleep on the night face: 6 PM the day before Fajr → Fajr. */
export function maxDesiredSleepHours(fajrTime: Date): number {
  const hours = (fajrTime.getTime() - nightFaceStart(fajrTime).getTime()) / 3_600_000;
  return Math.max(0.5, hours);
}

/** Map a time-wheel selection to desired sleep hours before Fajr. */
export function sleepHoursFromBedtime(fajrTime: Date, picked: Date): number {
  const aligned = new Date(fajrTime);
  aligned.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  if (picked.getHours() >= NIGHT_START_HOUR) {
    aligned.setDate(aligned.getDate() - 1);
  } else if (aligned.getTime() >= fajrTime.getTime()) {
    aligned.setDate(aligned.getDate() - 1);
  }
  const minutes = snapToFiveMinutes(
    Math.round((fajrTime.getTime() - aligned.getTime()) / 60_000),
  );
  return minutes / 60;
}

export function bedtimeFromSleepHours(fajrTime: Date, sleepHours: number): Date {
  return new Date(fajrTime.getTime() - sleepHours * 3_600_000);
}

/** Milliseconds from bedtime to wake, assuming wake is the following morning when needed. */
export function sleepDurationBetween(bed: Date, wake: Date): number {
  let wakeMs = wake.getTime();
  const bedMs = bed.getTime();
  if (wakeMs <= bedMs) wakeMs += 86_400_000;
  return wakeMs - bedMs;
}
