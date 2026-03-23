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

const getDateRange = (days: number, offsetDays = 0) => {
  const end = new Date();
  end.setDate(end.getDate() - offsetDays);
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
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
  const [recentSales, setRecentSales] = useState<SaleRecord[]>([]);

  const effectiveSelectedRestaurant =
    selectedRestaurant || (restaurants.length > 0 ? restaurants[0] : null);

  useEffect(() => {
    if (!selectedRestaurant && restaurants.length > 0) {
      setSelectedRestaurant(restaurants[0]);
    }
  }, [restaurants, selectedRestaurant]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!effectiveSelectedRestaurant) {
        setSummary(initialSummary);
        setRecentSales([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const currentRange = getDateRange(7);
        const previousRange = getDateRange(7, 7);

        const [currentSales, previousSales] = await Promise.all([
          fetchSales({
            restaurantId: effectiveSelectedRestaurant.id,
            startDate: currentRange.startDate,
            endDate: currentRange.endDate,
          }),
          fetchSales({
            restaurantId: effectiveSelectedRestaurant.id,
            startDate: previousRange.startDate,
            endDate: previousRange.endDate,
          }),
        ]);

        if (!isMounted) return;

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
        setRecentSales(currentSales);
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

  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    recentSales.forEach((sale) => {
      map.set(sale.date, (map.get(sale.date) ?? 0) + sale.lunch_sale + sale.dinner_sale);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, sales]) => ({ day: day.slice(5), sales }));
  }, [recentSales]);

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

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <DashboardSummaryCards summary={summary} />

          <Box sx={{ mt: 4 }}>
            <SalesTrendChart data={trendData} />
          </Box>
        </>
      )}
    </Box>
  );
}
