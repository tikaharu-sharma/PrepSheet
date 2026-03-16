
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Avatar from "@mui/material/Avatar"
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import { useTheme, useMediaQuery } from '@mui/material'

interface NavbarProps {
  handleDrawerToggle: () => void;
}

export default function Navbar({ handleDrawerToggle }: NavbarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	return (
	 <AppBar position="fixed"
      color="inherit"
      elevation={1}
      sx={{
        ml: isMobile ? 0 : "260px",
        width: isMobile ? "100%" : "calc(100% - 260px)"
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {/* pushes content to right */}
        <Box sx={{ flexGrow: 1 }} />
        
        <Avatar sx={{ ml: 2 }} />
      </Toolbar>
    </AppBar>
  );
}
