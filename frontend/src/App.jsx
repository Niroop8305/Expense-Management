import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";
import ManagerDashboard from "./pages/ManagerDashboard.jsx";
import Settings from "./pages/Settings.jsx";
import WorkflowBuilder from "./pages/WorkflowBuilder.jsx";
import FinanceDashboard from "./pages/FinanceDashboard.jsx";
import DirectorDashboard from "./pages/DirectorDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
  <Route path="/finance/dashboard" element={<FinanceDashboard />} />
  <Route path="/director/dashboard" element={<DirectorDashboard />} />
        <Route path="/settings" element={<Settings />} />
  <Route path="/admin/workflows" element={<WorkflowBuilder />} />
      </Routes>
    </BrowserRouter>
  );
}
