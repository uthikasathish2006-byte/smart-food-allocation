import React from 'react';

export const LoadingSpinner = ({ size = 'md', message = 'Processing data...', className = '' }) => {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 gap-3 ${className}`}>
      <div className="relative">
        <div
          className={`${sizeMap[size] || sizeMap.md} rounded-full border-slate-200 border-t-cyan-500 border-r-emerald-500 animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizeMap[size] || sizeMap.md} rounded-full border-transparent border-b-cyan-400 blur-[2px] opacity-70 animate-spin`}
        />
      </div>
      {message && (
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {message}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
