import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wheat,
  Package,
  Heart,
  MapPin,
  Truck,
  Clock,
  Bell,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Layers,
  PieChart,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Users,
  Compass,
} from 'lucide-react';
import axios from 'axios';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import { AlertCard } from '../components/AlertCard';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Dashboard = () => {
  // Core metrics requested from GET /api/dashboard
  const [dashboardData, setDashboardData] = useState({
    totalFood: null,
    distributedFood: null,
    criticalLocations: null,
    totalLocations: null,
    availableVehicles: null,
    expiringFood: null,
    activeAlerts: null,
    categories: [],
    criticalLocationsList: [],
    recentAllocations: [],
    vehiclesList: [],
    alertsList: [],
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch real PostgreSQL metrics from GET /api/dashboard using Axios
  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch from real backend API endpoint using Axios
      const res = await api.get('/dashboard');

      if (res.data?.success || res.status === 200) {
        const raw = res.data;
        const details = raw.data || {};

        setDashboardData({
          totalFood: raw.totalFood ?? details.totalFood ?? 0,
          distributedFood: raw.distributedFood ?? details.distributedFood ?? 0,
          criticalLocations: raw.criticalLocations ?? details.criticalLocations ?? 0,
          totalLocations: raw.totalLocations ?? details.totalLocations ?? 0,
          availableVehicles: raw.availableVehicles ?? details.availableVehicles ?? 0,
          expiringFood: raw.expiringFood ?? details.expiringFood ?? 0,
          activeAlerts: raw.activeAlerts ?? details.activeAlerts ?? 0,
          categories: details.categories || [],
          criticalLocationsList: details.criticalLocationsList || [],
          recentAllocations: details.recentAllocations || [],
          vehiclesList: details.vehiclesList || [],
          alertsList: details.alertsList || [],
        });
      } else {
        throw new Error(res.data?.message || 'Failed to retrieve dashboard metrics from server.');
      }
    } catch (err) {
      console.error('Error fetching /api/dashboard:', err);
      const msg = err.response?.data?.message || err.message || 'Unable to connect to PostgreSQL database.';
      setError(msg);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Columns for Recent Food Allocations DataTable
  const allocationColumns = [
    {
      header: 'Allocation ID',
      key: 'id',
      render: (val) => (
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
          #{val}
        </span>
      ),
    },
    {
      header: 'Food Item',
      key: 'foodName',
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900">{val}</div>
          <div className="text-[11px] text-slate-500 font-medium">Quantity: {row.quantity} units</div>
        </div>
      ),
    },
    {
      header: 'Destination (Location)',
      key: 'locationName',
      render: (val) => (
        <span className="font-bold text-cyan-900 bg-cyan-50/70 border border-cyan-200/60 px-2 py-0.5 rounded text-xs">
          {val}
        </span>
      ),
    },
    {
      header: 'Assigned Vehicle',
      key: 'vehicleNumber',
      render: (val) => (
        <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
          <Truck className="w-3.5 h-3.5 text-cyan-600" />
          <span className="font-mono">{val}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => {
        const isConfirmed = val === 'CONFIRMED' || val === 'approved';
        return (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              isConfirmed
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-cyan-50 text-cyan-700 border-cyan-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {val}
          </span>
        );
      },
    },
    {
      header: 'Priority Score',
      key: 'priorityScore',
      render: (val) => (
        <div className="text-right">
          <span className="text-xs font-black text-emerald-600">
            {val !== null ? `${val} pts` : 'Optimized'}
          </span>
        </div>
      ),
    },
  ];

  // Loading State
  if (loading && !dashboardData.totalFood && !dashboardData.totalLocations) {
    return (
      <div className="p-16 bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center space-y-4 my-8 shadow-xs">
        <LoadingSpinner size="lg" message="Connecting to PostgreSQL database..." />
        <p className="text-xs text-slate-400 font-medium">
          Calculating total food stock, logistics readiness, and critical urgency scores...
        </p>
      </div>
    );
  }

  // Error State
  if (error && !dashboardData.totalFood && !dashboardData.totalLocations) {
    return (
      <div className="p-8 sm:p-12 bg-white rounded-3xl border border-rose-200 text-center space-y-4 my-8 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Database Connection Error</h2>
          <p className="text-xs text-rose-600 font-medium mt-1 max-w-md mx-auto">{error}</p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={RefreshCw}
          onClick={() => fetchDashboardData()}
          className="mx-auto"
        >
          Retry Database Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner - Futuristic Hack Odyssey Light Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-cyan-50/30 to-emerald-50/40 border border-slate-200/80 p-6 md:p-8 shadow-sm">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-cyan-200 text-cyan-800 text-xs font-bold shadow-xs">
              <Wheat className="w-3.5 h-3.5 text-cyan-600" />
              <span>UN SDG 2 &bull; Zero Hunger &bull; Hack Odyssey 4.0</span>
            </div>

            {/* Live PostgreSQL Status Indicator */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>PostgreSQL Live Sync</span>
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Smart Food Allocation
          </h1>

          <p className="text-xs md:text-sm text-slate-600 mt-2 leading-relaxed font-medium">
            Monitor real-time food availability, community demand, logistics throughput, and emergency shelter priorities.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link to="/allocation">
              <Button variant="primary" size="md" icon={Sparkles}>
                Run Intelligent Matching
              </Button>
            </Link>
            <Link to="/food-stock">
              <Button variant="secondary" size="md" icon={Package}>
                Manage Inventory
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="md"
              icon={RefreshCw}
              isLoading={isRefreshing}
              onClick={() => fetchDashboardData(true)}
              className="text-slate-500 hover:text-slate-800"
            >
              Refresh Metrics
            </Button>
          </div>
        </div>

        {/* Visual watermark */}
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 opacity-15 hover:opacity-25 transition-opacity">
          <Wheat className="w-48 h-48 text-cyan-700" />
        </div>
      </div>

      {/* 6 Core Database Metric StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. totalFood */}
        <StatCard
          title="Total Food Available"
          value={dashboardData.totalFood !== null ? Number(dashboardData.totalFood).toLocaleString() : '0'}
          unit="kg"
          icon={Package}
          accent="emerald"
          subtitle="Real non-expired stock"
        />

        {/* 2. distributedFood */}
        <StatCard
          title="Food Distributed"
          value={dashboardData.distributedFood !== null ? `${Number(dashboardData.distributedFood).toLocaleString()} u` : '0 u'}
          icon={Heart}
          accent="cyan"
          subtitle="Confirmed allocations"
        />

        {/* 3. criticalLocations */}
        <StatCard
          title="Critical Locations"
          value={dashboardData.criticalLocations !== null ? `${dashboardData.criticalLocations} of ${dashboardData.totalLocations || 0}` : '0'}
          unit="shelters"
          icon={MapPin}
          accent="amber"
          subtitle="Urgency Level 5"
        />

        {/* 4. availableVehicles */}
        <StatCard
          title="Available Vehicles"
          value={dashboardData.availableVehicles !== null ? dashboardData.availableVehicles : '0'}
          unit="fleet"
          icon={Truck}
          accent="cyan"
          subtitle="Cold-chain ready"
        />

        {/* 5. expiringFood */}
        <StatCard
          title="Expiring Food"
          value={dashboardData.expiringFood !== null ? dashboardData.expiringFood : '0'}
          unit="batches"
          icon={Clock}
          accent="rose"
          subtitle="Within 48 hours"
        />

        {/* 6. activeAlerts */}
        <StatCard
          title="Active Alerts"
          value={dashboardData.activeAlerts !== null ? dashboardData.activeAlerts : '0'}
          unit="unread"
          icon={Bell}
          accent="rose"
          subtitle="Requires attention"
        />
      </div>

      {/* Main Grid: Distribution Overview & Critical Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 1: Food Distribution Overview (Real Stock Categories) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-600" />
                Food Stock Category Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time inventory breakdown currently held across storage facilities
              </p>
            </div>
            <Link to="/food-stock" className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              All Stock <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {dashboardData.categories && dashboardData.categories.length > 0 ? (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dashboardData.categories.map((item) => (
                  <div
                    key={item.category}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 hover:border-cyan-300 transition-colors"
                  >
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                      {item.category}
                    </div>
                    <div className="text-lg font-extrabold text-slate-900">
                      {item.percentage}%
                    </div>
                    <div className="text-[11px] text-cyan-700 font-semibold">
                      {item.count} kg available
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar visualizer */}
              <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden border border-slate-200/80">
                {dashboardData.categories.map((item, idx) => {
                  const colors = [
                    'bg-cyan-500',
                    'bg-emerald-500',
                    'bg-amber-400',
                    'bg-teal-400',
                    'bg-indigo-400',
                  ];
                  return (
                    <div
                      key={item.category}
                      style={{ width: `${item.percentage}%` }}
                      className={`${colors[idx % colors.length]} transition-all duration-500`}
                      title={`${item.category}: ${item.percentage}%`}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No active food stock categories"
              description="Inventory categories will populate automatically as donors contribute surplus."
            />
          )}
        </div>

        {/* Section 2: Critical Locations (Real Demand Urgency >= 5) */}
        <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Critical Urgency Locations
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Facilities flagged with urgency level 5
              </p>
            </div>
            <Link to="/demand" className="text-xs font-bold text-cyan-600 hover:text-cyan-700">
              Demand View
            </Link>
          </div>

          {dashboardData.criticalLocationsList && dashboardData.criticalLocationsList.length > 0 ? (
            <div className="space-y-3 pt-1">
              {dashboardData.criticalLocationsList.map((loc) => (
                <div
                  key={loc.id}
                  className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/80 hover:border-rose-300 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{loc.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {loc.type?.replace(/_/g, ' ')} &bull; {loc.population} individuals
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                      Urgency {loc.urgency}/5
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 text-[11px]">Requirement:</span>
                    <span className="font-extrabold text-rose-700">{loc.requiredQuantity} units</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              title="No critical locations detected"
              description="All registered facilities are currently stabilized with sufficient supplies."
            />
          )}
        </div>
      </div>

      {/* Section 3: Recent Food Allocations (DataTable from Real Allocations) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              Recent Food Allocations
            </h2>
            <p className="text-xs text-slate-500">
              Dispatches committed to PostgreSQL connecting donors, food stock, and logistics
            </p>
          </div>
          <Link to="/allocation">
            <Button variant="outline" size="sm">
              Explore Match Engine
            </Button>
          </Link>
        </div>

        <DataTable
          columns={allocationColumns}
          data={dashboardData.recentAllocations || []}
          emptyTitle="No recent food allocations"
          emptyMessage="Allocation missions will appear here when donor surplus is matched to demand."
        />
      </div>

      {/* Section 4 & 5: Real Vehicles and Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 4: Vehicle Availability from PostgreSQL */}
        <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-600" />
                Fleet Logistics Status
              </h2>
              <p className="text-xs text-slate-500">
                Cold-chain transport readiness and payload telemetry
              </p>
            </div>
            <Link to="/vehicles" className="text-xs font-bold text-cyan-600 hover:text-cyan-700">
              Fleet View ({dashboardData.vehiclesList.length})
            </Link>
          </div>

          {dashboardData.vehiclesList && dashboardData.vehiclesList.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.vehiclesList.map((v) => {
                const isAvail = v.status === 'AVAILABLE';
                return (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                          {v.vehicleNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          Refrigerated Unit #{v.id}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        GPS: {v.latitude?.toFixed(4)}, {v.longitude?.toFixed(4)}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isAvail
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        }`}
                      >
                        {v.status}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Capacity: {v.capacity} kg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Truck}
              title="No vehicle data available"
              description="Vehicles registered in the database will appear here."
            />
          )}
        </div>

        {/* Section 5: Real Alerts & Notifications */}
        <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                Active Incident Alerts
              </h2>
              <p className="text-xs text-slate-500">
                Spoilage risks, demand surges, and fleet notices
              </p>
            </div>
            <Link to="/alerts" className="text-xs font-bold text-cyan-600 hover:text-cyan-700">
              All Alerts ({dashboardData.activeAlerts})
            </Link>
          </div>

          {dashboardData.alertsList && dashboardData.alertsList.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.alertsList.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3.5 rounded-xl border bg-white border-rose-200/80 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-rose-100 text-rose-800">
                      {alert.severity || 'ALERT'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="All Caught Up"
              description="No active unread alerts currently require coordinator review."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
