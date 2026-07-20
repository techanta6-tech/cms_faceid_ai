import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { ReportPage } from '../features/reports/pages/ReportPage';
import { AreasPage } from '../features/areas/pages/AreasPage';
import { DevicesPage } from '../features/devices/pages/DevicesPage';
import { EmployeesPage } from '../features/employees/pages/EmployeesPage';
import { AccessSchedulePage } from '../features/schedule/pages/AccessSchedulePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports" element={<ReportPage />} />
        <Route path="/areas" element={<AreasPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/access-schedule" element={<AccessSchedulePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
