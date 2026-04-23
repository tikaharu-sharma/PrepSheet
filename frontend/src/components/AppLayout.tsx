import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps{
   children: React.ReactNode
}

const drawerWidth = 260;
const collapsedDrawerWidth = 88;

export default function AppLayout({children}: LayoutProps){
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [desktopCollapsed, setDesktopCollapsed] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleDesktopSidebarToggle = () => {
        setDesktopCollapsed((previous) => !previous);
    };

    const sidebarWidth = isMobile ? 0 : desktopCollapsed ? collapsedDrawerWidth : drawerWidth;

    return (
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            backgroundColor: "background.default",
          }}
        >
            <Sidebar
              mobileOpen={mobileOpen}
              handleDrawerToggle={handleDrawerToggle}
              collapsed={desktopCollapsed}
              onCollapseToggle={handleDesktopSidebarToggle}
            />

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                width: { md: `calc(100% - ${sidebarWidth}px)` },
              }}
            >
                <Navbar
                  handleDrawerToggle={handleDrawerToggle}
                  collapsed={desktopCollapsed}
                  onDesktopSidebarToggle={handleDesktopSidebarToggle}
                />

                <Box
                  component="main"
                  sx={{
                    p: { xs: 2, sm: 3 },
                    minHeight: "100%",
                  }}
                >
                  {children}
                </Box>
            </Box>
        </Box>
    )
}
