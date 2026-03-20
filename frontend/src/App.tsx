import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import SalesEntry from "./pages/SalesEntry";
import Users from "./pages/Users";
import Restaurants from "./pages/Restaurants";
import Reports from "./pages/Reports";
import Register from "./pages/Register";
import DataVisualization from "./pages/DataVisualization";
import AdminRole from "./pages/AdminRole";
import Settings from "./pages/Settings";
import RequireAuth from "./features/RequireAuth";
import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout><Home /></AppLayout>} path="/home" />
          <Route element={<AppLayout><SalesEntry /></AppLayout>} path="/sales-entry" />
          <Route element={<AppLayout><Users /></AppLayout>} path="/users" />
          <Route element={<AppLayout><Restaurants /></AppLayout>} path="/restaurants" />
          <Route element={<AppLayout><Reports /></AppLayout>} path="/reports" />
          <Route element={<AppLayout><Register /></AppLayout>} path="/register" />
          <Route element={<AppLayout><DataVisualization /></AppLayout>} path="/visualization" />
          <Route element={<AppLayout><AdminRole /></AppLayout>} path="/admin-role" />
          <Route element={<AppLayout><Settings /></AppLayout>} path="/settings" />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
