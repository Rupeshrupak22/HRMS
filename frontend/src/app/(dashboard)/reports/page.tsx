'use client';

import React from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function ReportsPage() {
  const reportTypes = [
    { title: 'Employee Lifecycle Report', desc: 'Active, probation, and joined statistics' },
    { title: 'Monthly Attendance & Overtime Register', desc: 'Late minutes, check-in timestamps, working hours' },
    { title: 'Leave Utilization & Balance Report', desc: 'Departmental leave encashments & balances' },
    { title: 'Payroll & Tax Deduction Statement', desc: 'Gross salary, PF, ESI, TDS, and Net disbursements' },
    { title: 'Recruitment & ATS Hiring Funnel', desc: 'Candidate match scores & interview conversion' },
    { title: 'Asset Inventory & Handover Audit', desc: 'Hardware allocations and return statuses' },
  ];

  const exportReport = (title: string, format: string) => {
    alert(`Exporting "${title}" in ${format} format... File download starting.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span>Reports & Analytics Export</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Export company HR, attendance, payroll & audit data to CSV, Excel & PDF
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((r, i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-white text-sm">{r.title}</div>
              <div className="text-slate-400 mt-1">{r.desc}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportReport(r.title, 'CSV')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Export CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => exportReport(r.title, 'PDF')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Export PDF"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
