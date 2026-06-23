import {
  offsetFromWakeTime,
  sleepHoursFromBedtime,
} from '@/utils/alarmPickerTime';

/** Clockwise degrees from 12 o'clock (0–360). */
export function angleFromPoint(cx: number, cy: number, x: number, y: number): number {
  const rad = Math.atan2(y - cy, x - cx);
  let deg = (rad * 180) / Math.PI + 90;
  return ((deg % 360) + 360) % 360;
}

/** Snap to 5-minute steps on a 12-hour face. */
export function parse12hAngle(angleDeg: number): { hour12: number; minutes: number } {
  const normalized = ((angleDeg % 360) + 360) % 360;
  const totalMins = Math.round(((normalized / 360) * 720) / 5) * 5;
  const h = Math.floor(totalMins / 60) % 12;
  const minutes = totalMins % 60;
  const hour12 = h === 0 ? 12 : h;
  return { hour12, minutes };
}

/** Map dial angle to a bedtime on the night before Fajr. */
export function bedDateFrom12hAngle(angleDeg: number, fajrTime: Date): Date {
  const { hour12, minutes } = parse12hAngle(angleDeg);
  const picked = new Date(fajrTime);
  if (hour12 === 12) {
    picked.setHours(0, minutes, 0, 0);
  } else if (hour12 >= 6) {
    picked.setHours(hour12 + 12, minutes, 0, 0);
  } else {
    picked.setHours(hour12, minutes, 0, 0);
  }
  if (picked.getTime() >= fajrTime.getTime()) {
    picked.setDate(picked.getDate() - 1);
  }
  return picked;
}

/** Map dial angle to a wake time on Fajr morning (12h face, AM). */
export function wakeDateFrom12hAngle(angleDeg: number, fajrTime: Date): Date {
  const { hour12, minutes } = parse12hAngle(angleDeg);
  const picked = new Date(fajrTime);
  picked.setHours(hour12 === 12 ? 0 : hour12, minutes, 0, 0);
  return picked;
}

export function sleepHoursFrom12hAngle(angleDeg: number, fajrTime: Date): number {
  return sleepHoursFromBedtime(fajrTime, bedDateFrom12hAngle(angleDeg, fajrTime));
}

export function wakeOffsetFrom12hAngle(angleDeg: number, fajrTime: Date): number {
  return offsetFromWakeTime(fajrTime, wakeDateFrom12hAngle(angleDeg, fajrTime));
}
