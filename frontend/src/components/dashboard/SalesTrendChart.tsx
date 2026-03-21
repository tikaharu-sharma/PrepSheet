import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useEffect } from "react";

interface Props {
  restaurantId?: number;
}

const data = [
  { day: "Mon", sales: 400 },
  { day: "Tue", sales: 700 },
  { day: "Wed", sales: 600 },
  { day: "Thu", sales: 900 },
  { day: "Fri", sales: 1200 },
  { day: "Sat", sales: 1500 },
  { day: "Sun", sales: 1100 }
];

export default function SalesTrendChart({ restaurantId} :Props) {
  useEffect(() => {
    if (!restaurantId) return;

    console.log("Fetching chart data for restaurant:", restaurantId);

    // later to be replaced with backend call:
    // fetch(`/api/sales?restaurantId=${restaurantId}`)
  }, [restaurantId]);
  return (
    <Card sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Sales Trend (Last 7 Days)
      </Typography>

      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="day" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="sales"
              stroke="#4ea674"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}