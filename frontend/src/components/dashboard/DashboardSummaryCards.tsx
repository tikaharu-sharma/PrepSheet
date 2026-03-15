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
  trend: "up" | "down";
  trendPercent: string;
  previousInfo: string;
  detailsLink: string;
  icon: ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  value,
  trend,
  trendPercent,
  previousInfo,
  detailsLink,
  icon,
}) => {
  const trendColor = trend === "up" ? "#27ae60" : "#e74c3c";
  const titleColor = "#23272e";
  const mainValueColor = "#023337";
  const subtitleColor = "#6a717f";
  const detailsColor = "#6467f2";

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 3,
        minHeight: 180,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        p: 2,
      }}
    >
      {/* Title + Subtitle + Icon */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h6" sx={{ color: titleColor, fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: subtitleColor }}>
            {subtitle}
          </Typography>
        </Box>
        <Box sx={{ fontSize: 32, color: "#4ea674" }}>{icon}</Box>
      </Box>

      {/* Main Value + Trend */}
      <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: mainValueColor }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: subtitleColor }}>
          Sales
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", color: trendColor, ml: 1 }}>
          {trend === "up" ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
          <Typography variant="body2" sx={{ ml: 0.3 }}>
            {trendPercent}
          </Typography>
        </Box>
      </Box>

      {/* Previous Info */}
      <Typography variant="caption" sx={{ color: subtitleColor, mt: 0.5 }}>
        {previousInfo}
      </Typography>

      {/* Details Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          size="small"
          variant="outlined"
          sx={{
            borderColor: detailsColor,
            color: detailsColor,
            borderRadius: "20px",
            textTransform: "none",
            fontWeight: 500,
          }}
          href={detailsLink}
        >
          Details
        </Button>
      </Box>
    </Card>
  );
};

// Dashboard grid
export default function DashboardSummaryCards() {
  const cards: DashboardCardProps[] = [
    {
      title: "Total Sales",
      subtitle: "Last 7 days",
      value: "$3,500",
      trend: "up",
      trendPercent: "+12%",
      previousInfo: "Previous 7 days ($3,200)",
      detailsLink: "/reports",
      icon: <AttachMoneyIcon />,
    },
    {
      title: "Lunch Sales",
      subtitle: "Last 7 days",
      value: "$2,100",
      trend: "down",
      trendPercent: "-5%",
      previousInfo: "Previous 7 days ($2,200)",
      detailsLink: "/reports",
      icon: <LunchDiningIcon />,
    },
    {
      title: "Dinner Sales",
      subtitle: "Last 7 days",
      value: "$1,400",
      trend: "up",
      trendPercent: "+8%",
      previousInfo: "Previous 7 days ($1,300)",
      detailsLink: "/reports",
      icon: <DinnerDiningIcon />,
    },
  ];

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid xs={12} sm={6} md={4} key={card.title}>
          <DashboardCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
}
