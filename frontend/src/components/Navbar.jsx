import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  LogOut,
  Sun,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const pageTitles = {
  '/dashboard': 'Operations Command Center',
  '/food-stock': 'Surplus Food Inventory & Expiry',
  '/demand': 'Shelter & Community Demand',
  '/locations': 'Network Hubs & Locations',
  '/vehicles': 'Cold-Chain Fleet Logistics',
  '/allocation': 'Smart Allocation Optimization Engine',
  '/map': 'Geospatial Radar & Live Map',
  '/alerts': 'Spoilage & Urgency Alerts',
  '/history': 'Impact Ledger & Landfill Diversion',
  '/admin': 'System Administration & Algorithm Tuning',
};

export const Navbar = ({ onOpenSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/alerts');
      if (res.data?.success) {
        const count = res.data.unread_count ?? (res.data.data?.filter((a) => !a.is_read)?.length || 0);
        setUnreadCount(count);
      }
    } catch (err) {
      // Quiet fail if backend warming up
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    const handleUpdate = () => fetchUnreadCount();
    window.addEventListener('alerts-updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('alerts-updated', handleUpdate);
    };
  }, []);

  const currentTitle = pageTitles[location.pathname] || 'Smart Food Allocation';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-17 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between gap-4 shadow-xs">
      {/* Left side: Hamburger (mobile) & Title */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-bold text-slate-900 truncate">
              {currentTitle}
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search network resources..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-500/10 transition-all"
          />
        </div>
      </div>

      {/* Right side: Hackathon Badge, Alerts, User & Logout */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        {/* Hack Odyssey Theme Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700">
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Hack Odyssey 4.0</span>
          <span className="text-cyan-600 font-bold">&bull; Light</span>
        </div>

        {/* Quick Launch Allocation */}
        <Link
          to="/allocation"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-sm shadow-cyan-500/20 border border-cyan-400/40 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Run Matcher</span>
        </Link>

        {/* Notifications Icon with Dynamic Badge */}
        <Link
          to="/alerts"
          id="navbar-alerts-btn"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title={unreadCount > 0 ? `Incident Alerts (${unreadCount} unread)` : 'Incident Alerts'}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              id="navbar-alerts-badge"
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-100 to-emerald-100 text-cyan-800 border border-cyan-300/80 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name[0] : 'U'}
          </div>

          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {user?.name || 'Coordinator'}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">Online</div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
