import type { ReactNode } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LunchDiningIcon from "@mui/icons-material/LunchDining";
import DinnerDiningIcon from "@mui/icons-material/DinnerDining";

interface DashboardCardProps {
  title: string;
  subtitle: string;
  value: string;
  trend: "up" | "down"; // Only "up" or "down" allowed
  trendPercent: string;
  previousText: string;
  previousValue: string;
  detailsLink: string;
  icon: ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  value,
  trend,
  trendPercent,
  previousText,
  previousValue,
  detailsLink,
  icon,
}) => {
  const trendColor = trend === "up" ? "#27ae60" : "#e74c3c";

  return (
    <Card elevation={3} sx={{ borderRadius: 3, minHeight: 180, p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ color: "#23272e", fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "#6a717f" }}>
            {subtitle}
          </Typography>
        </Box>
        <Box sx={{ fontSize: 32, color: "#4ea674" }}>{icon}</Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#023337" }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: "#6a717f" }}>
          Sales
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", color: trendColor, ml: 1 }}>
          {trend === "up" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
          <Typography variant="body2" sx={{ ml: 0.3 }}>
            {trendPercent}
          </Typography>
        </Box>
      </Box>

      <Typography variant="caption" sx={{ mt: 0.5 }}>
        <span style={{ color: "#6a717f" }}>{previousText}</span>{" "}
        <span style={{ color: "#6467f2" }}>({previousValue})</span>
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          size="small"
          variant="outlined"
          sx={{ borderColor: "#6467f2", color: "#6467f2", borderRadius: "20px", textTransform: "none" }}
          href={detailsLink}
        >
          Details
        </Button>
      </Box>
    </Card>
  );
};

// ---- Dashboard grid ----

export default function DashboardSummaryCards() {
  const cardsData: DashboardCardProps[] = [
    {
      title: "Total Sales",
      subtitle: "Last 7 days",
      value: "$3,500",
      trend: "up",
      trendPercent: "+12%",
      previousText: "Previous 7 days",
      previousValue: "$3,200",
      detailsLink: "/reports",
      icon: <AttachMoneyIcon />,
    },
    {
      title: "Lunch Sales",
      subtitle: "Last 7 days",
      value: "$2,100",
      trend: "down",
      trendPercent: "-5%",
      previousText: "Previous 7 days",
      previousValue: "$2,200",
      detailsLink: "/reports",
      icon: <LunchDiningIcon />,
    },
    {
      title: "Dinner Sales",
      subtitle: "Last 7 days",
      value: "$1,400",
      trend: "up",
      trendPercent: "+8%",
      previousText: "Previous 7 days",
      previousValue: "$1,300",
      detailsLink: "/reports",
      icon: <DinnerDiningIcon />,
    },
  ];

  return (
    <Grid container spacing={3}>
      {cardsData.map((card) => (
        <Grid key={card.title} size = {{ xs:12, sm:6, md:4}}>
          <DashboardCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
}