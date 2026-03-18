import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DashboardSummaryCards from "../components/dashboard/DashboardSummaryCards";
import SalesTrendChart from "../components/dashboard/SalesTrendChart";

export default function Dashboard() {
  return (
    <Box sx={{ py:4 }}>
        <Typography variant="h4" component = "h1" sx={{ mb: 3, fontWeight: 600 }}>
        Welcome to PrepSheet Dashboard
        </Typography>

       <DashboardSummaryCards />

        <Box sx={{ mt: 4 }}>
            <SalesTrendChart />
        </Box>
    </Box>
  );
}