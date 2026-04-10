import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import DashboardSummaryCards, {
  type DashboardSummaryData,
} from "../components/dashboard/DashboardSummaryCards";
import SalesTrendChart from "../components/dashboard/SalesTrendChart";
import { useRestaurant } from "../context/useRestaurant";
import type { Restaurant } from "../lib/types";
import { fetchSales, type SaleRecord } from "../lib/api";

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const MONTH_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const getMonthDateRange = (month: string) => {
  const [year, monthValue] = month.split("-").map(Number);
  const lastDay = new Date(year, monthValue, 0).getDate();

  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
};

const shiftMonth = (month: string, offset: number) => {
  const [year, monthValue] = month.split("-").map(Number);
  const date = new Date(year, monthValue - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonthLabel = (month: string) => {
  const [year, monthValue] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthValue - 1, 1)));
};

const getAvailablePeriods = (sales: SaleRecord[]) =>
  Array.from(new Set(sales.map((sale) => sale.date.slice(0, 7)))).sort((left, right) => right.localeCompare(left));

const getDefaultPeriod = (periods: string[]) => {
  const currentMonth = getCurrentMonth();
  if (periods.includes(currentMonth)) {
    return currentMonth;
  }

  return periods[0] ?? "";
};

const initialSummary: DashboardSummaryData = {
  totalSales: 0,
  lunchSales: 0,
  dinnerSales: 0,
  previousTotalSales: 0,
  previousLunchSales: 0,
  previousDinnerSales: 0,
};

const sumSales = (entries: SaleRecord[]) =>
  entries.reduce(
    (acc, sale) => {
      acc.total += sale.lunch_sale + sale.dinner_sale;
      acc.lunch += sale.lunch_sale;
      acc.dinner += sale.dinner_sale;
      return acc;
    },
    { total: 0, lunch: 0, dinner: 0 }
  );

