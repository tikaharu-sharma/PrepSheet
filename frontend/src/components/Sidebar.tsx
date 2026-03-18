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
  Select,
  MenuItem,
  FormControl
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

import { useNavigate, useLocation } from 'react-router-dom'
import { logoutMock } from '../lib/auth'
import { getRestaurants, type Restaurant } from '../pages/Restaurants'

import PrepSheetLogo from "../assets/PrepSheet.svg";


import { useState, useEffect } from "react";
const drawerWidth = 260;
const activeColor = "#4ea674";

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
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

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')

  useEffect(() => {
    const loadedRestaurants = getRestaurants()
    setRestaurants(loadedRestaurants) // eslint-disable-line react-hooks/set-state-in-effect
    // Set default to first restaurant if available
    if (loadedRestaurants.length > 0 && !selectedRestaurant) {
      setSelectedRestaurant(loadedRestaurants[0].id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

	const handleLogout = () => {
		logoutMock()
		navigate('/login')
	}

  const handleLogoClick = () => {
    navigate('/home')
  }



const menuItems: MenuItem[] = [
    { text: "Dashboard", icon: <HomeIcon />, path: "/home" },
    { text: "Sales Entry", icon: <ReceiptIcon />, path: "/sales-entry" },
    { text: "Users", icon: <PeopleIcon />, path: "/users" },
    { text: "Reports", icon: <BarChartIcon />, path: "#" },
    { text: "Restaurants", icon: <StoreIcon />, path: "/restaurants" },
    { text: "Register", icon: <PersonAddIcon />, path: "#" },
    { text: "Data Visualization", icon: <InsightsIcon />, path: "#" }
]

const adminItems: MenuItem[] = [
    {text: "Admin Role", icon:<AdminPanelSettingsIcon/>, path: "#"},
    {text:"Settings", icon:<SettingsIcon/>, path:"#"}
]

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
        <FormControl fullWidth sx={{ mb: 2 }}>
          <Select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            displayEmpty
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                py: 1,
                fontSize: '0.8rem',
                lineHeight: 1.2,
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                minHeight: 'auto',
              }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 300,
                  '& .MuiMenuItem-root': {
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                  }
                }
              }
            }}
          >
            {restaurants.map((restaurant) => (
              <MenuItem key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* MAIN MENU */}
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => {
                if (item.path !== "#") {
                  navigate(item.path)
                }
              }}
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
        <Typography variant="caption" sx={{ mt: 2, mb: 1 }}>
          ADMIN
        </Typography>

        <List>
          {adminItems.map((item) => (
            <ListItemButton
              key={item.text}
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
          <Typography variant="body2">Jane Doe</Typography>
          <Typography variant="caption">jane@email.com</Typography>
        </Box>

        <IconButton onClick = {handleLogout}>
          <LogoutIcon />
        </IconButton>
      </Box>
    </Box>
  </Drawer>
)}