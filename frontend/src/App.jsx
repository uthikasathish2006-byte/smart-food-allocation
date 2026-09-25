import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './components/Layout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FoodStock } from './pages/FoodStock';
import { Locations } from './pages/Locations';
import { Demand } from './pages/Demand';
import { Vehicles } from './pages/Vehicles';
import { Allocation } from './pages/Allocation';
import { MapView } from './pages/MapView';
import { Alerts } from './pages/Alerts';
import { History } from './pages/History';
import { Admin } from './pages/Admin';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Main Application with Responsive Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/food-stock" element={<FoodStock />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/demand" element={<Demand />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/allocation" element={<Allocation />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/history" element={<History />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
