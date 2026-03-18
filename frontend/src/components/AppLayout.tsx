import {Box, Toolbar, useTheme, useMediaQuery} from "@mui/material";
import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps{
   children: React.ReactNode
}

export default function AppLayout({children}: LayoutProps){
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <>
            <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
            <Navbar handleDrawerToggle={handleDrawerToggle} />

            {/*main page content*/}

            <Box 
              sx = {{
                ml: isMobile ? 0 : "260px",
                p: 3,
                minHeight:"100vh",
                backgroundColor: "background.default"
              }}
            >
                <Toolbar />
                {children}
                
            </Box>
        </>
    )
}