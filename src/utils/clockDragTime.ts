import {
  bedtimeFromSleepHours,
  clampWakeTime,
  offsetFromWakeTime,
  sleepHoursFromBedtime,
  wakeTimeFromOffset,
  TIME_SNAP_MINUTES,
} from '@/utils/alarmPickerTime';

/** Map a clock time to degrees on a 12-hour face (12 o'clock = 0°). */
export function dateTo12Angle(date: Date): number {
  const mins = (date.getHours() % 12) * 60 + date.getMinutes();
  return (mins / 720) * 360;
}

/** Clockwise degrees from 12 o'clock (0–360). */
export function angleFromPoint(cx: number, cy: number, x: number, y: number): number {
  const rad = Math.atan2(y - cy, x - cx);
  let deg = (rad * 180) / Math.PI + 90;
  return ((deg % 360) + 360) % 360;
}

/** Snap to 5-minute steps on a 12-hour face. */
export function parse12hAngle(angleDeg: number): { hour12: number; minutes: number } {
  const normalized = ((angleDeg % 360) + 360) % 360;
  const totalMins = Math.round(((normalized / 360) * 720) / TIME_SNAP_MINUTES) * TIME_SNAP_MINUTES;
  const h = Math.floor(totalMins / 60) % 12;
  const minutes = totalMins % 60;
  const hour12 = h === 0 ? 12 : h;
  return { hour12, minutes };
}

function nearestPriorTimeOfDay(hours: number, minutes: number, fajrTime: Date): Date {
  const candidate = new Date(fajrTime);
  candidate.setHours(hours, minutes, 0, 0);
  if (candidate.getTime() >= fajrTime.getTime()) {
    candidate.setDate(candidate.getDate() - 1);
  }
  return candidate;
}

/**
 * Map dial angle to a bedtime on the night before Fajr. A 12-hour dial reading is
 * inherently AM/PM-ambiguous, so this picks whichever half-day reading lands closer
 * to (but before) Fajr — the seam this creates sits opposite Fajr on the dial rather
 * than at a fixed hour, so it tracks Fajr instead of assuming bedtime is after 6pm.
 */
export function bedDateFrom12hAngle(angleDeg: number, fajrTime: Date): Date {
  const { hour12, minutes } = parse12hAngle(angleDeg);
  const am = nearestPriorTimeOfDay(hour12 === 12 ? 0 : hour12, minutes, fajrTime);
  const pm = nearestPriorTimeOfDay(hour12 === 12 ? 12 : hour12 + 12, minutes, fajrTime);
  return fajrTime.getTime() - am.getTime() <= fajrTime.getTime() - pm.getTime() ? am : pm;
}

/** Map dial angle to a wake time on Fajr morning (12h face, AM), capped at Shurooq. */
export function wakeDateFrom12hAngle(angleDeg: number, fajrTime: Date, sunriseTime?: Date): Date {
  const { hour12, minutes } = parse12hAngle(angleDeg);
  const picked = new Date(fajrTime);
  picked.setHours(hour12 === 12 ? 0 : hour12, minutes, 0, 0);
  if (sunriseTime) return clampWakeTime(picked, fajrTime, sunriseTime);
  const earliest = new Date(fajrTime.getTime() - 60 * 60_000);
  if (picked.getTime() < earliest.getTime()) return earliest;
  if (picked.getTime() > fajrTime.getTime()) return new Date(fajrTime);
  return picked;
}

export function sleepHoursFrom12hAngle(angleDeg: number, fajrTime: Date): number {
  return sleepHoursFromBedtime(fajrTime, bedDateFrom12hAngle(angleDeg, fajrTime));
}

export function wakeOffsetFrom12hAngle(
  angleDeg: number,
  fajrTime: Date,
  sunriseTime?: Date,
): number {
  return offsetFromWakeTime(
    fajrTime,
    wakeDateFrom12hAngle(angleDeg, fajrTime, sunriseTime),
    sunriseTime,
  );
}

/** Snap a drag angle to the nearest valid, 5-minute bed time on the dial. */
export function snapBedAngle(angleDeg: number, fajrTime: Date): number {
  const hours = sleepHoursFrom12hAngle(angleDeg, fajrTime);
  const bed = bedtimeFromSleepHours(fajrTime, hours);
  return dateTo12Angle(bedDateFrom12hAngle(dateTo12Angle(bed), fajrTime));
}

/** Snap a drag angle to the nearest valid, 5-minute wake time on the dial. */
export function snapWakeAngle(angleDeg: number, fajrTime: Date, sunriseTime?: Date): number {
  const offset = wakeOffsetFrom12hAngle(angleDeg, fajrTime, sunriseTime);
  const wake = wakeTimeFromOffset(fajrTime, offset);
  return dateTo12Angle(wakeDateFrom12hAngle(dateTo12Angle(wake), fajrTime, sunriseTime));
}
