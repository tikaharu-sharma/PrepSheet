
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { RestaurantProvider } from "./context/RestaurantProvider";
import { AuthProvider } from "./context/AuthProvider";

import App from "./App";


const theme = createTheme()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RestaurantProvider>
            <App />
          </RestaurantProvider>
        </AuthProvider>
  </ThemeProvider>
);
