/** Snap times and offsets to five-minute increments. */
export const TIME_SNAP_MINUTES = 5;

export function snapToFiveMinutes(minutes: number): number {
  return Math.round(minutes / TIME_SNAP_MINUTES) * TIME_SNAP_MINUTES;
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
 * Offset for a night-face wake. Does not flip AM ↔ PM just to fit the
 * 60-minute-before-Fajr window (that is how 3 AM became 2:58 PM).
 */
export function offsetFromNightFaceWake(
  fajrTime: Date,
  picked: Date,
  sunriseTime?: Date,
): number {
  const wake = new Date(fajrTime);
  wake.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  if (picked.getHours() >= NIGHT_START_HOUR) {
    wake.setDate(wake.getDate() - 1);
  }
  const minutes = snapToFiveMinutes(
    Math.round((fajrTime.getTime() - wake.getTime()) / 60_000),
  );
  const clamped = clampWakeOffsetMinutes(minutes, fajrTime, sunriseTime);
  const clampedWake = wakeTimeFromOffset(fajrTime, clamped);
  const pickedAm = picked.getHours() < 12;
  const clampedAm = clampedWake.getHours() < 12;
  if (pickedAm !== clampedAm) return minutes;
  return clamped;
}

export function wakeTimeFromOffset(fajrTime: Date, offsetMinutes: number): Date {
  return new Date(fajrTime.getTime() - offsetMinutes * 60_000);
}

/** 6 PM — seam between the PM left half and AM right half of the sleep clock. */
export const NIGHT_START_HOUR = 18;

/** Longest sleep on the night face: 6 PM the day before Fajr → Fajr. */
export function maxDesiredSleepHours(fajrTime: Date): number {
  const nightStart = new Date(fajrTime);
  nightStart.setDate(nightStart.getDate() - 1);
  nightStart.setHours(NIGHT_START_HOUR, 0, 0, 0);
  const hours = (fajrTime.getTime() - nightStart.getTime()) / 3_600_000;
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
  const maxMinutes = Math.round(maxDesiredSleepHours(fajrTime) * 60);
  const clamped = Math.max(30, Math.min(maxMinutes, minutes));
  return clamped / 60;
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
