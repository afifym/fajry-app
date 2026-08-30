import {
  offsetFromWakeTime,
  sleepDurationBetween,
  sleepHoursFromBedtime,
  wakeTimeFromOffset,
  bedtimeFromSleepHours,
  nightFaceDateFromTime,
  nightFaceStart,
} from '../alarmPickerTime';

describe('alarmPickerTime', () => {
  const fajr = new Date(2024, 0, 15, 5, 30, 0); // 15 Jan 2024, 5:30 AM

  describe('wakeTimeFromOffset / offsetFromWakeTime', () => {
    it('round-trips offset minutes', () => {
      const alarm = wakeTimeFromOffset(fajr, 15);
      expect(alarm.getHours()).toBe(5);
      expect(alarm.getMinutes()).toBe(15);
      expect(offsetFromWakeTime(fajr, alarm)).toBe(15);
    });

    it('clamps to 0–60 minutes before Fajr when sunrise is not provided', () => {
      const atFajr = wakeTimeFromOffset(fajr, 0);
      expect(offsetFromWakeTime(fajr, atFajr)).toBe(0);

      const tooEarly = new Date(fajr.getTime() - 90 * 60_000);
      expect(offsetFromWakeTime(fajr, tooEarly)).toBe(60);

      const afterFajr = new Date(fajr.getTime() + 30 * 60_000);
      expect(offsetFromWakeTime(fajr, afterFajr)).toBe(0);
    });

    it('allows wake between Fajr and Shurooq but not after Shurooq', () => {
      const sunrise = new Date(2024, 0, 15, 6, 41, 0);
      const afterFajr = new Date(2024, 0, 15, 6, 0, 0);
      expect(offsetFromWakeTime(fajr, afterFajr, sunrise)).toBe(-30);

      const afterSunrise = new Date(2024, 0, 15, 7, 0, 0);
      expect(offsetFromWakeTime(fajr, afterSunrise, sunrise)).toBe(-70);
      expect(
        wakeTimeFromOffset(fajr, offsetFromWakeTime(fajr, afterSunrise, sunrise)).getTime(),
      ).toBeLessThanOrEqual(sunrise.getTime());
    });

    it('snaps wake offset to five-minute steps', () => {
      const picked = new Date(fajr.getTime() - 17 * 60_000);
      expect(offsetFromWakeTime(fajr, picked)).toBe(15);
    });
  });

  describe('sleepHoursFromBedtime / bedtimeFromSleepHours', () => {
    it('round-trips sleep hours across midnight', () => {
      const bed = bedtimeFromSleepHours(fajr, 7);
      expect(bed.getDate()).toBe(14);
      expect(bed.getHours()).toBe(22);
      expect(bed.getMinutes()).toBe(30);
      expect(sleepHoursFromBedtime(fajr, bed)).toBe(7);
    });

    it('snaps to five-minute steps without clamping the bedtime', () => {
      const uneven = new Date(fajr.getTime() - (7 * 60 + 17) * 60_000);
      expect(sleepHoursFromBedtime(fajr, uneven)).toBe(7 + 15 / 60);

      const fiveFiftyPm = new Date(2024, 0, 14, 17, 50, 0);
      expect(sleepHoursFromBedtime(fajr, fiveFiftyPm)).toBe(11 + 40 / 60);
    });

    it('keeps a 10 PM bedtime as 10 PM', () => {
      const tenPm = new Date(2024, 0, 14, 22, 0, 0);
      expect(sleepHoursFromBedtime(fajr, tenPm)).toBe(7.5);
      expect(bedtimeFromSleepHours(fajr, 7.5).getHours()).toBe(22);
    });

    it('treats 6 PM as the evening before Fajr, not after Fajr', () => {
      const sixPm = new Date(2024, 0, 15, 18, 0, 0);
      const hours = sleepHoursFromBedtime(fajr, sixPm);
      const bed = bedtimeFromSleepHours(fajr, hours);
      expect(bed.getHours()).toBe(18);
      expect(bed.getDate()).toBe(14);
    });
  });

  describe('nightFaceDateFromTime', () => {
    it('keeps a 5 AM wake on Fajr morning, after the 6 PM seam', () => {
      const fiveAm = new Date(2024, 0, 14, 5, 0, 0);
      const aligned = nightFaceDateFromTime(fajr, fiveAm);
      expect(aligned.getDate()).toBe(15);
      expect(aligned.getHours()).toBe(5);
      expect(aligned.getTime()).toBeGreaterThan(nightFaceStart(fajr).getTime());
    });

    it('places 11 PM on the evening before Fajr', () => {
      const elevenPm = new Date(2024, 0, 15, 23, 0, 0);
      const aligned = nightFaceDateFromTime(fajr, elevenPm);
      expect(aligned.getDate()).toBe(14);
      expect(aligned.getHours()).toBe(23);
    });
  });

  describe('sleepDurationBetween', () => {
    it('measures overnight sleep using full timestamps', () => {
      const bed = new Date(2024, 0, 14, 23, 0, 0);
      const wake = new Date(2024, 0, 15, 5, 0, 0);
      expect(sleepDurationBetween(bed, wake)).toBe(6 * 3_600_000);
    });

    it('does not fake 6 hours when wake is earlier on the same calendar day', () => {
      const bed = new Date(2024, 0, 15, 23, 0, 0);
      const wake = new Date(2024, 0, 15, 5, 0, 0);
      expect(sleepDurationBetween(bed, wake)).toBe(6 * 3_600_000);
    });
  });
});
