import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchSales, type SaleRecord } from "../lib/api";
import { useRestaurant } from "../context/useRestaurant";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const CHART_COLORS = ["#4ea674", "#2f7f5f", "#ffb347", "#d95f59", "#5c6bc0", "#8d6e63"];

interface RestaurantMetric {
  restaurantId: number;
  restaurantName: string;
  totalSales: number;
  totalGuests: number;
  averageGuestsPerDay: number;
  totalExpenditures: number;
  salesEntries: number;
}

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);

const getAvailablePeriods = (sales: SaleRecord[]) =>
  Array.from(new Set(sales.map((sale) => sale.date.slice(0, 7)))).sort((left, right) =>
    right.localeCompare(left)
  );

const getDefaultPeriod = (periods: string[]) => {
  const currentMonth = getCurrentMonth();
  if (periods.includes(currentMonth)) {
    return currentMonth;
  }

  return periods[0] ?? "";
};

const formatMonthLabel = (month: string) => {
  const [year, monthValue] = month.split("-").map(Number);
  return `${MONTH_LABELS[monthValue - 1] ?? monthValue} ${year}`;
};

const getSaleExpenditures = (sale: SaleRecord) =>
  sale.expenditures.reduce((sum, item) => sum + item.amount, 0);

const buildRestaurantMetrics = (
  sales: SaleRecord[],
  restaurantMap: Map<number, string>
): RestaurantMetric[] => {
  const grouped = new Map<number, RestaurantMetric>();

  for (const sale of sales) {
    const totalSales = sale.lunch_sale + sale.dinner_sale;
    const totalGuests = sale.lunch_head_count + sale.dinner_head_count;
    const restaurantName =
      sale.restaurant_name || restaurantMap.get(sale.restaurant_id) || `Restaurant ${sale.restaurant_id}`;

    const current = grouped.get(sale.restaurant_id) ?? {
      restaurantId: sale.restaurant_id,
      restaurantName,
      totalSales: 0,
      totalGuests: 0,
      averageGuestsPerDay: 0,
      totalExpenditures: 0,
      salesEntries: 0,
    };

    current.totalSales += totalSales;
    current.totalGuests += totalGuests;
    current.totalExpenditures += getSaleExpenditures(sale);
    current.salesEntries += 1;

    grouped.set(sale.restaurant_id, current);
  }

  return Array.from(grouped.values())
    .map((metric) => ({
      ...metric,
      averageGuestsPerDay: metric.salesEntries > 0 ? metric.totalGuests / metric.salesEntries : 0,
    }))
    .sort((left, right) => right.totalSales - left.totalSales);
};

const chartCardSx = { p: 3, borderRadius: 3, height: "100%" };

