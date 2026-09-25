import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  PackageX,
  Truck,
  Sparkles,
  CheckCheck,
  RotateCw,
  Search,
  Filter,
  Check,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    critical: 0,
    high: 0,
    medium: 0,
    info: 0,
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alerts');
      if (res.data?.success) {
        setAlerts(res.data.data || []);
        if (res.data.summary) {
          setStats(res.data.summary);
        } else {
          const list = res.data.data || [];
          setStats({
            total: list.length,
            unread: list.filter((a) => !a.is_read).length,
            critical: list.filter((a) => a.severity === 'critical').length,
            high: list.filter((a) => a.severity === 'high').length,
            medium: list.filter((a) => a.severity === 'medium').length,
            info: list.filter((a) => a.severity === 'info' || a.severity === 'low').length,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const showToast = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // PUT /api/alerts/:id/read: Mark individual alert as read
  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/alerts/${id}/read`);
      if (res.data?.success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
        );
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }));
        window.dispatchEvent(new Event('alerts-updated'));
        showToast(`Alert #${id} marked as read.`);
      }
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  // PUT /api/alerts/read-all: Mark all unread alerts as read
  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.put('/alerts/read-all');
      if (res.data?.success) {
        setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
        setStats((prev) => ({ ...prev, unread: 0 }));
        window.dispatchEvent(new Event('alerts-updated'));
        showToast('All alerts marked as read.');
      }
    } catch (err) {
      console.error('Error marking all alerts as read:', err);
    }
  };

  // Format created time into human-readable relative and local time
  const formatAlertTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper for alert icon based on category/type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'CRITICAL_DEMAND':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'FOOD_EXPIRING_SOON':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'STOCK_SHORTAGE':
        return <PackageX className="w-4 h-4 text-rose-600" />;
      case 'ALLOCATION_COMPLETED':
      case 'ALLOCATION_CONFIRMED':
      case 'MANUAL_OVERRIDE_CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'VEHICLE_UNAVAILABLE':
        return <Truck className="w-4 h-4 text-sky-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  // Helper for severity styling
  const getSeverityBadge = (severity) => {
    const sev = String(severity || '').toLowerCase();
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-50 text-sky-800 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            INFO
          </span>
        );
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    // 1. Severity or Unread Filter
    if (selectedFilter === 'UNREAD' && alert.is_read) return false;
    if (selectedFilter === 'CRITICAL' && alert.severity !== 'critical') return false;
    if (selectedFilter === 'HIGH' && alert.severity !== 'high') return false;
    if (selectedFilter === 'MEDIUM' && alert.severity !== 'medium') return false;
    if (selectedFilter === 'INFO' && alert.severity !== 'info' && alert.severity !== 'low') return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = alert.message?.toLowerCase().includes(q);
      const matchType = alert.type?.toLowerCase().includes(q);
      const matchLoc = alert.location_name?.toLowerCase().includes(q);
      return matchMsg || matchType || matchLoc;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-rose-600" />
            Priority Incident & Automated Alerts
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Real-time automated alerts for critical demand spikes, 48h perishable expiry, stock shortages, logistics constraints, and completed allocations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCw}
            isLoading={loading}
            onClick={fetchAlerts}
            title="Refresh alerts from database"
          >
            Refresh
          </Button>
          {stats.unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark All as Read ({stats.unread})
            </Button>
          )}
          <Link to="/allocation">
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              className="shadow-sm shadow-cyan-500/20"
            >
              Run Matcher
            </Button>
          </Link>
        </div>
      </div>

      {/* Toast Feedback */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL INCIDENTS
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {stats.total}
          </div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            Generated across network
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            UNREAD ALERTS
          </span>
          <div className="text-2xl font-black text-rose-700 mt-1">
            {stats.unread}
          </div>
          <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">
            Awaiting admin review
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            CRITICAL & HIGH
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {stats.critical + stats.high}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
            Urgent action needed
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200 shadow-2xs">
          <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider block">
            LOGISTICS & FLEET
          </span>
          <div className="text-2xl font-black text-cyan-900 mt-1">
            {stats.medium + stats.info}
          </div>
          <span className="text-[11px] text-cyan-700 font-medium mt-0.5 block">
            Vehicles & allocations
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'ALL', count: stats.total },
            { id: 'UNREAD', label: 'UNREAD', count: stats.unread },
            { id: 'CRITICAL', label: 'CRITICAL', count: stats.critical },
            { id: 'HIGH', label: 'HIGH', count: stats.high },
            { id: 'MEDIUM', label: 'MEDIUM', count: stats.medium },
            { id: 'INFO', label: 'INFO', count: stats.info },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedFilter === tab.id
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter messages or facility..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" message="Scanning database for real-time incidents..." />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All Caught Up"
          description={
            searchQuery
              ? `No alerts found matching "${searchQuery}".`
              : selectedFilter === 'UNREAD'
              ? 'No unread alerts! All network incidents have been reviewed.'
              : 'No active incident alerts in this category.'
          }
          actionLabel="REFRESH ALERTS"
          onAction={fetchAlerts}
        />
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isUnread = !alert.is_read;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-white border-rose-200/90 shadow-sm shadow-rose-500/5 hover:border-rose-300'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-white text-slate-600'
                }`}
              >
                {/* Left Side: Type Icon, Message, Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-2xs mt-0.5 ${
                      isUnread
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-100 border-slate-200/80 text-slate-400'
                    }`}
                  >
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    {/* Header Row: Severity, Type Tag, Location, Created Time, Read Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(alert.severity)}

                      {/* Read / Unread Status Badge */}
                      {isUnread ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100/80 text-rose-800 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                          UNREAD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <Check className="w-3 h-3 text-slate-400" />
                          READ
                        </span>
                      )}

                      {/* Created Time */}
                      <span
                        className="text-[11px] text-slate-400 font-mono flex items-center gap-1"
                        title={alert.created_at ? new Date(alert.created_at).toLocaleString() : ''}
                      >
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatAlertTime(alert.created_at)}
                      </span>

                      {/* Location Badge if available */}
                      {alert.location_name && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                          {alert.location_name}
                        </span>
                      )}
                    </div>

                    {/* Alert Message */}
                    <p
                      className={`text-xs md:text-sm leading-relaxed ${
                        isUnread ? 'text-slate-900 font-semibold' : 'text-slate-600 font-normal'
                      }`}
                    >
                      {alert.message}
                    </p>
                  </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0">
                  {/* Action Link to Matcher if applicable */}
                  {(alert.type === 'CRITICAL_DEMAND' ||
                    alert.type === 'STOCK_SHORTAGE' ||
                    alert.type === 'FOOD_EXPIRING_SOON') && (
                    <Link to="/allocation">
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Sparkles}
                        className="text-xs"
                      >
                        Allocate Food
                      </Button>
                    </Link>
                  )}

                  {/* Mark as Read Button */}
                  {isUnread ? (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Eye}
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="text-xs font-semibold hover:border-slate-300"
                    >
                      Mark as Read
                    </Button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium px-2 py-1">
                      Acknowledged
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
