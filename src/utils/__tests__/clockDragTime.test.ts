import {
  angleFromPoint,
  bedDateFrom12hAngle,
  dateTo12Angle,
  dateToNightFaceAngle,
  parse12hAngle,
  periodFrom12hAngle,
  sleepHoursFrom12hAngle,
  snapBedAngle,
  snapDialAngle,
  snapWakeAngle,
  timeOfDayFrom12hAngle,
  wakeDateFrom12hAngle,
  wakeOffsetFrom12hAngle,
} from '../clockDragTime';
import { wakeTimeFromOffset } from '../alarmPickerTime';

const fajr = new Date(2024, 0, 15, 5, 30, 0);
const sunrise = new Date(2024, 0, 15, 6, 41, 0);

describe('clockDragTime', () => {
  it('parse12hAngle maps 11 o’clock to hour 11', () => {
    expect(parse12hAngle(330)).toEqual({ hour12: 11, minutes: 0 });
  });

  it('parse12hAngle maps 5 o’clock to hour 5', () => {
    expect(parse12hAngle(150)).toEqual({ hour12: 5, minutes: 0 });
  });

  it('angleFromPoint returns 0 at 12 o’clock', () => {
    expect(Math.round(angleFromPoint(150, 150, 150, 50))).toBe(0);
  });

  it('bedDateFrom12hAngle resolves 11 PM to the previous calendar day', () => {
    const bed = bedDateFrom12hAngle(330, fajr);
    expect(bed.getDate()).toBe(14);
    expect(bed.getHours()).toBe(23);
  });

  it('wakeDateFrom12hAngle resolves 5 AM on Fajr day', () => {
    const wake = wakeDateFrom12hAngle(150, fajr);
    expect(wake.getDate()).toBe(15);
    expect(wake.getHours()).toBe(5);
    expect(wake.getMinutes()).toBe(0);
  });

  it('sleepHoursFrom12hAngle round-trips 11 PM bed', () => {
    expect(sleepHoursFrom12hAngle(330, fajr)).toBe(6.5);
  });

  it('wakeDateFrom12hAngle caps at Shurooq', () => {
    const wake = wakeDateFrom12hAngle(210, fajr, sunrise);
    expect(wake.getHours()).toBe(6);
    expect(wake.getMinutes()).toBe(41);
  });

  it('wakeOffsetFrom12hAngle round-trips 5:15 AM wake', () => {
    expect(wakeOffsetFrom12hAngle(157.5, fajr)).toBe(15);
  });

  it('snapWakeAngle maps out-of-range drag to the Shurooq cap', () => {
    const snapped = snapWakeAngle(300, fajr, sunrise);
    const wake = wakeTimeFromOffset(
      fajr,
      wakeOffsetFrom12hAngle(300, fajr, sunrise),
    );
    expect(wake.getTime()).toBeLessThanOrEqual(sunrise.getTime());
    expect(snapWakeAngle(snapped, fajr, sunrise)).toBe(snapped);
  });

  it('snapBedAngle stabilises drag angles through sleep-hour clamping', () => {
    const snapped = snapBedAngle(90, fajr);
    expect(snapped).toBe(dateToNightFaceAngle(bedDateFrom12hAngle(snapped, fajr)));
    expect(sleepHoursFrom12hAngle(snapped, fajr)).toBe(sleepHoursFrom12hAngle(90, fajr));
  });

  it('maps the right half to AM and the left half to PM for bedtime', () => {
    expect(bedDateFrom12hAngle(90, fajr).getHours()).toBe(3);
    expect(bedDateFrom12hAngle(270, fajr).getHours()).toBe(21);
    expect(bedDateFrom12hAngle(180, fajr).getHours()).toBe(18);
    expect(bedDateFrom12hAngle(0, fajr).getHours()).toBe(0);
  });

  it('keeps 5:50 on the AM right half', () => {
    const bed = bedDateFrom12hAngle(175, fajr);
    expect(bed.getHours()).toBe(5);
    expect(bed.getMinutes()).toBe(50);
  });

  it('keeps 4 o’clock as 4 AM on the right half', () => {
    const earlyFajr = new Date(2024, 0, 15, 4, 0, 0);
    const bed = bedDateFrom12hAngle(120, earlyFajr);
    expect(bed.getHours()).toBe(4);
    expect(bed.getDate()).toBe(14);
  });

  it('maps wake handles with the same night-face hours as bedtime', () => {
    expect(timeOfDayFrom12hAngle(90)).toEqual({ hours: 3, minutes: 0 });
    expect(timeOfDayFrom12hAngle(270)).toEqual({ hours: 21, minutes: 0 });
    expect(timeOfDayFrom12hAngle(180)).toEqual({ hours: 18, minutes: 0 });
    expect(timeOfDayFrom12hAngle(0)).toEqual({ hours: 0, minutes: 0 });
    expect(wakeDateFrom12hAngle(150, fajr).getHours()).toBe(5);
  });

  it('flips AM/PM when the dial crosses 6', () => {
    expect(periodFrom12hAngle(165)).toBe('AM');
    expect(periodFrom12hAngle(195)).toBe('PM');
    expect(bedDateFrom12hAngle(165, fajr).getHours()).toBe(5);
    expect(bedDateFrom12hAngle(195, fajr).getHours()).toBe(18);
  });

  it('snapDialAngle keeps AM and PM on either side of 6', () => {
    expect(periodFrom12hAngle(snapDialAngle(175))).toBe('AM');
    expect(periodFrom12hAngle(snapDialAngle(185))).toBe('PM');
    expect(timeOfDayFrom12hAngle(snapDialAngle(175)).hours).toBe(5);
    expect(timeOfDayFrom12hAngle(snapDialAngle(185)).hours).toBe(18);
  });

  it('dateToNightFaceAngle keeps 6:30 PM on the left half', () => {
    const sixThirtyPm = new Date(2024, 0, 14, 18, 30, 0);
    expect(periodFrom12hAngle(dateToNightFaceAngle(sixThirtyPm))).toBe('PM');
    expect(timeOfDayFrom12hAngle(dateToNightFaceAngle(sixThirtyPm))).toEqual({
      hours: 18,
      minutes: 30,
    });
  });

  it('releasing past 6 PM commits 6:30 PM hours, not a 3:58 AM bedtime', () => {
    const threeFiftyEightAm = new Date(2024, 0, 15, 3, 58, 0);
    const previousHours = sleepHoursFrom12hAngle(dateTo12Angle(threeFiftyEightAm), fajr);
    const releasedHours = sleepHoursFrom12hAngle(195, fajr);
    expect(releasedHours).toBe(11);
    expect(releasedHours).not.toBe(previousHours);
    expect(bedDateFrom12hAngle(195, fajr).getHours()).toBe(18);
  });

  it('6 PM on the dial is the calendar day before Fajr', () => {
    const bed = bedDateFrom12hAngle(180, fajr);
    expect(bed.getHours()).toBe(18);
    expect(bed.getDate()).toBe(14);
    expect(sleepHoursFrom12hAngle(180, fajr)).toBe(
      (fajr.getTime() - bed.getTime()) / 3_600_000,
    );
  });
});
