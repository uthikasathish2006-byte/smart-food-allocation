import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from './Button';

export const AlertCard = ({
  title,
  message,
  severity = 'info', // 'critical' | 'warning' | 'info' | 'success'
  timestamp,
  source,
  actionLabel,
  onAction,
  onDismiss,
  className = '',
}) => {
  const normalizedSeverity = String(severity).toLowerCase();

  const severityStyles = {
    critical: {
      border: 'border-rose-300 hover:border-rose-400 bg-rose-50/40',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      titleColor: 'text-rose-950',
    },
    warning: {
      border: 'border-amber-300 hover:border-amber-400 bg-amber-50/30',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-950',
    },
    info: {
      border: 'border-cyan-300 hover:border-cyan-400 bg-cyan-50/30',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      icon: Info,
      iconColor: 'text-cyan-600',
      titleColor: 'text-cyan-950',
    },
    success: {
      border: 'border-emerald-300 hover:border-emerald-400 bg-emerald-50/30',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      titleColor: 'text-emerald-950',
    },
  };

  const style = severityStyles[normalizedSeverity] || severityStyles.info;
  const IconComponent = style.icon;

  return (
    <div
      className={`p-4 rounded-2xl bg-white/90 backdrop-blur-md border ${style.border} shadow-sm transition-all duration-200 flex flex-col sm:flex-row items-start justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className={`p-2 rounded-xl flex-shrink-0 bg-white border border-slate-200/80 shadow-xs ${style.iconColor}`}>
          <IconComponent className="w-4 h-4 stroke-[2.2]" />
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.badge}`}
            >
              {severity}
            </span>
            {source && (
              <span className="text-[11px] font-medium text-slate-500">
                {source}
              </span>
            )}
            {timestamp && (
              <span className="text-[11px] text-slate-400">
                &bull; {timestamp}
              </span>
            )}
          </div>

          <h4 className={`text-sm font-bold ${style.titleColor}`}>
            {title}
          </h4>

          {message && (
            <p className="text-xs text-slate-600 leading-relaxed">
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
        {actionLabel && onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            className="text-xs py-1.5 px-3"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
