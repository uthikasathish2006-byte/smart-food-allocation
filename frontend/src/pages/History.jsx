import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Search,
  Sparkles,
  MapPin,
  Package,
  Layers,
  ArrowUpDown,
  Filter,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const History = () => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, CONFIRMED, OVERRIDDEN
  const [searchQuery, setSearchQuery] = useState('');
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    overridden: 0,
    total_quantity: 0,
  });

  // Fetch allocation history from PostgreSQL backend API
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Pass filter parameter to GET /api/history
      const params = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter.toLowerCase();
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await api.get('/history', { params });

      if (res.data?.success) {
        setHistoryList(res.data.data || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      } else {
        throw new Error(res.data?.message || 'Failed to fetch history');
      }
    } catch (err) {
      console.error('Error fetching allocation history:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load allocation history from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  // Client-side search for snappy typing feedback
  const filteredList = historyList.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchId = String(item.id).includes(q) || item.allocation_id.toLowerCase().includes(q);
    const matchFood = item.food.toLowerCase().includes(q);
    const matchLoc = item.location.toLowerCase().includes(q);
    const matchReason = item.override_reason && item.override_reason.toLowerCase().includes(q);
    const matchStatus = item.status.toLowerCase().includes(q);
    return matchId || matchFood || matchLoc || matchReason || matchStatus;
  });

  // Helper for Status Badge
  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'CONFIRMED' || s === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          CONFIRMED
        </span>
      );
    }
    if (s === 'OVERRIDDEN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-50 text-purple-800 border border-purple-200">
          <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
          OVERRIDDEN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        PENDING
      </span>
    );
  };

  // Helper for Date display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-cyan-600" />
            Allocation History & Audit Log
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Immutable PostgreSQL audit ledger of food redistribution missions, manual overrides, and priority scores.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCw}
            isLoading={loading}
            onClick={fetchHistory}
            title="Reload from PostgreSQL database"
          >
            Refresh
          </Button>

          <Link to="/allocation">
            <Button variant="primary" size="sm" icon={Sparkles} className="shadow-sm shadow-cyan-500/20">
              Run New Allocation
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL MISSIONS
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{summary.total}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {summary.total_quantity.toLocaleString()} units allocated
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            CONFIRMED
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">{summary.confirmed}</div>
          <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
            Successfully delivered
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
            OVERRIDDEN
          </span>
          <div className="text-2xl font-black text-purple-900 mt-1">{summary.overridden}</div>
          <span className="text-[11px] text-purple-700 font-medium mt-0.5 block">
            Admin modified quantity
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            PENDING
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1">{summary.pending}</div>
          <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
            Awaiting confirmation
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        {/* Status Filters: All, Pending, Confirmed, Overridden */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'All', count: summary.total },
            { id: 'PENDING', label: 'Pending', count: summary.pending },
            { id: 'CONFIRMED', label: 'Confirmed', count: summary.confirmed },
            { id: 'OVERRIDDEN', label: 'Overridden', count: summary.overridden },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  statusFilter === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by food, location, reason..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" message="Loading allocation history from PostgreSQL..." />
        </div>
      ) : error ? (
        <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-900">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchHistory} icon={RotateCw}>
            Retry Loading
          </Button>
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No Allocation Records Found"
          description={
            searchQuery
              ? `No records found matching "${searchQuery}".`
              : statusFilter !== 'ALL'
              ? `No allocations with status "${statusFilter}".`
              : 'No allocation missions recorded in PostgreSQL database yet.'
          }
          actionLabel="RUN OPTIMIZER"
          onAction={() => window.location.assign('/allocation')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Allocation ID</th>
                  <th className="py-3 px-4">Food</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Distance</th>
                  <th className="py-3 px-4 text-right">Priority Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Override Reason</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Allocation ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 text-[11px]">
                        #{item.id}
                      </span>
                    </td>

                    {/* Food */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 min-w-[160px]">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                        <span>{item.food}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{item.location}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal block pl-5">
                        {item.location_type?.replace(/_/g, ' ') || 'Facility'}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 font-black text-slate-900 text-right whitespace-nowrap">
                      {Number(item.quantity).toLocaleString()} <span className="text-[10px] font-medium text-slate-500">units</span>
                    </td>

                    {/* Distance */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 text-right whitespace-nowrap">
                      {item.distance}
                    </td>

                    {/* Priority Score */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        {Number(item.priority_score).toFixed(1)} pts
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Override Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {item.override_reason ? (
                        <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 text-[11px] leading-relaxed flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">{item.override_reason}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">
                          None (Standard Algorithmic)
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
