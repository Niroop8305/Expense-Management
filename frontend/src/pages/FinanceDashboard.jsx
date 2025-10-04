import React from 'react';
import ManagerDashboard from './ManagerDashboard.jsx';
// Temporary reuse of ManagerDashboard behavior for Finance role.
export default function FinanceDashboard(){
  return <ManagerDashboard roleAlias="finance" />;
}
