
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Avatar from "@mui/material/Avatar"


export default function Navbar() {

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
        
        <Avatar sx={{ ml: 2 }} />
      </Toolbar>
    </AppBar>
  );
}
