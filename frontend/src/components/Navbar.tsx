
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Avatar from "@mui/material/Avatar"
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { useTheme, useMediaQuery } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthSession } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

interface NavbarProps {
  handleDrawerToggle: () => void;
  collapsed: boolean;
  onDesktopSidebarToggle: () => void;
}

export default function Navbar({ handleDrawerToggle, collapsed, onDesktopSidebarToggle }: NavbarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login', { replace: true });
    handleMenuClose();
  };

	return (
	 <AppBar position="static"
      color="inherit"
      elevation={1}
      sx={{
        width: "100%"
      }}
    >
      <Toolbar>
        {isMobile ? (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <IconButton
            color="inherit"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            edge="start"
            onClick={onDesktopSidebarToggle}
            sx={{ mr: 2 }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
        {/* pushes content to right */}
        <Box sx={{ flexGrow: 1 }} />
        
        <IconButton onClick={handleAvatarClick} sx={{ ml: 2 }}>
          <Avatar />
        </IconButton>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {user?.name ?? ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email ?? ''}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
