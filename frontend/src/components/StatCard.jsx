import React from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  unit = '',
  icon: Icon,
  trend,
  trendDirection = 'up',
  accent = 'cyan', // 'cyan' | 'emerald' | 'amber' | 'indigo' | 'rose'
  subtitle,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
}) => {
  const accentStyles = {
    cyan: {
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      highlight: 'text-cyan-600',
      borderHover: 'hover:border-cyan-300',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      highlight: 'text-emerald-600',
      borderHover: 'hover:border-emerald-300',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      highlight: 'text-amber-600',
      borderHover: 'hover:border-amber-300',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      highlight: 'text-indigo-600',
      borderHover: 'hover:border-indigo-300',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      highlight: 'text-rose-600',
      borderHover: 'hover:border-rose-300',
    },
  };

  const style = accentStyles[accent] || accentStyles.cyan;
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <div
      className={`p-5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group ${style.borderHover} ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${style.iconBg}`}
            >
              <Icon className="w-4 h-4 stroke-[2.2]" />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-2 flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
            <span className="text-xs font-medium">Fetching real metrics...</span>
          </div>
        ) : hasValue ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && (
              <span className="text-xs font-medium text-slate-500">
                {unit}
              </span>
            )}
          </div>
        ) : (
          <div className="py-1">
            <span className="text-sm font-semibold text-slate-400 italic">
              {emptyMessage}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        {subtitle ? (
          <span className="text-slate-500 text-[11px] truncate">
            {subtitle}
          </span>
        ) : (
          <span className="text-slate-400 text-[11px]">System Metric</span>
        )}

        {trend && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              trendDirection === 'up'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {trendDirection === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
