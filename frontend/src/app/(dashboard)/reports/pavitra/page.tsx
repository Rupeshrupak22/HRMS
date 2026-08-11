'use client';

import React from 'react';
import { FileText } from 'lucide-react';

export default function PavithraReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-500" />
          <span>Pavitra&apos;s Daily Reports</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Attendance & Leave specialist — daily activity reports
        </p>
      </div>
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500">Pavitra&apos;s portal will be connected once built. Reports will appear here.</p>
      </div>
    </div>
  );
}
