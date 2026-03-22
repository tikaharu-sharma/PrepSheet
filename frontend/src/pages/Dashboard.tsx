import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import DashboardSummaryCards from "../components/dashboard/DashboardSummaryCards";
import SalesTrendChart from "../components/dashboard/SalesTrendChart";
import { useRestaurant } from "../context/useRestaurant";
import type { Restaurant } from "../lib/types";

export default function Dashboard() {
  const { restaurants } = useRestaurant();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const effectiveSelectedRestaurant =
    selectedRestaurant || (restaurants.length > 0 ? restaurants[0] : null);

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
              value={effectiveSelectedRestaurant?.id ?? restaurants[0]?.id ?? ''}
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

      <DashboardSummaryCards />

      <Box sx={{ mt: 4 }}>
        <SalesTrendChart restaurantId={effectiveSelectedRestaurant?.id} />
      </Box>
    </Box>
  );
}