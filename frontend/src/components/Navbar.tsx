
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from "@mui/material/IconButton"
import Box from '@mui/material/Box'
import Avatar from "@mui/material/Avatar"
import LightModeIcon from "@mui/icons-material/LightMode"
import DarkModeIcon from "@mui/icons-material/DarkMode"

import { useTheme } from "@mui/material/styles";
import { useContext } from "react";
import { ColorModeContext } from "../theme/ThemeContext";


export default function Navbar() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

	return (
	 <AppBar position="fixed"
      color="inherit"
      elevation={1}
      sx={{
        ml: "260px",
        width: "calc(100% - 260px)"
      }}
    >
      <Toolbar>
        {/* pushes content to right */}
        <Box sx={{ flexGrow: 1 }} />

       
        <IconButton
          onClick={colorMode.toggleColorMode}
          sx={{
            backgroundColor: "#eaf8e7",
            "&:hover": {
              backgroundColor: "#d5f1d0"
            }
          }}
          >
          {theme.palette.mode === "dark" ? (
            <LightModeIcon />
          ) : (
            <DarkModeIcon />
          )}
        </IconButton>

      
        <Avatar sx={{ ml: 2 }} />
      </Toolbar>
    </AppBar>
  );
}
