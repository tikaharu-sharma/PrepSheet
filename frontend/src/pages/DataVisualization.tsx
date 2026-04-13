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
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Legend,
  Line,
  LineChart,
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
  lunchSales: number;
  dinnerSales: number;
  totalGuests: number;
  lunchGuests: number;
  dinnerGuests: number;
  avgSpendPerGuest: number;
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

const getShortMonthLabel = (month: string) => {
  const [year, monthValue] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthValue - 1, 1)));
};

const shiftMonth = (month: string, offset: number) => {
  const [year, monthValue] = month.split("-").map(Number);
  const date = new Date(year, monthValue - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

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
      lunchSales: 0,
      dinnerSales: 0,
      totalGuests: 0,
      lunchGuests: 0,
      dinnerGuests: 0,
      avgSpendPerGuest: 0,
      salesEntries: 0,
    };

    current.totalSales += totalSales;
    current.lunchSales += sale.lunch_sale;
    current.dinnerSales += sale.dinner_sale;
    current.totalGuests += totalGuests;
    current.lunchGuests += sale.lunch_head_count;
    current.dinnerGuests += sale.dinner_head_count;
    current.salesEntries += 1;

    grouped.set(sale.restaurant_id, current);
  }

  return Array.from(grouped.values())
    .map((metric) => ({
      ...metric,
      avgSpendPerGuest: metric.totalGuests > 0 ? metric.totalSales / metric.totalGuests : 0,
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
        return acc;
      },
      { totalSales: 0, totalGuests: 0 }
    );

    return {
      ...totals,
      averageSpendPerGuest: totals.totalGuests > 0 ? totals.totalSales / totals.totalGuests : 0,
    };
  }, [restaurantMetrics]);

  const monthlyTrendData = useMemo(() => {
    if (!selectedMonth) {
      return [];
    }

    const months = Array.from({ length: 6 }, (_, index) => shiftMonth(selectedMonth, -(5 - index)));
    return months.map((month) => {
      const monthSales = allSales.filter((sale) => sale.date.startsWith(`${month}-`));
      const totals = buildRestaurantMetrics(monthSales, restaurantMap).reduce(
        (acc, metric) => {
          acc.totalSales += metric.totalSales;
          acc.totalGuests += metric.totalGuests;
          return acc;
        },
        { totalSales: 0, totalGuests: 0 }
      );

      return {
        month: getShortMonthLabel(month),
        sales: totals.totalSales,
        guests: totals.totalGuests,
      };
    });
  }, [allSales, restaurantMap, selectedMonth]);

  const performanceScatterData = restaurantMetrics.map((metric) => ({
    x: metric.totalGuests,
    y: Number(metric.totalSales.toFixed(2)),
    z: Math.max(metric.totalSales, 1),
    name: metric.restaurantName,
    totalSales: metric.totalSales,
    avgSpendPerGuest: metric.avgSpendPerGuest,
  }));
  const comparisonChartData = restaurantMetrics.map((metric) => ({
    name: metric.restaurantName,
    totalSales: metric.totalSales,
    totalGuests: metric.totalGuests,
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
              Compare traffic and total sales across all restaurants for a selected month.
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
              <Chip label="All restaurants" variant="outlined" />
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
                  Avg Sale Per Person
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {formatCurrency(overview.averageSpendPerGuest)}
                </Typography>
              </Card>

              <Card sx={chartCardSx}>
                <Typography variant="body2" color="text.secondary">
                  Restaurants Included
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {restaurantMetrics.length}
                </Typography>
              </Card>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "1.2fr 1fr" },
                gap: 2,
              }}
            >
              <Card sx={chartCardSx}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Total Sales by Restaurant
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Monthly sales comparison across the selected restaurants.
                </Typography>
                <Box sx={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={restaurantMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="restaurantName" />
                      <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                      <Bar dataKey="totalSales" radius={[8, 8, 0, 0]}>
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
                  Persons vs Sales
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  See which restaurants convert higher traffic into higher sales.
                </Typography>
                <Box sx={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" tickFormatter={(value) => `${Math.round(Number(value))}`} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                      />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "Total Sales"
                            ? formatCurrency(Number(value ?? 0))
                            : Number(value ?? 0).toLocaleString("en-US")
                        }
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalGuests" name="Persons" fill="#ffb347" radius={[8, 8, 0, 0]} />
                      <Bar yAxisId="right" dataKey="totalSales" name="Total Sales" fill="#4ea674" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Card sx={chartCardSx}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Persons vs Total Sales Scatter
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Each point is a restaurant. Higher and farther right means more people and more sales.
                </Typography>
                <Box sx={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Persons"
                        tickFormatter={(value) => Number(value).toLocaleString("en-US")}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Total sales"
                        tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                      />
                      <ZAxis type="number" dataKey="z" range={[120, 500]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        formatter={(value, name) => {
                          if (name === "Total sales") {
                            return formatCurrency(Number(value ?? 0));
                          }
                          return Number(value ?? 0).toLocaleString("en-US");
                        }}
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0) {
                            return null;
                          }

                          const point = payload[0].payload as {
                            name: string;
                            x: number;
                            y: number;
                            totalSales: number;
                            avgSpendPerGuest: number;
                          };

                          return (
                            <Paper sx={{ p: 1.5 }}>
                              <Typography variant="subtitle2">{point.name}</Typography>
                              <Typography variant="body2">
                                Persons: {point.x.toLocaleString("en-US")}
                              </Typography>
                              <Typography variant="body2">
                                Total sales: {formatCurrency(point.totalSales)}
                              </Typography>
                              <Typography variant="body2">
                                Avg sale/person: {formatCurrency(point.avgSpendPerGuest)}
                              </Typography>
                            </Paper>
                          );
                        }}
                      />
                      <Scatter name="Restaurants" data={performanceScatterData} fill="#4ea674" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              </Card>

              <Card sx={chartCardSx}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Persons and Sales Trend
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Six-month trend for the selected restaurants, using total persons and total sales.
                </Typography>
                <Box sx={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" tickFormatter={(value) => `${Math.round(Number(value))}`} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
                      />
                      <Tooltip
                        formatter={(value, name) =>
                          name === "Total Sales"
                            ? formatCurrency(Number(value ?? 0))
                            : Number(value ?? 0).toLocaleString("en-US")
                        }
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="guests" name="Persons" stroke="#ffb347" strokeWidth={3} />
                      <Line yAxisId="right" type="monotone" dataKey="sales" name="Total Sales" stroke="#4ea674" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Box>

            <Card sx={chartCardSx}>
              <Typography variant="h6" sx={{ mb: 1 }}>Restaurant Comparison Table</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ranked view of restaurant traffic and total sales for the selected month.
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Restaurant</TableCell>
                      <TableCell align="right">Persons</TableCell>
                      <TableCell align="right">Total Sales</TableCell>
                      <TableCell align="right">Lunch Persons</TableCell>
                      <TableCell align="right">Dinner Persons</TableCell>
                      <TableCell align="right">Avg Sale / Person</TableCell>
                      <TableCell align="right">Entries</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {restaurantMetrics.map((metric) => (
                      <TableRow key={metric.restaurantId} hover>
                        <TableCell>{metric.restaurantName}</TableCell>
                        <TableCell align="right">
                          {metric.totalGuests.toLocaleString("en-US")}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(metric.totalSales)}
                        </TableCell>
                        <TableCell align="right">
                          {metric.lunchGuests.toLocaleString("en-US")}
                        </TableCell>
                        <TableCell align="right">
                          {metric.dinnerGuests.toLocaleString("en-US")}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(metric.avgSpendPerGuest)}
                        </TableCell>
                        <TableCell align="right">
                          {metric.salesEntries}
                        </TableCell>
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
