import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  Sparkles,
  Layers,
  Calendar,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

const CATEGORIES = [
  'ALL',
  'Prepared Meals',
  'Fresh Produce',
  'Baked Goods',
  'Dairy',
  'Canned Goods',
  'Beverages',
  'Other',
];

const EXPIRY_STATUS_OPTIONS = ['ALL', 'GOOD', 'EXPIRING_SOON', 'EXPIRED'];

export const FoodStock = () => {
  const [stockList, setStockList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // Form State
  const initialForm = {
    food_name: '',
    category: 'Prepared Meals',
    quantity: '',
    unit: 'kg',
    expiry_date: '',
    location_id: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch food stock from backend API (PostgreSQL single source of truth)
  const fetchFoodStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/food');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setStockList(res.data.data);
      } else {
        setStockList([]);
      }
    } catch (err) {
      console.error('Failed to fetch food stock from API:', err);
      setError(err.response?.data?.message || 'Failed to connect to Food Stock API service.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered locations for select dropdown
  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLocations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load locations for food dropdown:', err);
    }
  };

  useEffect(() => {
    fetchFoodStock();
    fetchLocations();
  }, []);

  const showFeedback = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    // Default expiry 24h in the future
    const defaultExpiry = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16);
    setFormData({
      ...initialForm,
      expiry_date: defaultExpiry,
      location_id: locations.length > 0 ? locations[0].id.toString() : '1',
    });
    setFormErrors([]);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setActiveItem(item);
    const formattedDate = item.expiry_date
      ? new Date(item.expiry_date).toISOString().slice(0, 16)
      : '';
    setFormData({
      food_name: item.food_name || '',
      category: item.category || 'Prepared Meals',
      quantity: item.quantity?.toString() || '',
      unit: item.unit || 'kg',
      expiry_date: formattedDate,
      location_id: item.location_id?.toString() || '1',
    });
    setFormErrors([]);
    setIsEditModalOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (item) => {
    setActiveItem(item);
    setIsDetailModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (item) => {
    setActiveItem(item);
    setIsDeleteModalOpen(true);
  };

  // Submit Add Food
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    setSubmitting(true);

    try {
      const payload = {
        food_name: formData.food_name.trim(),
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit.trim(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        location_id: parseInt(formData.location_id, 10),
      };

      const res = await api.post('/food', payload);
      if (res.data?.success) {
        setIsAddModalOpen(false);
        showFeedback(`"${payload.food_name}" successfully recorded in inventory!`);
        await fetchFoodStock();
      }
    } catch (err) {
      console.error('Error creating food item:', err);
      const errList = err.response?.data?.errors;
      if (Array.isArray(errList) && errList.length > 0) {
        setFormErrors(errList);
      } else {
        setFormErrors([err.response?.data?.message || 'Failed to create food item']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Food
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    setFormErrors([]);
    setSubmitting(true);

    try {
      const payload = {
        food_name: formData.food_name.trim(),
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit.trim(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        location_id: parseInt(formData.location_id, 10),
      };

      const res = await api.put(`/food/${activeItem.id}`, payload);
      if (res.data?.success) {
        setIsEditModalOpen(false);
        showFeedback(`"${payload.food_name}" updated successfully!`);
        await fetchFoodStock();
      }
    } catch (err) {
      console.error('Error updating food item:', err);
      const errList = err.response?.data?.errors;
      if (Array.isArray(errList) && errList.length > 0) {
        setFormErrors(errList);
      } else {
        setFormErrors([err.response?.data?.message || 'Failed to update food item']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Food
  const handleDeleteConfirm = async () => {
    if (!activeItem) return;
    setSubmitting(true);

    try {
      const res = await api.delete(`/food/${activeItem.id}`);
      if (res.data?.success) {
        setIsDeleteModalOpen(false);
        showFeedback(`Batch #${activeItem.id} (${activeItem.food_name}) removed from database.`);
        await fetchFoodStock();
      }
    } catch (err) {
      console.error('Error deleting food item:', err);
      alert(err.response?.data?.message || 'Failed to delete food item.');
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side filtering across live PostgreSQL dataset
  const filteredStock = useMemo(() => {
    return stockList.filter((item) => {
      const matchesCategory =
        selectedCategory === 'ALL' || item.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'ALL' || item.expiry_status === selectedStatus;

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        item.food_name?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.location_name?.toLowerCase().includes(term);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [stockList, selectedCategory, selectedStatus, searchTerm]);

  // Aggregate statistics
  const metrics = useMemo(() => {
    const total = stockList.length;
    const good = stockList.filter((i) => i.expiry_status === 'GOOD').length;
    const expiringSoon = stockList.filter((i) => i.expiry_status === 'EXPIRING_SOON').length;
    const expired = stockList.filter((i) => i.expiry_status === 'EXPIRED').length;
    const totalQty = stockList.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
    return { total, good, expiringSoon, expired, totalQty };
  }, [stockList]);

  // Expiry badge render helper - strict adherence to EXPIRED, EXPIRING_SOON, GOOD
  const renderExpiryBadge = (status) => {
    switch (status) {
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            EXPIRED
          </span>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            EXPIRING_SOON
          </span>
        );
      case 'GOOD':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            GOOD
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-600" />
            Food Stock Inventory
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Live database-connected inventory tracking perishable batches, shelf-life, and expiry status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            onClick={fetchFoodStock}
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
            Add Food Item
          </Button>
        </div>
      </div>

      {/* Action Success Toast */}
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
          <Button variant="secondary" size="xs" onClick={fetchFoodStock}>
            Retry Connection
          </Button>
        </div>
      )}

      {/* Status KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Food Stock</span>
          <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">{metrics.totalQty.toLocaleString()} total units</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Status: GOOD</span>
          <span className="text-2xl font-black text-emerald-700">{metrics.good}</span>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Optimal shelf life</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">EXPIRING_SOON</span>
          <span className="text-2xl font-black text-amber-700">{metrics.expiringSoon}</span>
          <span className="text-[11px] text-amber-600 font-semibold block mt-0.5">Under 24h remaining</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Status: EXPIRED</span>
          <span className="text-2xl font-black text-rose-700">{metrics.expired}</span>
          <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">Non-distributable</span>
        </div>
      </div>

      {/* Search and Category Filter Controls */}
      <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by food name, donor/location, or category..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
            />
          </div>

          {/* Expiry Status Filter Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Status:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {EXPIRY_STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedStatus === st
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-xs shadow-cyan-500/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Card Grid */}
      {loading ? (
        <div className="p-12 bg-white/80 rounded-2xl border border-slate-200 flex justify-center">
          <LoadingSpinner size="lg" message="Loading food stock inventory from PostgreSQL..." />
        </div>
      ) : filteredStock.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Food Stock Records Found"
          description={
            searchTerm
              ? `No inventory items matched "${searchTerm}".`
              : 'No items currently in inventory matching selected filters.'
          }
          actionLabel="Log New Food Batch"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStock.map((item) => {
            const isExpired = item.expiry_status === 'EXPIRED';
            const isExpiringSoon = item.expiry_status === 'EXPIRING_SOON';
            const expiryDateObj = new Date(item.expiry_date);
            const formattedExpiry = expiryDateObj.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      STOCK #{item.id}
                    </span>
                    {renderExpiryBadge(item.expiry_status)}
                  </div>

                  {/* Food Item Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-700 transition-colors mb-1 line-clamp-1">
                    {item.food_name}
                  </h3>

                  {/* Facility / Location */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                    <span className="truncate">{item.location_name || 'Regional Logistics Hub'}</span>
                  </div>

                  {/* Quantity & Expiry Attributes */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs mb-3">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Quantity</span>
                      <span className="text-base font-black text-slate-900">
                        {item.quantity} <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Expiry Time</span>
                      <span
                        className={`text-xs font-extrabold flex items-center gap-1 mt-0.5 ${
                          isExpired
                            ? 'text-rose-600'
                            : isExpiringSoon
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {item.hours_until_expiry !== undefined
                          ? item.hours_until_expiry > 0
                            ? `${item.hours_until_expiry}h left`
                            : 'Expired'
                          : formattedExpiry}
                      </span>
                    </div>
                  </div>

                  {/* Expiry Date Display */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Expiry: {formattedExpiry}
                    </span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenDetail(item)}
                    className="text-xs font-bold text-slate-600 hover:text-cyan-700 flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDelete(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Item"
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

      {/* MODAL 1: ADD FOOD STOCK */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !submitting && setIsAddModalOpen(false)}
        title="Log Surplus Food Batch"
        subtitle="Record perishable batch parameters for AI-driven zero-waste allocation"
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
            <label className="text-slate-700 font-bold block mb-1">Food Name / Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. 150 Portions Steamed Brown Rice & Lentils"
              value={formData.food_name}
              onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-medium"
              >
                {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Donor / Location Node *</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-medium"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 150"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Unit of Measure *</label>
              <input
                type="text"
                required
                placeholder="e.g. kg, meals, loaves, liters, crates"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Expiry Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
            />
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
              {submitting ? 'Writing to PostgreSQL...' : 'Save Food Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: EDIT FOOD STOCK */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !submitting && setIsEditModalOpen(false)}
        title="Edit Food Stock Record"
        subtitle={`Update inventory parameters for ${activeItem?.food_name || 'Selected Item'}`}
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
            <label className="text-slate-700 font-bold block mb-1">Food Name / Description *</label>
            <input
              type="text"
              required
              value={formData.food_name}
              onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-medium"
              >
                {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Donor / Location Node *</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-medium"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Quantity *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Unit of Measure *</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-bold block mb-1">Expiry Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none font-mono"
            />
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

      {/* MODAL 3: VIEW FOOD DETAILS */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Food Stock Dossier"
        subtitle={activeItem?.food_name || 'Inventory Batch Detail'}
        icon={Eye}
        maxWidth="max-w-lg"
      >
        {activeItem && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium">Batch Record ID</span>
              <span className="font-mono font-bold text-slate-900">STOCK-#{activeItem.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Category</span>
                <span className="text-sm font-extrabold text-cyan-800">{activeItem.category}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block mb-1">Expiry Status</span>
                <div className="mt-0.5">{renderExpiryBadge(activeItem.expiry_status)}</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Available Quantity</span>
                <span className="font-extrabold text-slate-900">
                  {activeItem.quantity} {activeItem.unit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Expiry Timestamp</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {new Date(activeItem.expiry_date).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Hours Until Expiry</span>
                <span className="font-bold text-slate-900">
                  {activeItem.hours_until_expiry !== undefined ? `${activeItem.hours_until_expiry} hours` : 'Calculated in PostgreSQL'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Location & Donor Node</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Facility Name</span>
                <span className="font-bold text-slate-900">{activeItem.location_name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Facility Type</span>
                <span className="font-bold text-slate-700">{activeItem.location_type || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Contact Person</span>
                <span className="font-semibold text-slate-800">{activeItem.contact_person || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Contact Phone</span>
                <span className="font-mono font-semibold text-slate-800">{activeItem.contact_phone || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end border-t border-slate-100">
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
        title="Delete Food Item"
        subtitle="Confirm deletion of food stock record from database"
        icon={Trash2}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to permanently remove batch <strong className="text-slate-900">#{activeItem?.id} ({activeItem?.food_name})</strong> from PostgreSQL?
          </p>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>This action cannot be undone.</span>
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

export default FoodStock;
