/** Map a time-wheel selection to pre-alarm offset minutes before Fajr. */
export function offsetFromWakeTime(fajrTime: Date, picked: Date): number {
  const aligned = new Date(picked);
  aligned.setFullYear(fajrTime.getFullYear(), fajrTime.getMonth(), fajrTime.getDate());
  const minutes = Math.round((fajrTime.getTime() - aligned.getTime()) / 60_000);
  return Math.max(0, Math.min(60, minutes));
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
  const hours = (fajrTime.getTime() - aligned.getTime()) / 3_600_000;
  return Math.max(0.5, Math.min(12, Math.round(hours * 2) / 2));
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
