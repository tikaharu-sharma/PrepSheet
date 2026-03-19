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
  MenuItem,
} from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import ReceiptIcon from "@mui/icons-material/Receipt";
import StoreIcon from "@mui/icons-material/Store";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import InsightsIcon from "@mui/icons-material/Insights";
import SettingsIcon from "@mui/icons-material/Settings";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { useNavigate, useLocation } from 'react-router-dom'
import { logoutMock } from '../lib/auth'
import { useState} from "react";
import { useRestaurant } from "../context/useRestaurant";

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
}

export default function Sidebar({ mobileOpen, handleDrawerToggle }: SidebarProps){
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigate = useNavigate()
  const location = useLocation()

  const { user } = useAuth();
  const currentUserRole = user.role;

  const [openDropdown, setOpenDropdown] = useState(false)
  const { restaurants, selectedRestaurant, setSelectedRestaurant } = useRestaurant()

	const handleLogout = () => {
		logoutMock()
		navigate('/login')
	}

  const handleLogoClick = () => {
    navigate('/home')
  }



const menuItems: MenuItem[] = [
  { text: "Dashboard", icon: <HomeIcon />, path: "/home", roles: ["manager", "employee"] },
  { text: "Sales Entry", icon: <ReceiptIcon />, path: "/sales-entry", roles: ["manager", "employee"] },
  { text: "Users", icon: <PeopleIcon />, path: "/users", roles: ["manager"] },
  { text: "Reports", icon: <BarChartIcon />, path: "/reports", roles: ["manager"] },
  { text: "Restaurants", icon: <StoreIcon />, path: "/restaurants", roles: ["manager"] },
  { text: "Register", icon: <PersonAddIcon />, path: "/register", roles: ["manager"] },
  { text: "Data Visualization", icon: <InsightsIcon />, path: "/visualization", roles: ["manager"] }
];

const adminItems: MenuItem[] = [
  { text: "Admin Role", icon: <AdminPanelSettingsIcon />, path: "/admin-role", roles: ["manager"] },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings", roles: ["manager"] }
];


const filteredMenuItems = menuItems.filter(item =>
  item.roles.includes(currentUserRole)
);

const filteredAdminItems = adminItems.filter(item =>
  item.roles.includes(currentUserRole)
);

const getItemStyle = (path: string) => ({
    backgroundColor: location.pathname === path ? activeColor : "transparent",
    color: location.pathname === path ? "#ffffff" : "inherit",
    borderRadius: "8px",
    mb: 0.5,
    "&:hover": {
      backgroundColor:
        location.pathname === path ? activeColor : "rgba(0,0,0,0.04)"
    }
  });

  return(
    <Drawer
    variant={isMobile ? "temporary" : "permanent"}
    open={isMobile ? mobileOpen : true}
    onClose={handleDrawerToggle}
    ModalProps={{
      keepMounted: true, // Better open performance on mobile.
    }}
    sx = {{
        width: drawerWidth,
        flexShrink:0,
        "& .MuiDrawer-paper":{
            width: drawerWidth,
            boxSizing: "border-box",
            display:"flex",
            flexDirection: "column"
        }
    }}
    >
      <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: 2
      }}
    >
      {/* TOP SECTION*/}
      <Box>
        {/* LOGO */}
        <Box sx={{ mb: 3, cursor: 'pointer' }} onClick={handleLogoClick}>
          <img src={PrepSheetLogo} alt="PrepSheet Logo" style={{ width: 140}} />
        </Box>

        {/* RESTAURANT SELECTOR */}
        <Box sx={{ position: "relative", mb:2 }}>
            <Box
              onClick={() => setOpenDropdown(!openDropdown)}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                p: 1,
                borderRadius: "8px",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" }
              }}
            >
              <Typography>
                {selectedRestaurant ? selectedRestaurant.name : "All Restaurants"}
              </Typography>
              <KeyboardArrowDownIcon />
            </Box>

            {openDropdown && (
              <Box
                sx={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  boxShadow: 3,
                  borderRadius: "8px",
                  zIndex: 10,
                  maxHeight: 200,
                  overflowY: "auto"
                }}
              >
                {/* ALL OPTION */}
                <Box
                  onClick={() => {
                    setSelectedRestaurant(null);
                    setOpenDropdown(false);
                  }}
                  sx={{
                    p: 1,
                    fontWeight: 500,
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" }
                  }}
                >
                  All Restaurants
                </Box>

                {restaurants.map((r) => (
                  <Box
                    key={r.id}
                    onClick={() => {
                      setSelectedRestaurant(r);
                      setOpenDropdown(false);
                    }}
                    sx={{
                      p: 1,
                      cursor: "pointer",
                      backgroundColor:
                        selectedRestaurant?.id === r.id
                          ? "rgba(78,166,116,0.15)"
                          : "transparent",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" }
                    }}
                  >
                    {r.name}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

        {/* MAIN MENU */}
        <List>
          {filteredMenuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={getItemStyle(item.path)}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? "#ffffff" : "inherit"
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>

        {/* ADMIN LABEL */}

        {filteredAdminItems.length > 0 && (
            <>
              <Typography variant="caption" sx={{ mt: 2, mb: 1 }}>
                ADMIN
              </Typography>

              <List>
                {filteredAdminItems.map((item) => (
                  <ListItemButton
                    key={item.text}
                    onClick={() => navigate(item.path)}
                    sx={getItemStyle(item.path)}
                  >
                    <ListItemIcon
                      sx={{
                        color: location.pathname === item.path ? "#ffffff" : "inherit"
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                ))}
              </List>
            </>
          )}
        </Box>

      {/* BOTTOM PROFILE */}
      <Box
        sx={{
          mt: "auto",
          pt: 2,
          borderTop: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          gap: 1
        }}
      >
        <Avatar />

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2">{user.name}</Typography>
          <Typography variant="caption">{user.email}</Typography>
        </Box>

        <IconButton onClick = {handleLogout}>
          <LogoutIcon />
        </IconButton>
      </Box>
    </Box>
  </Drawer>
)}