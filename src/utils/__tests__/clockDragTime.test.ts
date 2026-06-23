import {
  angleFromPoint,
  bedDateFrom12hAngle,
  parse12hAngle,
  sleepHoursFrom12hAngle,
  wakeDateFrom12hAngle,
  wakeOffsetFrom12hAngle,
} from '../clockDragTime';

const fajr = new Date(2024, 0, 15, 5, 30, 0);

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

  it('wakeOffsetFrom12hAngle round-trips 5:15 AM wake', () => {
    expect(wakeOffsetFrom12hAngle(157.5, fajr)).toBe(15);
  });
});
