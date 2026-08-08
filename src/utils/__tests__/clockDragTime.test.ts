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

  it('bedDateFrom12hAngle resolves 5:50 to PM, not a bogus 23h40m AM reading', () => {
    const bed = bedDateFrom12hAngle(175, fajr);
    expect(bed.getHours()).toBe(17);
    expect(bed.getDate()).toBe(14);
  });

  it('bedDateFrom12hAngle tracks the seam to Fajr instead of a fixed 6pm', () => {
    const earlyFajr = new Date(2024, 0, 15, 4, 0, 0);
    const bed = bedDateFrom12hAngle(120, earlyFajr);
    expect(bed.getHours()).toBe(16);
    expect(bed.getDate()).toBe(14);
  });

  it('bedDateFrom12hAngle has no discontinuity around the old fixed 6pm seam', () => {
    const before = bedDateFrom12hAngle(179, fajr);
    const at = bedDateFrom12hAngle(180, fajr);
    const after = bedDateFrom12hAngle(181, fajr);
    expect(Math.abs(at.getTime() - before.getTime())).toBeLessThan(6 * 60_000);
    expect(Math.abs(after.getTime() - at.getTime())).toBeLessThan(6 * 60_000);
  });
});
