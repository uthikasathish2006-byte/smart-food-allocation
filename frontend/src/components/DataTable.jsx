import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, PackageOpen } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  emptyTitle = 'No Records Found',
  emptyMessage = 'No matching data available at this time.',
  emptyIcon: EmptyIcon = PackageOpen,
  className = '',
  stickyHeader = true,
  onRowClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = row[k];
          return val ? String(val).toLowerCase().includes(term) : false;
        });
      }
      return Object.values(row).some((val) =>
        val ? String(val).toLowerCase().includes(term) : false
      );
    });
  }, [data, searchTerm, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const res = aVal > bVal ? 1 : -1;
      return sortConfig.direction === 'asc' ? res : -res;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div
      className={`rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* Optional Search / Header Bar */}
      {searchKeys.length > 0 && (
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white/60">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs font-medium text-slate-500">
            {sortedData.length} records
          </span>
        </div>
      )}

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead
            className={`border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold ${
              stickyHeader ? 'sticky top-0 z-10 backdrop-blur-md' : ''
            }`}
          >
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key || col.header}
                  onClick={() => col.sortable !== false && col.key && handleSort(col.key)}
                  className={`py-3.5 px-4 font-semibold select-none ${
                    col.sortable !== false && col.key
                      ? 'cursor-pointer hover:text-cyan-700'
                      : ''
                  } ${col.headerClassName || ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5 text-cyan-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-cyan-600" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <LoadingSpinner message="Loading records..." />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10">
                  <EmptyState
                    icon={EmptyIcon}
                    title={emptyTitle}
                    description={emptyMessage}
                  />
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-cyan-50/40' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key || col.header}
                      className={`py-3.5 px-4 align-middle ${col.className || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
