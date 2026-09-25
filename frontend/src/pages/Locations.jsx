import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Phone,
  User,
  Users,
  Building,
  GraduationCap,
  Home,
  Cross,
  Navigation,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

const LOCATION_TYPES = [
  { value: 'COMMUNITY_KITCHEN', label: 'Community Kitchen', icon: Building, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'SCHOOL', label: 'School', icon: GraduationCap, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  { value: 'SHELTER', label: 'Shelter', icon: Home, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { value: 'RELIEF_CENTER', label: 'Relief Center', icon: Navigation, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  { value: 'HOSPITAL', label: 'Hospital', icon: Cross, color: 'text-rose-700 bg-rose-50 border-rose-200' },
];

export const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState(null);

  // Form state for Add/Edit
  const initialFormData = {
    name: '',
    type: 'COMMUNITY_KITCHEN',
    population: '',
    capacity: '',
    latitude: '',
    longitude: '',
    contact_person: '',
    contact_phone: '',
  };
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch locations from backend API
  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/locations');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLocations(res.data.data);
      } else {
        setLocations([]);
      }
    } catch (err) {
      console.error('Failed to load locations from API:', err);
      setError(err.response?.data?.message || 'Unable to connect to the backend locations service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Display temporary success toast
  const showFeedback = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      ...initialFormData,
      latitude: '37.7749',
      longitude: '-122.4194',
    });
    setFormErrors([]);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (loc) => {
    setActiveLocation(loc);
    setFormData({
      name: loc.name || '',
      type: loc.type || 'COMMUNITY_KITCHEN',
      population: loc.population?.toString() || '0',
      capacity: loc.capacity?.toString() || '0',
      latitude: loc.latitude?.toString() || '',
      longitude: loc.longitude?.toString() || '',
      contact_person: loc.contact_person || '',
      contact_phone: loc.contact_phone || '',
    });
    setFormErrors([]);
    setIsEditModalOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (loc) => {
    setActiveLocation(loc);
    setIsDetailModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (loc) => {
    setActiveLocation(loc);
    setIsDeleteModalOpen(true);
  };

  // Submit Add Location
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        population: Number(formData.population) || 0,
        capacity: Number(formData.capacity) || 0,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        contact_person: formData.contact_person.trim(),
        contact_phone: formData.contact_phone.trim(),
      };

      const res = await api.post('/locations', payload);
      if (res.data?.success) {
        setIsAddModalOpen(false);
        showFeedback(`Location "${payload.name}" successfully created!`);
        await fetchLocations();
      }
    } catch (err) {
      console.error('Error creating location:', err);
      const errList = err.response?.data?.errors;
      if (Array.isArray(errList) && errList.length > 0) {
        setFormErrors(errList);
      } else {
        setFormErrors([err.response?.data?.message || 'Failed to create location']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Location
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!activeLocation) return;
    setFormErrors([]);
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        population: Number(formData.population) || 0,
        capacity: Number(formData.capacity) || 0,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        contact_person: formData.contact_person.trim(),
        contact_phone: formData.contact_phone.trim(),
      };

      const res = await api.put(`/locations/${activeLocation.id}`, payload);
      if (res.data?.success) {
        setIsEditModalOpen(false);
        showFeedback(`Location "${payload.name}" successfully updated!`);
        await fetchLocations();
      }
    } catch (err) {
      console.error('Error updating location:', err);
      const errList = err.response?.data?.errors;
      if (Array.isArray(errList) && errList.length > 0) {
        setFormErrors(errList);
      } else {
        setFormErrors([err.response?.data?.message || 'Failed to update location']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Location
  const handleDeleteConfirm = async () => {
    if (!activeLocation) return;
    setSubmitting(true);

    try {
      const res = await api.delete(`/locations/${activeLocation.id}`);
      if (res.data?.success) {
        setIsDeleteModalOpen(false);
        showFeedback(`Location "${activeLocation.name}" removed from database.`);
        await fetchLocations();
      }
    } catch (err) {
      console.error('Error deleting location:', err);
      alert(err.response?.data?.message || 'Failed to delete location.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search computation
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesType =
        selectedType === 'ALL' ||
        loc.type?.toUpperCase() === selectedType.toUpperCase();

      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        loc.name?.toLowerCase().includes(term) ||
        loc.type?.toLowerCase().includes(term) ||
        loc.contact_person?.toLowerCase().includes(term) ||
        loc.contact_phone?.toLowerCase().includes(term);

      return matchesType && matchesSearch;
    });
  }, [locations, selectedType, search]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalNodes = locations.length;
    const totalPop = locations.reduce((acc, curr) => acc + (Number(curr.population) || 0), 0);
    const totalCap = locations.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0);
    return { totalNodes, totalPop, totalCap };
  }, [locations]);

  // Type helper styling
  const getTypeMeta = (type) => {
    const match = LOCATION_TYPES.find((t) => t.value === type);
    return match || {
      value: type,
      label: type?.replace('_', ' ') || 'Unknown',
      icon: Building,
      color: 'text-slate-700 bg-slate-100 border-slate-200',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-cyan-600" />
            Network Hubs & Distribution Nodes
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Live database registry of community kitchens, schools, emergency shelters, relief centers, and hospital wings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={fetchLocations}
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
            Add Location
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="xs" onClick={fetchLocations}>
            Retry Connection
          </Button>
        </div>
      )}

      {/* High-level Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Nodes</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalNodes}</span>
            <span className="text-[11px] text-cyan-600 font-semibold block mt-0.5">PostgreSQL Synced</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200/80 text-cyan-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Vulnerable Population</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalPop.toLocaleString()}</span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Persons reliant</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Meal Capacity</span>
            <span className="text-2xl font-black text-slate-900">{stats.totalCap.toLocaleString()}</span>
            <span className="text-[11px] text-indigo-600 font-semibold block mt-0.5">Daily throughput units</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by facility name, contact person, or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedType === 'ALL'
                ? 'bg-cyan-500 text-slate-950 shadow-xs shadow-cyan-500/20'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
            }`}
          >
            All Nodes ({locations.length})
          </button>
          {LOCATION_TYPES.map((t) => {
            const count = locations.filter((l) => l.type?.toUpperCase() === t.value).length;
            return (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  selectedType === t.value
                    ? 'bg-cyan-500 text-slate-950 shadow-xs shadow-cyan-500/20'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
                }`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="p-12 bg-white/80 rounded-2xl border border-slate-200 flex justify-center">
          <LoadingSpinner size="lg" message="Loading locations from PostgreSQL database..." />
        </div>
      ) : filteredLocations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No Locations Match Your Criteria"
          description={search ? `No locations found matching "${search}".` : 'No locations currently logged for this type.'}
          actionLabel="Add New Location"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => {
            const meta = getTypeMeta(loc.type);
            const TypeIcon = meta.icon;
            const pop = Number(loc.population) || 0;
            const cap = Number(loc.capacity) || 0;
            const loadPercent = cap > 0 ? Math.min(100, Math.round((pop / cap) * 100)) : 0;

            return (
              <div
                key={loc.id}
                className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.color}`}
                    >
                      <TypeIcon className="w-3.5 h-3.5" />
                      {meta.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      ID: #{loc.id}
                    </span>
                  </div>

                  {/* Title & Coordinates */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors mb-1 line-clamp-1">
                    {loc.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mb-4">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                    <span>
                      {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                    </span>
                  </div>

                  {/* Details Container */}
                  <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Contact
                      </span>
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">
                        {loc.contact_person || 'Not specified'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Phone
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-800">
                        {loc.contact_phone || 'None'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                        <span className="text-slate-500">Utilization Rate</span>
                        <span className={loadPercent > 85 ? 'text-rose-600' : 'text-slate-800'}>
                          {pop} / {cap} ({loadPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            loadPercent > 90
                              ? 'bg-rose-500'
                              : loadPercent > 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${loadPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenDetail(loc)}
                    className="text-xs font-bold text-slate-600 hover:text-cyan-700 flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(loc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit Location"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(loc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Location"
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

      {/* MODAL 1: ADD LOCATION */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !submitting && setIsAddModalOpen(false)}
        title="Add Network Node"
        subtitle="Register a new distribution center, community kitchen, school, or shelter"
        icon={Plus}
        maxWidth="max-w-xl"
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
            <label className="text-slate-700 font-bold block mb-1">Facility / Location Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. St. Jude Regional Hospital Food Wing"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Facility Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-medium"
              >
                {LOCATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Current Population Served</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 350"
                value={formData.population}
                onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Total Capacity</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Latitude *</label>
              <input
                type="number"
                step="0.000001"
                required
                placeholder="37.7749"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Longitude *</label>
              <input
                type="number"
                step="0.000001"
                required
                placeholder="-122.4194"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Marcus Vance"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="e.g. +1 (555) 982-4112"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
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
              {submitting ? 'Saving to Database...' : 'Register Location'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT LOCATION */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !submitting && setIsEditModalOpen(false)}
        title="Edit Network Node"
        subtitle={`Update attributes for ${activeLocation?.name || 'Selected Facility'}`}
        icon={Edit2}
        maxWidth="max-w-xl"
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
            <label className="text-slate-700 font-bold block mb-1">Facility / Location Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Facility Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-medium"
              >
                {LOCATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Current Population Served</label>
              <input
                type="number"
                min="0"
                value={formData.population}
                onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Total Capacity</label>
              <input
                type="number"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Latitude *</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Longitude *</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-bold block mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
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
              {submitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VIEW LOCATION DETAILS */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Location Dossier"
        subtitle={activeLocation?.name || 'Detailed Operational Metadata'}
        icon={Eye}
        maxWidth="max-w-lg"
      >
        {activeLocation && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Facility ID</span>
              <span className="font-mono font-bold text-slate-900">LOC-{String(activeLocation.id).padStart(4, '0')}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Node Type</span>
                <span className="text-sm font-extrabold text-cyan-800">
                  {getTypeMeta(activeLocation.type).label}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Status</span>
                <span className="text-sm font-extrabold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Operational
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Population Impact</span>
                <span className="font-extrabold text-slate-900">{Number(activeLocation.population || 0).toLocaleString()} people</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Daily Food Capacity</span>
                <span className="font-extrabold text-slate-900">{Number(activeLocation.capacity || 0).toLocaleString()} servings</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Coordinates</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {activeLocation.latitude}, {activeLocation.longitude}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Point of Contact</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Authorized Contact</span>
                <span className="font-bold text-slate-900">{activeLocation.contact_person || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Phone Support</span>
                <a
                  href={`tel:${activeLocation.contact_phone}`}
                  className="font-mono font-bold text-cyan-600 hover:underline"
                >
                  {activeLocation.contact_phone || 'N/A'}
                </a>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <a
                href={`https://maps.google.com/?q=${activeLocation.latitude},${activeLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View on Google Maps
              </a>
              <Button variant="secondary" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: DELETE CONFIRMATION */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !submitting && setIsDeleteModalOpen(false)}
        title="Delete Location Record"
        subtitle="Confirm decommissioning of this facility node"
        icon={Trash2}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to permanently remove <strong className="text-slate-900">{activeLocation?.name}</strong> from the database?
          </p>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>
              This will remove the location and may affect any active food allocations or demand linked to this node.
            </span>
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
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Locations;
