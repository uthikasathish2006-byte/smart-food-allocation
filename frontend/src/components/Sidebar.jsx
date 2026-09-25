import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  HeartHandshake,
  Truck,
  Sparkles,
  Map as MapIcon,
  Bell,
  History,
  Settings,
  LogOut,
  X,
  Wheat,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Food Allocation', path: '/allocation', icon: Sparkles, highlight: true },
    { name: 'Food Inventory', path: '/food-stock', icon: Package, badge: 'Stock' },
    { name: 'Locations', path: '/locations', icon: MapPin },
    { name: 'Demand', path: '/demand', icon: HeartHandshake, badge: 'Needs' },
    { name: 'Vehicles', path: '/vehicles', icon: Truck, badge: 'Fleet' },
    { name: 'Live Map', path: '/map', icon: MapIcon },
    { name: 'Alerts', path: '/alerts', icon: Bell, alertCount: unreadCount },
    { name: 'Reports & History', path: '/history', icon: History },
    { name: 'Admin Settings', path: '/admin', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white/95 backdrop-blur-xl border-r border-slate-200/90 shadow-sm flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-68'}`}
      >
        {/* Header / Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 min-h-[4.25rem]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center shadow-md shadow-cyan-500/20 text-slate-950 flex-shrink-0">
              <Wheat className="w-5 h-5 stroke-[2.4]" />
            </div>

            {!isCollapsed && (
              <div className="truncate animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Smart Food <span className="text-cyan-600">Alloc</span>
                  </h1>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-100/70 text-cyan-800 border border-cyan-200">
                    4.0
                  </span>
                </div>
                <div className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  SDG 2 &bull; Hack Odyssey
                </div>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations Center
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  `flex items-center ${
                    isCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 shadow-md shadow-cyan-500/25 border border-cyan-400/50'
                        : 'bg-cyan-50/90 text-cyan-800 border-l-4 border-cyan-500 shadow-xs'
                      : item.highlight
                      ? 'text-cyan-700 hover:bg-cyan-50/70 border border-cyan-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? item.highlight
                              ? 'text-slate-950'
                              : 'text-cyan-600'
                            : item.highlight
                            ? 'text-cyan-600'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!isCollapsed && (
                      <div>
                        {item.alertCount ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                            {item.alertCount}
                          </span>
                        ) : item.badge ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div
            className={`p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-100 to-emerald-100 text-cyan-800 font-bold flex items-center justify-center border border-cyan-300/80 text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SL'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></div>
              </div>

              {!isCollapsed && (
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {user?.name || 'Dr. Sarah Lin'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {user?.role || 'Logistics Coordinator'}
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 flex-shrink-0"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
