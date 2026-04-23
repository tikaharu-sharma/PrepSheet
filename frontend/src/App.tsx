import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import SalesEntry from "./pages/SalesEntry";
import Users from "./pages/Users";
import Restaurants from "./pages/Restaurants";
import Reports from "./pages/Reports";
import DataVisualization from "./pages/DataVisualization";
import Settings from "./pages/Settings";
import RequireAuth from "./features/RequireAuth";
import RequireRole from "./features/RequireRole";
import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected - Available to all authenticated users */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/sales-entry" element={<SalesEntry />} />
            <Route path="/reports" element={<Reports />} />

            {/* Manager-only routes */}
            <Route element={<RequireRole allowedRoles={["manager"]} />}>
              <Route path="/users" element={<Users />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/visualization" element={<DataVisualization />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
