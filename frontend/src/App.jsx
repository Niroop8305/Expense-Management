import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx"; // kept for backwards nav
import Settings from "./pages/Settings.jsx";
import WorkflowBuilder from "./pages/WorkflowBuilder.jsx";
import FinanceDashboard from "./pages/FinanceDashboard.jsx"; // legacy
import DirectorDashboard from "./pages/DirectorDashboard.jsx"; // legacy
import ApproverDashboard from "./pages/ApproverDashboard.jsx";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route path="/manager/dashboard" element={<ApproverDashboard />} />
          <Route path="/finance/dashboard" element={<ApproverDashboard />} />
          <Route path="/director/dashboard" element={<ApproverDashboard />} />
          <Route path="/cfo/dashboard" element={<ApproverDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin/workflows" element={<WorkflowBuilder />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
