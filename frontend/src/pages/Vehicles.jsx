import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Activity,
  Layers,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

const VEHICLE_STATUSES = [
  { value: 'AVAILABLE', label: 'Available', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'BUSY', label: 'Busy (In Transit)', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'text-amber-700 bg-amber-50 border-amber-200' },
];

export const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState(null);

  // Form State
  const initialForm = {
    vehicle_number: '',
    capacity: '',
    current_latitude: '37.7749',
    current_longitude: '-122.4194',
    status: 'AVAILABLE',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch vehicles from PostgreSQL backend API (single source of truth)
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/vehicles');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setVehicles(res.data.data);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles from API:', err);
      setError(err.response?.data?.message || 'Unable to connect to Fleet Logistics API service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const showFeedback = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData(initialForm);
    setFormErrors([]);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (v) => {
    setActiveVehicle(v);
    setFormData({
      vehicle_number: v.vehicle_number || '',
      capacity: v.capacity?.toString() || '',
      current_latitude: v.current_latitude?.toString() || '',
      current_longitude: v.current_longitude?.toString() || '',
      status: v.status || 'AVAILABLE',
    });
    setFormErrors([]);
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (v) => {
    setActiveVehicle(v);
    setIsDeleteModalOpen(true);
  };

  // Submit Add Vehicle
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    try {
      const payload = {
        vehicle_number: formData.vehicle_number.trim().toUpperCase(),
        capacity: parseFloat(formData.capacity),
        current_latitude: parseFloat(formData.current_latitude),
        current_longitude: parseFloat(formData.current_longitude),
        status: formData.status,
      };

      const res = await api.post('/vehicles', payload);
      if (res.data?.success) {
        setIsAddModalOpen(false);
        showFeedback(`Vehicle "${payload.vehicle_number}" registered to fleet!`);
        await fetchVehicles();
      }
    } catch (err) {
      console.error('Error registering vehicle:', err);
      const errList = err.response?.data?.errors;
      if (Array.isArray(errList) && errList.length > 0) {
        setFormErrors(errList);
      } else {
        setFormErrors([err.response?.data?.message || 'Failed to register vehicle']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Vehicle
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!activeVehicle) return;
    setFormErrors([]);
    setSubmitting(true);

    try {
      const payload = {
        vehicle_number: formData.vehicle_number.trim().toUpperCase(),
        capacity: parseFloat(formData.capacity),
        current_latitude: parseFloat(formData.current_latitude),
        current_longitude: parseFloat(formData.current_longitude),
        status: formData.status,
      };

      const res = await api.put(`/vehicles/${activeVehicle.id}`, payload);
      if (res.data?.success) {
        setIsEditModalOpen(false);
        showFeedback(`Vehicle "${payload.vehicle_number}" updated successfully!`);
        await fetchVehicles();
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
      const errList = err.response?.data?.errors;
      if (Array.isArray(errList) && errList.length > 0) {
        setFormErrors(errList);
      } else {
        setFormErrors([err.response?.data?.message || 'Failed to update vehicle']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Status Toggle directly from card
  const handleQuickStatusChange = async (v, newStatus) => {
    if (v.status === newStatus) return;
    try {
      const payload = {
        vehicle_number: v.vehicle_number,
        capacity: Number(v.capacity),
        current_latitude: Number(v.current_latitude),
        current_longitude: Number(v.current_longitude),
        status: newStatus,
      };
      const res = await api.put(`/vehicles/${v.id}`, payload);
      if (res.data?.success) {
        showFeedback(`Vehicle ${v.vehicle_number} status set to ${newStatus}`);
        await fetchVehicles();
      }
    } catch (err) {
      console.error('Failed to change vehicle status:', err);
      alert(err.response?.data?.message || 'Failed to update vehicle status.');
    }
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!activeVehicle) return;
    setSubmitting(true);

    try {
      const res = await api.delete(`/vehicles/${activeVehicle.id}`);
      if (res.data?.success) {
        setIsDeleteModalOpen(false);
        showFeedback(`Vehicle ${activeVehicle.vehicle_number} decommissioned from fleet.`);
        await fetchVehicles();
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      alert(err.response?.data?.message || 'Failed to delete vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesStatus =
        statusFilter === 'ALL' || v.status?.toUpperCase() === statusFilter.toUpperCase();

      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        v.vehicle_number?.toLowerCase().includes(term) ||
        v.status?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [vehicles, statusFilter, search]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter((v) => v.status === 'AVAILABLE').length;
    const busy = vehicles.filter((v) => v.status === 'BUSY').length;
    const maintenance = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
    const totalCapacity = vehicles.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0);
    return { total, available, busy, maintenance, totalCapacity };
  }, [vehicles]);

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            AVAILABLE
          </span>
        );
      case 'BUSY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
            BUSY
          </span>
        );
      case 'MAINTENANCE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-600" />
            MAINTENANCE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-600" />
            Logistics Transport & Vehicle Fleet
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            PostgreSQL-backed fleet telemetry tracking rescue vans, cargo e-bikes, capacity bounds, and GPS coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={fetchVehicles}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={handleOpenAdd}
          >
            Register Vehicle
          </Button>
        </div>
      </div>

      {/* Success Feedback Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="xs" onClick={fetchVehicles}>
            Retry Connection
          </Button>
        </div>
      )}

      {/* Fleet KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Fleet</span>
          <span className="text-2xl font-black text-slate-900">{stats.total}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">{stats.totalCapacity.toLocaleString()} kg payload</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Ready (AVAILABLE)</span>
          <span className="text-2xl font-black text-emerald-700">{stats.available}</span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Ready for dispatch</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-cyan-600 uppercase tracking-wider block">In Transit (BUSY)</span>
          <span className="text-2xl font-black text-cyan-700">{stats.busy}</span>
          <span className="text-[11px] text-cyan-600 font-semibold block mt-0.5">Missions underway</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">MAINTENANCE</span>
          <span className="text-2xl font-black text-amber-700">{stats.maintenance}</span>
          <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">Offline for inspection</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vehicle ID, number, or status..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'AVAILABLE', 'BUSY', 'MAINTENANCE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 shadow-xs shadow-cyan-500/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
              }`}
            >
              {st === 'ALL' ? `All Vehicles (${vehicles.length})` : st}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      {loading ? (
        <div className="p-12 bg-white/80 rounded-2xl border border-slate-200 flex justify-center">
          <LoadingSpinner size="lg" message="Loading vehicle fleet from PostgreSQL database..." />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Vehicles Found"
          description={
            search
              ? `No fleet transport vehicles matched "${search}".`
              : 'No vehicles registered under the selected status filter.'
          }
          actionLabel="Register First Vehicle"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((v) => {
            const lat = Number(v.current_latitude) || 0;
            const lng = Number(v.current_longitude) || 0;

            return (
              <div
                key={v.id}
                className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                      {v.vehicle_number}
                    </span>
                    {renderStatusBadge(v.status)}
                  </div>

                  {/* Title & Quick Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Fleet Transport #{v.id}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Cold-Chain Active
                      </span>
                    </div>
                  </div>

                  {/* Attributes Box */}
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Cargo Capacity</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {v.capacity} <span className="text-xs text-slate-500 font-normal">kg</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5 text-cyan-600" />
                        Current Location
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-700">
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Status Control Dropdown */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
                    <span className="text-[11px] font-bold text-slate-600">Quick Status:</span>
                    <div className="flex items-center gap-1">
                      {['AVAILABLE', 'BUSY', 'MAINTENANCE'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleQuickStatusChange(v, st)}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                            v.status === st
                              ? st === 'AVAILABLE'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : st === 'BUSY'
                                ? 'bg-cyan-600 text-white shadow-xs'
                                : 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {st.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={`https://maps.google.com/?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Radar Map
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(v)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit Vehicle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(v)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Decommission Vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: REGISTER VEHICLE */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !submitting && setIsAddModalOpen(false)}
        title="Register Logistics Vehicle"
        subtitle="Add a transport vehicle to the cold-chain dispatch network"
        icon={Plus}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 space-y-1">
              {formErrors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-slate-700 font-bold block mb-1">Vehicle License / Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. EV-FOOD-904 or TRK-COLD-12"
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none uppercase font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Capacity (kg) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="e.g. 1000"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Initial Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-medium"
              >
                <option value="AVAILABLE">AVAILABLE (Ready for Dispatch)</option>
                <option value="BUSY">BUSY (Active in Transit)</option>
                <option value="MAINTENANCE">MAINTENANCE (Offline for Inspection)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Current Latitude</label>
              <input
                type="number"
                step="0.000001"
                required
                placeholder="37.7749"
                value={formData.current_latitude}
                onChange={(e) => setFormData({ ...formData, current_latitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Current Longitude</label>
              <input
                type="number"
                step="0.000001"
                required
                placeholder="-122.4194"
                value={formData.current_longitude}
                onChange={(e) => setFormData({ ...formData, current_longitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Register Vehicle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT VEHICLE */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !submitting && setIsEditModalOpen(false)}
        title="Edit Vehicle Attributes"
        subtitle={`Update configuration for ${activeVehicle?.vehicle_number || 'Selected Vehicle'}`}
        icon={Edit2}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
          {formErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 space-y-1">
              {formErrors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-slate-700 font-bold block mb-1">Vehicle License / Number *</label>
            <input
              type="text"
              required
              value={formData.vehicle_number}
              onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none uppercase font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Capacity (kg) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-medium"
              >
                <option value="AVAILABLE">AVAILABLE (Ready for Dispatch)</option>
                <option value="BUSY">BUSY (Active in Transit)</option>
                <option value="MAINTENANCE">MAINTENANCE (Offline for Inspection)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Current Latitude</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.current_latitude}
                onChange={(e) => setFormData({ ...formData, current_latitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Current Longitude</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.current_longitude}
                onChange={(e) => setFormData({ ...formData, current_longitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
            >
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: DELETE CONFIRMATION */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !submitting && setIsDeleteModalOpen(false)}
        title="Decommission Vehicle"
        subtitle="Confirm vehicle removal from active fleet"
        icon={Trash2}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to decommission and permanently delete vehicle{' '}
            <strong className="text-slate-900">{activeVehicle?.vehicle_number}</strong> from PostgreSQL?
          </p>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>This transport unit will be removed from route optimization algorithms.</span>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={submitting}
            >
              {submitting ? 'Decommissioning...' : 'Confirm Decommission'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Vehicles;
