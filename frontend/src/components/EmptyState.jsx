import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No Data Available',
  description = 'There is currently no information to display.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 md:p-12 text-center rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-50 to-emerald-50 border border-cyan-200/60 text-cyan-600 flex items-center justify-center shadow-sm mb-4">
        <Icon className="w-7 h-7 stroke-[1.8] text-cyan-600" />
      </div>

      <h3 className="text-base font-bold text-slate-800 tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-5">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
