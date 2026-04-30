import {
  getMonthDateRange,
  shiftMonth,
  getAvailablePeriods,
  getDefaultPeriod,
  sumSales,
} from "../lib/dashboardUtils";

describe('dashboardUtils', () => {
  describe('getMonthDateRange', () => {
    it('returns correct start and end date', () => {
      const result = getMonthDateRange('2024-02');
      expect(result).toEqual({
        startDate: '2024-02-01',
        endDate: '2024-02-29', // leap year check
      });
    });
  });

  describe('shiftMonth', () => {
    it('shifts forward correctly', () => {
      expect(shiftMonth('2024-01', 1)).toBe('2024-02');
    });

    it('shifts backward across year', () => {
      expect(shiftMonth('2024-01', -1)).toBe('2023-12');
    });
  });

  describe('getAvailablePeriods', () => {
    it('returns sorted unique months', () => {
      const sales = [
        { date: '2024-01-01' },
        { date: '2024-01-15' },
        { date: '2024-02-01' },
      ];

      const result = getAvailablePeriods(sales as any);

      expect(result).toEqual(['2024-02', '2024-01']);
    });
  });

  describe('getDefaultPeriod', () => {
    it('returns first period if current month not included', () => {
      const periods = ['2024-02', '2024-01'];
      expect(getDefaultPeriod(periods)).toBe('2024-02');
    });
  });

  describe('sumSales', () => {
    it('sums sales correctly', () => {
      const sales = [
        { lunch_sale: 100, dinner_sale: 200 },
        { lunch_sale: 50, dinner_sale: 150 },
      ];

      const result = sumSales(sales as any);

      expect(result).toEqual({
        total: 500,
        lunch: 150,
        dinner: 350,
      });
    });

    it('handles empty array', () => {
      const result = sumSales([]);
      expect(result).toEqual({
        total: 0,
        lunch: 0,
        dinner: 0,
      });
    });
  });
});