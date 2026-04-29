import type { SaleRecord } from "./api";


export const getCurrentMonth = () =>
  new Date().toISOString().slice(0, 7);


// Returns start and end date for a given month (YYYY-MM)

export const getMonthDateRange = (month: string) => {
  const [year, monthValue] = month.split("-").map(Number);
  const lastDay = new Date(year, monthValue, 0).getDate();

  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
};


// Shifts a month forward/backward

export const shiftMonth = (month: string, offset: number) => {
  const [year, monthValue] = month.split("-").map(Number);
  const date = new Date(year, monthValue - 1 + offset, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};


// Extract available YYYY-MM periods from sales data

export const getAvailablePeriods = (sales: SaleRecord[]) =>
  Array.from(new Set(sales.map((sale) => sale.date.slice(0, 7))))
    .sort((a, b) => b.localeCompare(a));


// Pick default period (current month if exists, else first available)

export const getDefaultPeriod = (periods: string[]) => {
  const currentMonth = getCurrentMonth();

  if (periods.includes(currentMonth)) {
    return currentMonth;
  }

  return periods[0] ?? "";
};

//Sum sales data

export const sumSales = (entries: SaleRecord[]) =>
  entries.reduce(
    (acc, sale) => {
      acc.total += sale.lunch_sale + sale.dinner_sale;
      acc.lunch += sale.lunch_sale;
      acc.dinner += sale.dinner_sale;
      return acc;
    },
    { total: 0, lunch: 0, dinner: 0 }
  );