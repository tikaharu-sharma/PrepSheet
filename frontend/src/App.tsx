import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import SalesEntry from "./pages/SalesEntry";
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
        </Route>

      </Routes>
    </BrowserRouter>
  );
}
