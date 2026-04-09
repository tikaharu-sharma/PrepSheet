import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

interface TrendPoint {
  day: string;
  sales: number;
}

interface Props {
  data: TrendPoint[];
  title: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);

export default function SalesTrendChart({ data, title }: Props) {
  return (
    <Card sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>

      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Line type="monotone" dataKey="sales" stroke="#4ea674" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}
