import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import ReceiptIcon from "@mui/icons-material/Receipt";
import StoreIcon from "@mui/icons-material/Store";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import { clearAuthSession } from '../lib/auth'

import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthTypes";

import PrepSheetLogo from "../assets/PrepSheet.svg";


const drawerWidth = 260;
const activeColor = "#4ea674";

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  roles: Role [];
}
interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  collapsed: boolean;
  onCollapseToggle: () => void;
}

const collapsedDrawerWidth = 88;

export default function Sidebar({ mobileOpen, handleDrawerToggle, collapsed, onCollapseToggle }: SidebarProps){
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate()
  const location = useLocation()

  const { user } = useAuth();
  const currentUserRole = user?.role;



	const handleLogout = () => {
		clearAuthSession()
    navigate('/login', { replace: true })
	}

  const handleLogoClick = () => {
    navigate('/home')
  }



const menuItems: MenuItem[] = [
  { text: "Dashboard", icon: <HomeIcon />, path: "/home", roles: ["manager", "employee"] },
  { text: "Sales Entry", icon: <ReceiptIcon />, path: "/sales-entry", roles: ["manager", "employee"] },
  { text: "Users", icon: <PeopleIcon />, path: "/users", roles: ["manager"] },
  { text: "Reports", icon: <BarChartIcon />, path: "/reports", roles: ["manager", "employee"] },
  { text: "Restaurants", icon: <StoreIcon />, path: "/restaurants", roles: ["manager"] },
  { text: "Data Visualization", icon: <InsightsIcon />, path: "/visualization", roles: ["manager"] },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings", roles: ["manager"] }
];


const filteredMenuItems = menuItems.filter(item =>
  currentUserRole ? item.roles.includes(currentUserRole) : false
);

const getItemStyle = (path: string) => ({
    backgroundColor: location.pathname === path ? activeColor : "transparent",
    color: location.pathname === path ? "#ffffff" : "inherit",
    borderRadius: "8px",
    mb: 0.5,
    minHeight: 52,
    px: collapsed && !isMobile ? 1.5 : 2,
    justifyContent: collapsed && !isMobile ? "center" : "flex-start",
    "&:hover": {
      backgroundColor:
        location.pathname === path ? activeColor : "rgba(0,0,0,0.04)"
    }
  });

  const sidebarContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: collapsed && !isMobile ? 1.5 : 2,
      }}
    >
      <Box>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed && !isMobile ? "center" : "space-between",
            gap: 1,
          }}
        >
          <Box
            sx={{
              cursor: "pointer",
              display: "flex",
              justifyContent: collapsed && !isMobile ? "center" : "flex-start",
              alignItems: "center",
              flex: 1,
            }}
            onClick={handleLogoClick}
          >
            {collapsed && !isMobile ? (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "14px",
                  backgroundColor: activeColor,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  fontWeight: 800,
                  letterSpacing: 1,
                  boxShadow: "0 8px 18px rgba(78, 166, 116, 0.22)",
                }}
              >
                PS
              </Box>
            ) : (
              <img
                src={PrepSheetLogo}
                alt="PrepSheet Logo"
                style={{ width: 140, transition: "width 200ms ease" }}
              />
            )}
          </Box>

          {!isMobile ? (
            <IconButton onClick={onCollapseToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          ) : null}
        </Box>

        <List>
          {filteredMenuItems.map((item) => {
            const listItem = (
              <ListItemButton
                key={item.text}
                component={RouterLink}
                to={item.path}
                sx={getItemStyle(item.path)}
              >
                <ListItemIcon
                  sx={{
                    color: location.pathname === item.path ? "#ffffff" : "inherit",
                    minWidth: collapsed && !isMobile ? 0 : 40,
                    justifyContent: "center",
                    mr: collapsed && !isMobile ? 0 : 1,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {collapsed && !isMobile ? null : <ListItemText primary={item.text} />}
              </ListItemButton>
            );

            if (collapsed && !isMobile) {
              return (
                <Tooltip key={item.text} title={item.text} placement="right">
                  {listItem}
                </Tooltip>
              );
            }

            return listItem;
          })}
        </List>
      </Box>

      <Box
        sx={{
          mt: "auto",
          pt: 2,
          borderTop: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed && !isMobile ? "center" : "space-between",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <Avatar />

          {collapsed && !isMobile ? null : (
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap>{user?.name ?? ''}</Typography>
              <Typography variant="caption" noWrap>{user?.email ?? ''}</Typography>
            </Box>
          )}
        </Box>

        <Tooltip title="Logout" placement="right">
          <IconButton onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Box
      component="aside"
      sx={{
        width: collapsed ? collapsedDrawerWidth : drawerWidth,
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        borderRight: "1px solid #e0e0e0",
        backgroundColor: "#ffffff",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {sidebarContent}
    </Box>
  );
}
