import React from 'react';
import ManagerDashboard from './ManagerDashboard.jsx';
// Temporary reuse of ManagerDashboard behavior for Director role.
export default function DirectorDashboard(){
  return <ManagerDashboard roleAlias="director" />;
}
