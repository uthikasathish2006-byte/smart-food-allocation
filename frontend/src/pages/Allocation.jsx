import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Package,
  MapPin,
  Check,
  Sliders,
  X,
  Info,
  ShieldCheck,
  Wheat,
  ShieldAlert,
  Database,
  History,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Allocation = () => {
  // Authentication & Role
  const { user, login } = useAuth();
  const isAdmin =
    String(user?.role || '').toLowerCase() === 'admin' ||
    String(user?.role || '').toLowerCase() === 'administrator';

  // Three Overview States
  const [overviewData, setOverviewData] = useState({
    availableFoodQty: 0,
    availableFoodBatches: 0,
    criticalLocationsCount: 0,
    criticalLocationsList: [],
    availableVehiclesCount: 0,
    availableVehiclesCapacity: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Optimization & Recommendations State
  const [recommendations, setRecommendations] = useState([]);
  const [optimizationSummary, setOptimizationSummary] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [hasRunOptimization, setHasRunOptimization] = useState(false);

  // Manual Override Modal & State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [overrideQuantity, setOverrideQuantity] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideFormError, setOverrideFormError] = useState(null);

  // Confirmation message after successful save
  const [savedConfirmation, setSavedConfirmation] = useState(null);

  // Confirmed Allocations & Overrides History
  const [allocationsHistory, setAllocationsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch Overview Data (Available Food, Critical Locations, Available Vehicles)
  const fetchOverviewMetrics = async () => {
    try {
      setOverviewLoading(true);
      const [foodRes, demandRes, vehicleRes] = await Promise.all([
        api.get('/food'),
        api.get('/demand'),
        api.get('/vehicles'),
      ]);

      // 1. Available Food (non-expired)
      const foodList = foodRes.data?.data || [];
      const nonExpiredFood = foodList.filter((f) => f.expiry_status !== 'EXPIRED');
      const totalFoodQty = nonExpiredFood.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

      // 2. Critical Locations (Urgency 4 or 5)
      const demandList = demandRes.data?.data || [];
      const criticalDemands = demandList.filter((d) => Number(d.urgency) >= 4);

      // 3. Available Vehicles
      const vehicleList = vehicleRes.data?.data || [];
      const availVehicles = vehicleList.filter((v) => String(v.status).toUpperCase() === 'AVAILABLE');
      const totalAvailCap = availVehicles.reduce((sum, v) => sum + (Number(v.capacity) || 0), 0);

      setOverviewData({
        availableFoodQty: totalFoodQty,
        availableFoodBatches: nonExpiredFood.length,
        criticalLocationsCount: criticalDemands.length,
        criticalLocationsList: criticalDemands,
        availableVehiclesCount: availVehicles.length,
        availableVehiclesCapacity: totalAvailCap,
      });
    } catch (err) {
      console.error('Error fetching overview metrics:', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  // Fetch Database Allocations History (including override reasons)
  const fetchAllocationsHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/allocation');
      if (res.data?.success) {
        setAllocationsHistory(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching allocations history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchOverviewMetrics();
    fetchAllocationsHistory();
  }, []);

  const showFeedback = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 5000);
  };

  // POST /api/allocation/run: Trigger the Smart Food Allocation Optimization Engine
  const handleRunOptimization = async () => {
    try {
      setIsOptimizing(true);
      setError(null);
      const res = await api.post('/allocation/run');
      if (res.data?.success) {
        // Tag each recommendation with confirmation status: 'PENDING_CONFIRMATION'
        const enriched = (res.data.recommendations || []).map((rec, index) => ({
          ...rec,
          id: `REC-${index + 1}`,
          confirmationStatus: 'PENDING_CONFIRMATION', // 'PENDING_CONFIRMATION' | 'ACCEPTED' | 'OVERRIDDEN'
        }));
        setRecommendations(enriched);
        setOptimizationSummary(res.data.summary);
        setHasRunOptimization(true);
        showFeedback('Optimization complete! Recommendations ready for review and confirmation.');
      } else {
        setError(res.data?.message || 'Failed to compute allocations.');
      }
    } catch (err) {
      console.error('Error running allocation optimization:', err);
      setError(err.response?.data?.message || 'Failed to execute allocation optimization engine.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle ACCEPT or CONFIRM ALLOCATION: Admin confirms an allocation as recommended
  const handleAcceptAllocation = async (item) => {
    try {
      const payload = {
        food_stock_id: item.allocated_food_batch?.id || 1,
        location_id: item.location_id,
        quantity: item.recommended_quantity,
        distance_km: item.distance_km || 0,
        priority_score: item.priority_score,
      };

      const res = await api.post('/allocation/confirm', payload);
      if (res.data?.success) {
        const allocData = res.data.data?.allocation;
        const foodData = res.data.data?.food_stock;
        const vehicleData = res.data.data?.vehicle;
        const alertData = res.data.data?.alert;

        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === item.id
              ? {
                  ...r,
                  confirmationStatus: 'CONFIRMED',
                  confirmedAllocationId: allocData?.id,
                }
              : r
          )
        );

        setSavedConfirmation({
          id: allocData?.id,
          location: item.location,
          quantity: item.recommended_quantity,
          overrideReason: 'Standard Algorithmic Acceptance',
          status: 'CONFIRMED',
          vehicle: vehicleData ? `${vehicleData.vehicle_number} (${vehicleData.capacity}kg)` : 'Assigned Fleet Vehicle',
          remainingStock: foodData ? `${foodData.remaining_quantity} ${foodData.unit || 'units'}` : null,
          alertMessage: alertData?.message,
          timestamp: new Date().toLocaleTimeString(),
        });

        const successNotice = `Allocation CONFIRMED! ${foodData?.reduced_quantity || item.recommended_quantity} units allocated to "${item.location}". Food inventory reduced to ${foodData?.remaining_quantity} ${foodData?.unit || 'units'}. Status updated to CONFIRMED and alert created.`;
        showFeedback(successNotice);
        fetchOverviewMetrics();
        fetchAllocationsHistory();
      }
    } catch (err) {
      console.error('Error confirming allocation:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to confirm allocation. Transaction was rolled back.';
      setError(`Confirmation Failed (Transaction Rolled Back): ${errMsg}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Open MANUAL OVERRIDE Modal: Requires ADMIN role
  const handleOpenOverrideModal = (item) => {
    if (!isAdmin) {
      setError(`Access Denied: Manual Override strictly requires the ADMIN role. Your current role is "${user?.role || 'Guest'}".`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedItem(item);
    setOverrideQuantity(item.recommended_quantity?.toString() || '');
    setOverrideReason('');
    setOverrideFormError(null);
    setIsOverrideModalOpen(true);
  };

  // Submit MANUAL OVERRIDE: Admin customizes quantity & justification
  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    // Enforce ADMIN role
    if (!isAdmin) {
      setOverrideFormError('Access Denied: ADMIN role is strictly required for manual overrides.');
      return;
    }

    const numQty = parseFloat(overrideQuantity);
    if (isNaN(numQty) || numQty <= 0) {
      setOverrideFormError('Please enter a valid positive number for Override Quantity.');
      return;
    }

    // Mandatory reason requirement
    if (!overrideReason.trim()) {
      setOverrideFormError('The admin must enter a reason (e.g. Emergency situation).');
      return;
    }

    try {
      setOverrideSubmitting(true);
      setOverrideFormError(null);

      const payload = {
        food_stock_id: selectedItem.allocated_food_batch?.id || 1,
        location_id: selectedItem.location_id,
        quantity: numQty,
        distance_km: selectedItem.distance_km || 0,
        priority_score: selectedItem.priority_score || 0,
        status: 'approved',
        override_reason: overrideReason.trim(),
        user_role: user?.role || 'admin',
      };

      // POST to backend manual override endpoint
      const res = await api.post('/allocation/override', payload);
      if (res.data?.success) {
        const savedRecord = res.data.data;

        // Update local recommendation status
        setRecommendations((prev) =>
          prev.map((r) =>
            r.id === selectedItem.id
              ? {
                  ...r,
                  recommended_quantity: numQty,
                  confirmationStatus: 'OVERRIDDEN',
                  adminOverrideReason: overrideReason.trim(),
                  savedAllocationId: savedRecord?.id,
                }
              : r
          )
        );

        setIsOverrideModalOpen(false);

        // Show dedicated confirmation message after successful save
        setSavedConfirmation({
          id: savedRecord?.id,
          location: selectedItem.location,
          quantity: numQty,
          overrideReason: overrideReason.trim(),
          timestamp: new Date().toLocaleTimeString(),
        });

        showFeedback(`Manual override confirmed and saved to database! Override reason: "${overrideReason.trim()}" saved for ${selectedItem.location}.`);
        fetchOverviewMetrics();
        fetchAllocationsHistory();
      }
    } catch (err) {
      console.error('Error saving manual override:', err);
      const msg = err.response?.data?.message || 'Failed to save manual override.';
      setOverrideFormError(msg);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // Urgency indicator badge helper
  const renderUrgencyBadge = (urgency) => {
    const num = Number(urgency);
    if (num >= 5) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          CRITICAL (5)
        </span>
      );
    }
    if (num >= 4) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          HIGH (4)
        </span>
      );
    }
    if (num >= 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          MEDIUM (3)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        LOW ({num || 1})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-600" />
            Smart Food Allocation Optimization
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            AI-driven multi-constraint dispatch pairing surplus perishable batches with priority relief nodes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Persona / Role Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="text-slate-500">Active Role:</span>
            <span className={`font-bold uppercase ${isAdmin ? 'text-emerald-700 font-black' : 'text-slate-700'}`}>
              {user?.role || 'Guest'}
            </span>
            {!isAdmin && (
              <button
                onClick={() => login({ role: 'admin', name: 'Admin Lead' })}
                className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900 underline ml-1"
                title="Switch to Admin role to test manual override"
              >
                Switch to Admin
              </button>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={RotateCw}
            isLoading={isOptimizing}
            onClick={handleRunOptimization}
            className="shadow-lg shadow-cyan-500/20"
          >
            {isOptimizing ? 'Running Optimization...' : 'RUN OPTIMIZATION'}
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs transition-all animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation message after successful save */}
      {savedConfirmation && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-300 shadow-sm flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  {savedConfirmation.status === 'CONFIRMED'
                    ? 'Allocation Confirmed & Committed via PostgreSQL Transaction'
                    : 'Manual Override Confirmed & Saved to Database'}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  STATUS: CONFIRMED
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {savedConfirmation.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Successfully allocated{' '}
                <strong className="text-slate-900 font-bold">{savedConfirmation.quantity} units</strong> to{' '}
                <strong className="text-slate-900 font-bold">{savedConfirmation.location}</strong>.
                {savedConfirmation.vehicle && (
                  <span className="ml-1.5 text-slate-600">
                    &bull; Transport: <strong>{savedConfirmation.vehicle}</strong>
                  </span>
                )}
                {savedConfirmation.remainingStock && (
                  <span className="ml-1.5 text-emerald-700 font-semibold">
                    &bull; Remaining Inventory: <strong>{savedConfirmation.remainingStock}</strong>
                  </span>
                )}
              </p>
              {savedConfirmation.overrideReason && savedConfirmation.overrideReason !== 'Standard Algorithmic Acceptance' && (
                <div className="inline-flex items-center gap-2 text-xs bg-white/95 px-3 py-1.5 rounded-xl border border-emerald-200 text-slate-800 shadow-2xs mt-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    Override Justification:
                  </span>
                  <span className="font-bold text-emerald-900">
                    "{savedConfirmation.overrideReason}"
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setSavedConfirmation(null)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
            title="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Three Primary Required Overview Panels: AVAILABLE FOOD, CRITICAL LOCATIONS, AVAILABLE VEHICLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PANEL 1: AVAILABLE FOOD */}
        <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm hover:border-cyan-300 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              AVAILABLE FOOD
            </span>
            <div className="text-2xl font-black text-slate-900">
              {overviewLoading ? '...' : `${overviewData.availableFoodQty.toLocaleString()}`}
              <span className="text-xs font-normal text-slate-500 ml-1">units / kg</span>
            </div>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 pt-1">
              <Wheat className="w-3.5 h-3.5" />
              {overviewData.availableFoodBatches} active surplus batches in inventory
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* PANEL 2: CRITICAL LOCATIONS */}
        <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm hover:border-rose-300 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
              CRITICAL LOCATIONS
            </span>
            <div className="text-2xl font-black text-rose-700">
              {overviewLoading ? '...' : `${overviewData.criticalLocationsCount}`}
              <span className="text-xs font-normal text-slate-500 ml-1">Urgency Level 4-5</span>
            </div>
            <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 pt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Urgent food assistance required immediately
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        {/* PANEL 3: AVAILABLE VEHICLES */}
        <div className="p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm hover:border-cyan-300 transition-all flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider block">
              AVAILABLE VEHICLES
            </span>
            <div className="text-2xl font-black text-cyan-800">
              {overviewLoading ? '...' : `${overviewData.availableVehiclesCount}`}
              <span className="text-xs font-normal text-slate-500 ml-1">transport units</span>
            </div>
            <p className="text-xs text-cyan-700 font-semibold flex items-center gap-1 pt-1">
              <Truck className="w-3.5 h-3.5" />
              {overviewData.availableVehiclesCapacity.toLocaleString()} kg total payload capacity
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200/80 text-cyan-600 flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Confirmation Policy Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Administrative Confirmation Required:</strong> Recommendations are calculated dynamically without committing directly to the database. The admin must confirm each dispatch via <strong>ACCEPT</strong> or enter an authorized <strong>MANUAL OVERRIDE</strong> with mandatory justification.
          </span>
        </div>
      </div>

      {/* Recommendations Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Optimization Recommendations {hasRunOptimization && `(${recommendations.length})`}
          </h2>
          {hasRunOptimization && (
            <span className="text-xs text-slate-500 font-medium">
              Sorted by Priority Score (High to Low)
            </span>
          )}
        </div>

        {isOptimizing ? (
          <div className="p-16 bg-white/90 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" message="Computing multi-objective optimization matrix..." />
          </div>
        ) : !hasRunOptimization ? (
          <EmptyState
            icon={Sparkles}
            title="Optimization Engine Ready"
            description="Click the RUN OPTIMIZATION button above to compute optimal allocation pairings based on demand, urgency, shelf life, and transit distance."
            actionLabel="RUN OPTIMIZATION"
            onAction={handleRunOptimization}
          />
        ) : recommendations.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No Pending Allocations"
            description="All active demands have been fulfilled or no matching surplus food stock is currently available."
            actionLabel="RUN OPTIMIZATION"
            onAction={handleRunOptimization}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-3">Demand</th>
                    <th className="py-3.5 px-3">Recommended Quantity</th>
                    <th className="py-3.5 px-3">Urgency</th>
                    <th className="py-3.5 px-3">Distance</th>
                    <th className="py-3.5 px-3">Priority Score</th>
                    <th className="py-3.5 px-4 min-w-[280px]">Reason</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recommendations.map((item) => {
                    const isAccepted =
                      item.confirmationStatus === 'ACCEPTED' ||
                      item.confirmationStatus === 'CONFIRMED';
                    const isOverridden = item.confirmationStatus === 'OVERRIDDEN';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isAccepted
                            ? 'bg-emerald-50/20'
                            : isOverridden
                            ? 'bg-cyan-50/20'
                            : ''
                        }`}
                      >
                        {/* 1. Location */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 line-clamp-1">
                            {item.location}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              LOC #{item.location_id}
                            </span>
                            <span>&bull;</span>
                            <span className="capitalize">{item.location_type?.toLowerCase().replace('_', ' ')}</span>
                          </div>
                        </td>

                        {/* 2. Demand */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-800 text-sm">
                            {item.requested_quantity}
                          </span>
                          <span className="text-[10px] text-slate-500 block">units</span>
                        </td>

                        {/* 3. Recommended Quantity */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-emerald-700 text-sm">
                              {item.recommended_quantity}
                            </span>
                            <span className="text-[10px] text-slate-500">units</span>
                          </div>
                          {isOverridden && (
                            <span className="text-[10px] font-bold text-cyan-700 block mt-0.5">
                              Manual Override
                            </span>
                          )}
                        </td>

                        {/* 4. Urgency */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {renderUrgencyBadge(item.urgency)}
                        </td>

                        {/* 5. Distance */}
                        <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-700">
                          {item.distance}
                        </td>

                        {/* 6. Priority Score */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800">
                            {item.priority_score}
                          </span>
                        </td>

                        {/* 7. Reason */}
                        <td className="py-3.5 px-4 text-slate-600 text-[11px] leading-relaxed">
                          <p>{item.reason}</p>
                          {item.adminOverrideReason && (
                            <div className="mt-1.5 text-[11px] font-medium text-cyan-900 bg-cyan-50/90 p-2 rounded-xl border border-cyan-200/90">
                              <span className="text-[10px] uppercase font-bold text-cyan-800 block tracking-wider">
                                Override Reason (Saved):
                              </span>
                              "{item.adminOverrideReason}"
                            </div>
                          )}
                        </td>

                        {/* 8. Actions (ACCEPT or CONFIRM ALLOCATION, MANUAL OVERRIDE) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isAccepted ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              CONFIRMED
                            </span>
                          ) : isOverridden ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-3 py-1.5 rounded-xl">
                              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                              OVERRIDDEN
                            </span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                variant="primary"
                                size="xs"
                                onClick={() => handleAcceptAllocation(item)}
                                title="Execute atomic PostgreSQL transaction to confirm allocation, reduce stock, and create alert"
                              >
                                CONFIRM ALLOCATION
                              </Button>
                              <Button
                                variant="secondary"
                                size="xs"
                                onClick={() => handleOpenOverrideModal(item)}
                              >
                                MANUAL OVERRIDE
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmed Allocations & Overrides History from Database */}
      <div className="space-y-3 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Database Allocations & Override Audit Log
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
              allocations table ({allocationsHistory.length})
            </span>
          </div>
          <button
            onClick={fetchAllocationsHistory}
            className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-1"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            Refresh Log
          </button>
        </div>

        {allocationsHistory.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No confirmed allocations in database yet. Confirm recommendations or execute a manual override above.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Priority Score</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4">Override Reason (allocations.override_reason)</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocationsHistory.slice(0, 8).map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-500">
                        #{alloc.id}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {alloc.location_name || `Location #${alloc.location_id}`}
                      </td>
                      <td className="py-2 px-3 font-black text-slate-800">
                        {alloc.quantity} units
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-cyan-800">
                        {alloc.priority_score}
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {alloc.status}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        {alloc.override_reason ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            "{alloc.override_reason}"
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            None (Algorithmic acceptance)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-[10px] text-slate-500">
                        {alloc.allocated_at ? new Date(alloc.allocated_at).toLocaleTimeString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MANUAL OVERRIDE MODAL */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => !overrideSubmitting && setIsOverrideModalOpen(false)}
        title="Manual Override"
        subtitle={`Administrative Intervention for ${selectedItem?.location || 'Relief Node'}`}
        icon={Sliders}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
          {/* Admin Role Status Badge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-200">
            <span className="text-[11px] font-bold text-cyan-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              ADMINISTRATIVE ACCESS VERIFIED
            </span>
            <span className="text-[10px] font-mono font-bold bg-white text-cyan-800 px-2 py-0.5 rounded border border-cyan-200 uppercase">
              Role: {user?.role || 'admin'}
            </span>
          </div>

          {/* 1. Location */}
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block text-[11px] uppercase tracking-wider">
              Location
            </label>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 font-bold flex items-center justify-between">
              <div>
                <span className="text-sm font-extrabold text-slate-900 block">
                  {selectedItem?.location}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedItem?.location_type?.replace('_', ' ')} &bull; Requested Demand: {selectedItem?.requested_quantity} units
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-1 rounded bg-slate-200/80 text-slate-700">
                LOC #{selectedItem?.location_id}
              </span>
            </div>
          </div>

          {/* 2. System Recommended Quantity */}
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block text-[11px] uppercase tracking-wider">
              System Recommended Quantity
            </label>
            <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-base font-black text-emerald-800">
                  {selectedItem?.recommended_quantity}
                  <span className="text-xs font-semibold text-emerald-700 ml-1">units</span>
                </span>
                <span className="text-[10px] text-emerald-600 block font-medium">
                  Optimized based on Demand, Urgency ({selectedItem?.urgency}/5) & Distance
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Priority: {selectedItem?.priority_score}
              </span>
            </div>
          </div>

          {/* 3. Override Quantity */}
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block text-xs">
              Override Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={overrideQuantity}
              onChange={(e) => {
                setOverrideQuantity(e.target.value);
                if (overrideFormError) setOverrideFormError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-sm font-bold transition-all"
              placeholder="Enter custom allocation quantity"
            />
            <p className="text-[11px] text-slate-400">
              Specify the customized allocation quantity to dispatch to this location.
            </p>
          </div>

          {/* 4. Override Reason */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold text-xs">
                Override Reason <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Required
              </span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="e.g. Emergency situation"
              value={overrideReason}
              onChange={(e) => {
                setOverrideReason(e.target.value);
                if (overrideFormError) setOverrideFormError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-xs leading-relaxed transition-all"
            />
            <div className="flex items-center justify-between pt-0.5">
              <p className="text-[11px] text-slate-500">
                The admin must enter a reason. Example:{' '}
                <button
                  type="button"
                  onClick={() => {
                    setOverrideReason('Emergency situation');
                    if (overrideFormError) setOverrideFormError(null);
                  }}
                  className="font-semibold text-cyan-600 hover:text-cyan-800 underline decoration-cyan-400"
                >
                  Emergency situation
                </button>
              </p>
            </div>
          </div>

          {/* Error Message within Modal */}
          {overrideFormError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{overrideFormError}</span>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsOverrideModalOpen(false)}
              disabled={overrideSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={overrideSubmitting}
              disabled={overrideSubmitting}
              className="shadow-sm shadow-cyan-500/20"
            >
              {overrideSubmitting ? 'Saving Override...' : 'Confirm Override'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Allocation;
