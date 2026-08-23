import {
  bedtimeFromSleepHours,
  clampWakeTime,
  offsetFromWakeTime,
  sleepHoursFromBedtime,
  wakeTimeFromOffset,
  TIME_SNAP_MINUTES,
} from '@/utils/alarmPickerTime';

const DIAL_STEP_DEG = 360 / (12 * (60 / TIME_SNAP_MINUTES));

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

/** Right half (12→6) is AM; left half (6→12) is PM. */
export function periodFrom12hAngle(angleDeg: number): 'AM' | 'PM' {
  const normalized = ((angleDeg % 360) + 360) % 360;
  return normalized < 180 ? 'AM' : 'PM';
}

/** Snap to a 5-minute tick without crossing the 6 o’clock AM/PM seam. */
export function snapDialAngle(angleDeg: number): number {
  const normalized = ((angleDeg % 360) + 360) % 360;
  let snapped = Math.round(normalized / DIAL_STEP_DEG) * DIAL_STEP_DEG;
  snapped = ((snapped % 360) + 360) % 360;
  if (periodFrom12hAngle(snapped) !== periodFrom12hAngle(normalized)) {
    snapped = normalized < 180 ? 180 - DIAL_STEP_DEG : 180;
  }
  return snapped;
}

/** Clock hours on the night face: 12 AM–6 AM on the right, 6 PM–12 AM on the left. */
export function timeOfDayFrom12hAngle(angleDeg: number): { hours: number; minutes: number } {
  const snapped = snapDialAngle(angleDeg);
  const totalMins = Math.round((snapped / 360) * 720);
  const hour12 = Math.floor(totalMins / 60) % 12 || 12;
  const minutes = totalMins % 60;
  const period = periodFrom12hAngle(snapped);
  if (period === 'PM') return { hours: hour12 === 12 ? 12 : hour12 + 12, minutes };
  return { hours: hour12 === 12 ? 0 : hour12, minutes };
}

/**
 * Map dial angle to a bedtime on the night before Fajr.
 * The sleep face skips daytime: right side is AM, left side is PM.
 */
export function bedDateFrom12hAngle(angleDeg: number, fajrTime: Date): Date {
  const { hours, minutes } = timeOfDayFrom12hAngle(angleDeg);
  return nearestPriorTimeOfDay(hours, minutes, fajrTime);
}

/** Map dial angle to a wake time on the night face without range clamping. */
export function wakeDateFrom12hAngleRaw(angleDeg: number, fajrTime: Date): Date {
  const { hours, minutes } = timeOfDayFrom12hAngle(angleDeg);
  const picked = new Date(fajrTime);
  picked.setHours(hours, minutes, 0, 0);
  return picked;
}

/** Map dial angle to a wake time on the same night face, capped at Shurooq. */
export function wakeDateFrom12hAngle(angleDeg: number, fajrTime: Date, sunriseTime?: Date): Date {
  const picked = wakeDateFrom12hAngleRaw(angleDeg, fajrTime);
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
  return dateTo12Angle(bedtimeFromSleepHours(fajrTime, hours));
}

/** Snap a drag angle to the nearest valid, 5-minute wake time on the dial. */
export function snapWakeAngle(angleDeg: number, fajrTime: Date, sunriseTime?: Date): number {
  const offset = wakeOffsetFrom12hAngle(angleDeg, fajrTime, sunriseTime);
  const wake = wakeTimeFromOffset(fajrTime, offset);
  return dateTo12Angle(wakeDateFrom12hAngle(dateTo12Angle(wake), fajrTime, sunriseTime));
}
