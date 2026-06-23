import {
  offsetFromWakeTime,
  sleepDurationBetween,
  sleepHoursFromBedtime,
  wakeTimeFromOffset,
  bedtimeFromSleepHours,
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

    it('clamps to 0–60 minutes before Fajr', () => {
      const atFajr = wakeTimeFromOffset(fajr, 0);
      expect(offsetFromWakeTime(fajr, atFajr)).toBe(0);

      const tooEarly = new Date(fajr.getTime() - 90 * 60_000);
      expect(offsetFromWakeTime(fajr, tooEarly)).toBe(60);
    });
  });

  describe('bedtimeFromSleepHours / sleepHoursFromBedtime', () => {
    it('round-trips sleep hours across midnight', () => {
      const bed = bedtimeFromSleepHours(fajr, 7);
      expect(bed.getDate()).toBe(14);
      expect(bed.getHours()).toBe(22);
      expect(bed.getMinutes()).toBe(30);
      expect(sleepHoursFromBedtime(fajr, bed)).toBe(7);
    });

    it('clamps to 0.5–12 hours before Fajr', () => {
      const tooLate = new Date(fajr.getTime() - 15 * 60_000);
      expect(sleepHoursFromBedtime(fajr, tooLate)).toBe(0.5);

      const tooEarly = new Date(fajr.getTime() - 14 * 3_600_000);
      expect(sleepHoursFromBedtime(fajr, tooEarly)).toBe(12);
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