export default function Dashboard() {
  const { restaurants } = useRestaurant();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryData>(initialSummary);
  const [trendData, setTrendData] = useState<Array<{ day: string; sales: number }>>([]);
  const [allSales, setAllSales] = useState<SaleRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonthNumber, setSelectedMonthNumber] = useState("");

  const effectiveSelectedRestaurant =
    selectedRestaurant || (restaurants.length > 0 ? restaurants[0] : null);

  const availablePeriods = useMemo(() => getAvailablePeriods(allSales), [allSales]);
  const availableYears = useMemo(
    () => Array.from(new Set(availablePeriods.map((period) => period.slice(0, 4)))).sort((left, right) => right.localeCompare(left)),
    [availablePeriods]
  );
  const monthOptions = useMemo(
    () =>
      availablePeriods
        .filter((period) => period.startsWith(`${selectedYear}-`))
        .map((period) => {
          const monthValue = period.slice(5, 7);
          return {
            value: monthValue,
            label: MONTH_LABELS[Number(monthValue) - 1] ?? monthValue,
          };
        }),
    [availablePeriods, selectedYear]
  );
  const yearSelectValue = availableYears.includes(selectedYear) ? selectedYear : "";
  const monthSelectValue = monthOptions.some((option) => option.value === selectedMonthNumber) ? selectedMonthNumber : "";
  const selectedMonth = selectedYear && selectedMonthNumber ? `${selectedYear}-${selectedMonthNumber}` : "";

  useEffect(() => {
    if (!selectedRestaurant && restaurants.length > 0) {
      setSelectedRestaurant(restaurants[0]);
    }
  }, [restaurants, selectedRestaurant]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!effectiveSelectedRestaurant) {
        setAllSales([]);
        setSummary(initialSummary);
        setTrendData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const sales = await fetchSales({
          restaurantId: effectiveSelectedRestaurant.id,
        });

        if (!isMounted) return;
        setAllSales(sales);
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.message) {
          setError(err.message);
        } else if (typeof err === "object" && err !== null && "message" in err) {
          setError((err as { message?: string }).message || "Failed to load dashboard data");
        } else {
          setError("Failed to load dashboard data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [effectiveSelectedRestaurant]);

  useEffect(() => {
    const currentPeriod = selectedYear && selectedMonthNumber ? `${selectedYear}-${selectedMonthNumber}` : "";

    if (availablePeriods.length === 0) {
      if (selectedYear !== "") setSelectedYear("");
      if (selectedMonthNumber !== "") setSelectedMonthNumber("");
      return;
    }

    const nextPeriod = availablePeriods.includes(currentPeriod) ? currentPeriod : getDefaultPeriod(availablePeriods);
    const [nextYear, nextMonthNumber] = nextPeriod.split("-");

    if (nextYear !== selectedYear) {
      setSelectedYear(nextYear);
    }

    if (nextMonthNumber !== selectedMonthNumber) {
      setSelectedMonthNumber(nextMonthNumber);
    }
  }, [availablePeriods, selectedMonthNumber, selectedYear]);

  useEffect(() => {
    if (!selectedMonth) {
      setSummary(initialSummary);
      setTrendData([]);
      return;
    }

    const currentRange = getMonthDateRange(selectedMonth);
    const previousMonth = shiftMonth(selectedMonth, -1);
    const previousRange = getMonthDateRange(previousMonth);
    const currentSales = allSales.filter((sale) => sale.date >= currentRange.startDate && sale.date <= currentRange.endDate);
    const previousSales = allSales.filter((sale) => sale.date >= previousRange.startDate && sale.date <= previousRange.endDate);
    const trendMonths = Array.from({ length: 7 }, (_, index) => shiftMonth(selectedMonth, -(6 - index)));

    const currentTotals = sumSales(currentSales);
    const previousTotals = sumSales(previousSales);

    setSummary({
      totalSales: currentTotals.total,
      lunchSales: currentTotals.lunch,
      dinnerSales: currentTotals.dinner,
      previousTotalSales: previousTotals.total,
      previousLunchSales: previousTotals.lunch,
      previousDinnerSales: previousTotals.dinner,
    });
    setTrendData(
      trendMonths.map((monthKey) => {
        const range = getMonthDateRange(monthKey);
        const monthSales = allSales.filter((sale) => sale.date >= range.startDate && sale.date <= range.endDate);

        return {
          day: new Intl.DateTimeFormat("en-US", {
            month: "short",
            year: "2-digit",
            timeZone: "UTC",
          }).format(new Date(`${monthKey}-01T00:00:00Z`)),
          sales: sumSales(monthSales).total,
        };
      })
    );
  }, [allSales, selectedMonth]);

  const handleRestaurantChange = (id: number) => {
    const found = restaurants.find((r) => r.id === id) || null;
    setSelectedRestaurant(found);
  };

  return (
    <Box sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Welcome to {effectiveSelectedRestaurant?.name || "PrepSheet Dashboard"}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="dashboard-year-select-label">Year</InputLabel>
            <Select
              labelId="dashboard-year-select-label"
              id="dashboard-year-select"
              value={yearSelectValue}
              label="Year"
              onChange={(event) => {
                const nextYear = String(event.target.value);
                const nextMonthOptions = availablePeriods
                  .filter((period) => period.startsWith(`${nextYear}-`))
                  .map((period) => period.slice(5, 7));

                setSelectedYear(nextYear);
                setSelectedMonthNumber(nextMonthOptions[0] ?? "");
              }}
              disabled={availableYears.length === 0}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="dashboard-month-select-label">Month</InputLabel>
            <Select
              labelId="dashboard-month-select-label"
              id="dashboard-month-select"
              value={monthSelectValue}
              label="Month"
              onChange={(event) => setSelectedMonthNumber(String(event.target.value))}
              disabled={monthOptions.length === 0}
            >
              {monthOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {restaurants.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel id="dashboard-restaurant-select-label">Restaurant</InputLabel>
              <Select
                labelId="dashboard-restaurant-select-label"
                id="dashboard-restaurant-select"
                value={effectiveSelectedRestaurant?.id ?? restaurants[0]?.id ?? ""}
                label="Restaurant"
                onChange={(event) => handleRestaurantChange(Number(event.target.value))}
              >
                {restaurants.map((restaurant) => (
                  <MenuItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !selectedMonth ? (
        <Alert severity="info">No dashboard data is available for the selected restaurant yet.</Alert>
      ) : (
        <>
          <DashboardSummaryCards
            summary={summary}
            currentLabel={formatMonthLabel(selectedMonth)}
            previousLabel={formatMonthLabel(shiftMonth(selectedMonth, -1))}
          />

          <Box sx={{ mt: 4 }}>
            <SalesTrendChart
              data={trendData}
              title={`Sales Trend (Last 7 Months)`}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