export default function DataVisualization() {
  const { restaurants } = useRestaurant();
  const [allSales, setAllSales] = useState<SaleRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonthNumber, setSelectedMonthNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSales = async () => {
      try {
        setLoading(true);
        setError(null);
        const sales = await fetchSales();

        if (!isMounted) {
          return;
        }

        setAllSales(sales);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (err instanceof Error && err.message) {
          setError(err.message);
        } else if (typeof err === "object" && err !== null && "message" in err) {
          setError((err as { message?: string }).message || "Failed to load visualization data");
        } else {
          setError("Failed to load visualization data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSales();

    return () => {
      isMounted = false;
    };
  }, []);

  const restaurantMap = useMemo(
    () => new Map(restaurants.map((restaurant) => [restaurant.id, restaurant.name])),
    [restaurants]
  );
  const availablePeriods = useMemo(() => getAvailablePeriods(allSales), [allSales]);
  const availableYears = useMemo(
    () =>
      Array.from(new Set(availablePeriods.map((period) => period.slice(0, 4)))).sort((left, right) =>
        right.localeCompare(left)
      ),
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
  const selectedMonth = selectedYear && selectedMonthNumber ? `${selectedYear}-${selectedMonthNumber}` : "";

  useEffect(() => {
    const currentPeriod = selectedYear && selectedMonthNumber ? `${selectedYear}-${selectedMonthNumber}` : "";

    if (availablePeriods.length === 0) {
      if (selectedYear !== "") setSelectedYear("");
      if (selectedMonthNumber !== "") setSelectedMonthNumber("");
      return;
    }

    const nextPeriod = availablePeriods.includes(currentPeriod)
      ? currentPeriod
      : getDefaultPeriod(availablePeriods);
    const [nextYear, nextMonthNumber] = nextPeriod.split("-");

    if (nextYear !== selectedYear) {
      setSelectedYear(nextYear);
    }

    if (nextMonthNumber !== selectedMonthNumber) {
      setSelectedMonthNumber(nextMonthNumber);
    }
  }, [availablePeriods, selectedMonthNumber, selectedYear]);

  const salesForMonth = useMemo(
    () => (selectedMonth ? allSales.filter((sale) => sale.date.startsWith(`${selectedMonth}-`)) : []),
    [allSales, selectedMonth]
  );

  const restaurantMetrics = useMemo(
    () => buildRestaurantMetrics(salesForMonth, restaurantMap),
    [restaurantMap, salesForMonth]
  );

  const overview = useMemo(() => {
    const totals = restaurantMetrics.reduce(
      (acc, metric) => {
        acc.totalSales += metric.totalSales;
        acc.totalGuests += metric.totalGuests;
        acc.totalExpenditures += metric.totalExpenditures;
        acc.totalEntries += metric.salesEntries;
        return acc;
      },
      { totalSales: 0, totalGuests: 0, totalExpenditures: 0, totalEntries: 0 }
    );

    return {
      ...totals,
      averageGuestsPerDay: totals.totalEntries > 0 ? totals.totalGuests / totals.totalEntries : 0,
    };
  }, [restaurantMetrics]);

  const salesAndPeopleChartData = restaurantMetrics.map((metric) => ({
    name: metric.restaurantName,
    totalSales: metric.totalSales,
    averageGuestsPerDay: Number(metric.averageGuestsPerDay.toFixed(1)),
  }));

  const expendituresChartData = restaurantMetrics.map((metric) => ({
    name: metric.restaurantName,
    totalExpenditures: metric.totalExpenditures,
  }));

  if (loading) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", lg: "center" },
            gap: 2,
            flexDirection: { xs: "column", lg: "row" },
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Restaurant Comparison
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Compare all restaurants in one view using total sales, average people per day, and expenditures.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ width: { xs: "100%", lg: "auto" } }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="visualization-year-select-label">Year</InputLabel>
              <Select
                labelId="visualization-year-select-label"
                value={availableYears.includes(selectedYear) ? selectedYear : ""}
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

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="visualization-month-select-label">Month</InputLabel>
              <Select
                labelId="visualization-month-select-label"
                value={
                  monthOptions.some((option) => option.value === selectedMonthNumber)
                    ? selectedMonthNumber
                    : ""
                }
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
          </Stack>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {restaurantMetrics.length === 0 ? (
          <Alert severity="info">
            No sales data is available for the selected month. Try another period after entering restaurant sales.
          </Alert>
        ) : (
          <>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                label={selectedMonth ? formatMonthLabel(selectedMonth) : "No month selected"}
                color="primary"
                variant="outlined"
              />
              <Chip label={`${restaurantMetrics.length} restaurants compared`} variant="outlined" />
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              <Card sx={chartCardSx}>
                <Typography variant="body2" color="text.secondary">
                  Total Sales
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {formatCurrency(overview.totalSales)}
                </Typography>
              </Card>

              <Card sx={chartCardSx}>
                <Typography variant="body2" color="text.secondary">
                  Total Persons
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {overview.totalGuests.toLocaleString("en-US")}
                </Typography>
              </Card>

              <Card sx={chartCardSx}>
                <Typography variant="body2" color="text.secondary">
                  Avg People Per Day
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {overview.averageGuestsPerDay.toFixed(1)}
                </Typography>
              </Card>

              <Card sx={chartCardSx}>
                <Typography variant="body2" color="text.secondary">
                  Total Expenditures
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {formatCurrency(overview.totalExpenditures)}
                </Typography>
              </Card>
            </Box>

            <Card sx={chartCardSx}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Sales and People by Restaurant
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                One chart for all restaurants. Compare total sales against the average number of people per day.
              </Typography>
              <Box sx={{ width: "100%", height: 360 }}>
                <ResponsiveContainer>
                  <BarChart data={salesAndPeopleChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => `${Math.round(Number(value))}`}
                      label={{ value: "People / Day", angle: -90, position: "insideLeft" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                      label={{ value: "Sales", angle: 90, position: "insideRight" }}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "Total Sales"
                          ? formatCurrency(Number(value ?? 0))
                          : `${Number(value ?? 0).toLocaleString("en-US")} people`
                      }
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="averageGuestsPerDay"
                      name="Avg People / Day"
                      fill="#ffb347"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar yAxisId="right" dataKey="totalSales" name="Total Sales" radius={[8, 8, 0, 0]}>
                      {restaurantMetrics.map((metric, index) => (
                        <Cell key={metric.restaurantId} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            <Card sx={chartCardSx}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Expenditures by Restaurant
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                One bar chart for all restaurants so expenditure differences are easier to compare.
              </Typography>
              <Box sx={{ width: "100%", height: 360 }}>
                <ResponsiveContainer>
                  <BarChart data={expendituresChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Bar dataKey="totalExpenditures" name="Expenditures" radius={[8, 8, 0, 0]}>
                      {restaurantMetrics.map((metric, index) => (
                        <Cell key={metric.restaurantId} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            <Card sx={chartCardSx}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Restaurant Comparison Table
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Summary table for the selected month across all restaurants.
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Restaurant</TableCell>
                      <TableCell align="right">Total Sales</TableCell>
                      <TableCell align="right">Total Persons</TableCell>
                      <TableCell align="right">Avg People / Day</TableCell>
                      <TableCell align="right">Expenditures</TableCell>
                      <TableCell align="right">Entries</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {restaurantMetrics.map((metric) => (
                      <TableRow key={metric.restaurantId} hover>
                        <TableCell>{metric.restaurantName}</TableCell>
                        <TableCell align="right">{formatCurrency(metric.totalSales)}</TableCell>
                        <TableCell align="right">{metric.totalGuests.toLocaleString("en-US")}</TableCell>
                        <TableCell align="right">{metric.averageGuestsPerDay.toFixed(1)}</TableCell>
                        <TableCell align="right">{formatCurrency(metric.totalExpenditures)}</TableCell>
                        <TableCell align="right">{metric.salesEntries}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        )}
      </Stack>
    </Box>
  );
}
