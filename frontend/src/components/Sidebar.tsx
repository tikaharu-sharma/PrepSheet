import {
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  IconButton
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

import { useNavigate } from 'react-router-dom'
import { logoutMock } from '../lib/auth'

import PrepSheetLogo from "../assets/PrepSheet.svg";


import { useState } from "react";

const drawerWidth = 260;
const activeColor = "#4ea674";

export default function Sidebar(){
    const[activePage, setActivePage] = useState("Dashboard")

    const navigate = useNavigate()

	const handleLogout = () => {
		logoutMock()
		navigate('/login')
	}



const menuItems = [
    { text: "Dashboard", icon: <HomeIcon /> },
    { text: "Sales Entry", icon: <ReceiptIcon /> },
    { text: "Users", icon: <PeopleIcon /> },
    { text: "Reports", icon: <BarChartIcon /> },
    { text: "Restaurants", icon: <StoreIcon /> },
    { text: "Register", icon: <PersonAddIcon /> },
    { text: "Data Visualization", icon: <InsightsIcon /> }
]

const adminItems = [
    {text: "Admin Role", icon:<AdminPanelSettingsIcon/>},
    {text:"Settings", icon:<SettingsIcon/>}
]

const getItemStyle = (item: string) => ({
    backgroundColor: activePage === item ? activeColor : "transparent",
    color: activePage === item ? "#ffffff" : "inherit",
    borderRadius: "8px",
    mb: 0.5,
    "&:hover": {
      backgroundColor:
        activePage === item ? activeColor : "rgba(0,0,0,0.04)"
    }
  });

  return(
    <Drawer
    variant="permanent"
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
        <Box sx={{ mb: 3 }}>
          <img src={PrepSheetLogo} alt="PrepSheet Logo" style={{ width: 140}} />
        </Box>

        {/* RESTAURANT SELECTOR */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2
          }}
        >
          <Typography>Restaurant A</Typography>
          <KeyboardArrowDownIcon />
        </Box>

        {/* MAIN MENU */}
        <List>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => setActivePage(item.text)}
              sx={getItemStyle(item.text)}
            >
              <ListItemIcon
                sx={{
                  color: activePage === item.text ? "#ffffff" : "inherit"
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
              onClick={() => setActivePage(item.text)}
              sx={getItemStyle(item.text)}
            >
              <ListItemIcon
                sx={{
                  color: activePage === item.text ? "#ffffff" : "inherit"
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