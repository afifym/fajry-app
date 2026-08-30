import {
  NIGHT_START_HOUR,
  offsetFromNightFaceWake,
  snapToFiveMinutes,
  TIME_SNAP_MINUTES,
} from '@/utils/alarmPickerTime';

const DIAL_STEP_DEG = 360 / (12 * (60 / TIME_SNAP_MINUTES));

/** Map a clock time to degrees on a 12-hour face (12 o'clock = 0°). */
export function dateTo12Angle(date: Date): number {
  const mins = (date.getHours() % 12) * 60 + date.getMinutes();
  return (mins / 720) * 360;
}

/**
 * Place a time on the night face: 6 PM–12 AM left, 12 AM–6 AM right.
 * Daytime hours keep the 12-hour angle so sunrise just after 6 still sits by the seam.
 */
export function dateToNightFaceAngle(date: Date): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours >= 18) {
    return ((hours - 12) * 60 + minutes) / 720 * 360;
  }
  if (hours < 6) {
    return (hours * 60 + minutes) / 720 * 360;
  }
  return dateTo12Angle(date);
}

/** Align a clock time to Fajr's night without changing AM/PM. */
export function toNightFaceDisplayDate(date: Date, fajrTime: Date): Date {
  return nightFaceDate(date.getHours(), date.getMinutes(), fajrTime);
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

/** PM is always the calendar day before Fajr. AM is Fajr's morning. */
function nightFaceDate(hours: number, minutes: number, fajrTime: Date): Date {
  const candidate = new Date(fajrTime);
  candidate.setHours(hours, minutes, 0, 0);
  if (hours >= NIGHT_START_HOUR) {
    candidate.setDate(candidate.getDate() - 1);
    return candidate;
  }
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

/** Snap to a 5-minute tick on the 12-hour face. */
export function snapDialAngle(angleDeg: number): number {
  const normalized = ((angleDeg % 360) + 360) % 360;
  const snapped = Math.round(normalized / DIAL_STEP_DEG) * DIAL_STEP_DEG;
  return ((snapped % 360) + 360) % 360;
}

/** Read a 12-hour dial angle as AM or PM. Bed stays PM; wake stays AM. */
export function timeOfDayFrom12hAngle(
  angleDeg: number,
  period: 'AM' | 'PM',
): { hours: number; minutes: number } {
  const snapped = snapDialAngle(angleDeg);
  const totalMins = Math.round((snapped / 360) * 720);
  const hour12 = Math.floor(totalMins / 60) % 12 || 12;
  const minutes = totalMins % 60;
  if (period === 'PM') return { hours: hour12 === 12 ? 12 : hour12 + 12, minutes };
  return { hours: hour12 === 12 ? 0 : hour12, minutes };
}

/**
 * Map dial angle to a bedtime. The hour on the face is always PM,
 * so crossing 6 stays 5 PM rather than flipping to 5 AM.
 */
export function bedDateFrom12hAngle(angleDeg: number, fajrTime: Date): Date {
  const { hours, minutes } = timeOfDayFrom12hAngle(angleDeg, 'PM');
  return nightFaceDate(hours, minutes, fajrTime);
}

/** Map dial angle to a wake time. The hour on the face is always AM. */
export function wakeDateFrom12hAngleRaw(angleDeg: number, fajrTime: Date): Date {
  const { hours, minutes } = timeOfDayFrom12hAngle(angleDeg, 'AM');
  const picked = new Date(fajrTime);
  picked.setHours(hours, minutes, 0, 0);
  return picked;
}

/** Map dial angle to a wake time on the night face. */
export function wakeDateFrom12hAngle(angleDeg: number, fajrTime: Date, _sunriseTime?: Date): Date {
  return wakeDateFrom12hAngleRaw(angleDeg, fajrTime);
}

export function sleepHoursFrom12hAngle(angleDeg: number, fajrTime: Date): number {
  const bed = bedDateFrom12hAngle(angleDeg, fajrTime);
  return (
    snapToFiveMinutes(Math.round((fajrTime.getTime() - bed.getTime()) / 60_000)) / 60
  );
}

export function wakeOffsetFrom12hAngle(
  angleDeg: number,
  fajrTime: Date,
  sunriseTime?: Date,
): number {
  return offsetFromNightFaceWake(
    fajrTime,
    wakeDateFrom12hAngleRaw(angleDeg, fajrTime),
    sunriseTime,
  );
}

/** Snap a drag angle to a 5-minute tick on the night face. */
export function snapBedAngle(angleDeg: number, fajrTime: Date): number {
  return dateToNightFaceAngle(bedDateFrom12hAngle(snapDialAngle(angleDeg), fajrTime));
}

/** Snap a drag angle to a 5-minute tick on the night face. */
export function snapWakeAngle(angleDeg: number, fajrTime: Date, _sunriseTime?: Date): number {
  return dateToNightFaceAngle(wakeDateFrom12hAngleRaw(snapDialAngle(angleDeg), fajrTime));
}
