import {Box, Toolbar} from "@mui/material";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps{
   children: React.ReactNode
}
export default function AppLayout({children}: LayoutProps){
    return (
        <>
            <Sidebar />
            <Navbar />

            {/*main page content*/}

            <Box 
              sx = {{
                ml: "260px",
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