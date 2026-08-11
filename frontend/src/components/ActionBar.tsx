'use client';

import React, { useRef } from 'react';
import { RefreshCw, Upload, Download, Plus } from 'lucide-react';

interface ActionBarProps {
  onRefresh: () => void;
  onImportCSV?: (data: string) => void;
  onExport: () => void;
  onAdd: () => void;
  addLabel?: string;
}

export function ActionBar({ onRefresh, onImportCSV, onExport, onAdd, addLabel = 'Add Candidate / Daily Report' }: ActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onImportCSV?.(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onRefresh}
        className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refresh
      </button>
      <button
        onClick={handleImportClick}
        className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
      >
        <Upload className="w-3.5 h-3.5" />
        Import CSV
      </button>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
      <button
        onClick={onExport}
        className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-lg saffron-gradient text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}
