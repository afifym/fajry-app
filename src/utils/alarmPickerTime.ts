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

export function wakeTimeFromOffset(fajrTime: Date, offsetMinutes: number): Date {
  return new Date(fajrTime.getTime() - offsetMinutes * 60_000);
}

/** Map a time-wheel selection to desired sleep hours before Fajr. */
export function sleepHoursFromBedtime(fajrTime: Date, picked: Date): number {
  const aligned = new Date(picked);
  aligned.setFullYear(fajrTime.getFullYear(), fajrTime.getMonth(), fajrTime.getDate());
  if (aligned.getTime() >= fajrTime.getTime()) {
    aligned.setDate(aligned.getDate() - 1);
  }
  const minutes = snapToFiveMinutes(
    Math.round((fajrTime.getTime() - aligned.getTime()) / 60_000),
  );
  const clamped = Math.max(30, Math.min(12 * 60, minutes));
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
