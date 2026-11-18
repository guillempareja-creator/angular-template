import { addDays, subDays } from 'date-fns';
import { isDateAfter, isDateBefore, isDateWithinRange } from './dates.utils';

describe('dates.utils', () => {
  const today = new Date(2026, 0, 15, 12, 0);
  const todayMorning = new Date(2026, 0, 15, 8, 0);
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);

  describe('isDateBefore', () => {
    it('should be true when the date is earlier', () => {
      expect(isDateBefore(yesterday, today)).toBe(true);
    });

    it('should be true for the same day when equality is included', () => {
      expect(isDateBefore(todayMorning, today)).toBe(true);
    });

    it('should be false for the same day when equality is excluded', () => {
      expect(isDateBefore(todayMorning, today, false)).toBe(false);
    });

    it('should compare the time when ignoreTime is false', () => {
      expect(isDateBefore(todayMorning, today, false, false)).toBe(true);
    });
  });

  describe('isDateAfter', () => {
    it('should be true when the date is later', () => {
      expect(isDateAfter(tomorrow, today)).toBe(true);
    });

    it('should be false when the date is earlier', () => {
      expect(isDateAfter(yesterday, today)).toBe(false);
    });
  });

  describe('isDateWithinRange', () => {
    it('should be true when the date is inside the range', () => {
      expect(isDateWithinRange(today, yesterday, tomorrow)).toBe(true);
    });

    it('should be false when the date is outside the range', () => {
      expect(isDateWithinRange(addDays(tomorrow, 1), yesterday, tomorrow)).toBe(
        false,
      );
    });

    it('should be false when the range is inverted', () => {
      expect(isDateWithinRange(today, tomorrow, yesterday)).toBe(false);
    });

    it('should compare the time when ignoreTime is false', () => {
      expect(isDateWithinRange(todayMorning, today, tomorrow, false)).toBe(
        false,
      );
    });
  });
});
