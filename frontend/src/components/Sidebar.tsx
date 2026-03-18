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
  useMediaQuery
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

import PrepSheetLogo from "../assets/PrepSheet.svg";


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

	const handleLogout = () => {
		logoutMock()
		navigate('/login')
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