import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F8FA] flex text-slate-900 antialiased selection:bg-cyan-500/20 selection:text-cyan-900">
      {/* Responsive Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>

        {/* Futuristic Light Footer */}
        <footer className="px-6 py-4 border-t border-slate-200/80 text-center text-xs text-slate-500 bg-white/70 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">Smart Food Allocation Optimization System</span>
            <span className="text-slate-400">&bull; Hack Odyssey 4.0</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            UN SDG 2: Zero Hunger Mission Platform &bull; Real-time Multi-Objective Logistics
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
