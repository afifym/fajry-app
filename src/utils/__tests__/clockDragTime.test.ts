import {
  angleFromPoint,
  bedDateFrom12hAngle,
  dateTo12Angle,
  parse12hAngle,
  sleepHoursFrom12hAngle,
  snapBedAngle,
  snapWakeAngle,
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
    expect(snapped).toBe(dateTo12Angle(bedDateFrom12hAngle(snapped, fajr)));
    expect(sleepHoursFrom12hAngle(snapped, fajr)).toBe(sleepHoursFrom12hAngle(90, fajr));
  });
});
