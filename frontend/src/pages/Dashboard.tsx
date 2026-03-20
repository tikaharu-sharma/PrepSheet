import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DashboardSummaryCards from "../components/dashboard/DashboardSummaryCards";
import SalesTrendChart from "../components/dashboard/SalesTrendChart";
import { useRestaurant } from "../context/useRestaurant";

export default function Dashboard() {
  const {selectedRestaurant } = useRestaurant()
  return (
    <Box sx={{ py:4 }}>
        <Typography variant="h4" component = "h1" sx={{ mb: 3, fontWeight: 600 }}>
        Welcome to {selectedRestaurant?.name || "PrepSheet Dashboard"}
        </Typography>

       <DashboardSummaryCards />

        <Box sx={{ mt: 4 }}>
            <SalesTrendChart restaurantId = {selectedRestaurant?.id} />
        </Box>
    </Box>
  );
}