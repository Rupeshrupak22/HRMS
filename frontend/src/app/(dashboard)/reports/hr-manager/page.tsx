'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Eye,
  X,
  CheckCircle2,
  Search,
  Download,
  RotateCw,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export default function HRManagerReportPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const PAGE_SIZE = 20;

  const canView =
    (user?.role as any) === 'SUPER_ADMIN' ||
    (user?.role as any) === 'HR_ADMIN' ||
    (user?.role as any) === 'ADMIN' ||
    user?.specialization === 'HR_MANAGER_ALL' ||
    user?.email === 'superadmin@adyapan.com' ||
    user?.email === 'admin@adyapan.com' ||
    user?.email === 'nandini@adyapan.com' ||
    user?.email === 'nandani@adyapan.com';

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/overall-report').catch(() =>
        fetch('http://localhost:4000/api/v1/overall-report').then((r) => r.json())
      );
      const list = Array.isArray(res) ? res : res?.data && Array.isArray(res.data) ? res.data : [];
      setReports(list);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.submittedBy || '').toLowerCase().includes(q) ||
        (r.remarks || '').toLowerCase().includes(q) ||
        (r.aravindSummary || '').toLowerCase().includes(q) ||
        (r.nitishaSummary || '').toLowerCase().includes(q) ||
        (r.veenaSummary || '').toLowerCase().includes(q) ||
        (r.charithaSummary || '').toLowerCase().includes(q) ||
        (r.pavitraSummary || '').toLowerCase().includes(q);

      const matchesDate = !filterDate || r.reportDate === filterDate;
      return matchesSearch && matchesDate;
    });
  }, [reports, searchTerm, filterDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, currentPage]);

  if (!canView) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm text-red-600 font-bold">Access Denied. Only HR Manager & Admins can view this report view.</p>
      </div>
    );
  }

  const exportCSV = () => {
    const headers = ['Report Date', 'Submitted By', 'Status', 'Total Records', 'Aravind', 'Nitisha', 'Veena', 'Charitha', 'Pavitra', 'Remarks'];
    const rows = filteredReports.map((r) => [
      r.reportDate || '-',
      r.submittedBy || 'HR Manager',
      r.status || 'SUBMITTED',
      r.totalRecords || 0,
      r.aravindSummary || '-',
      r.nitishaSummary || '-',
      r.veenaSummary || '-',
      r.charithaSummary || '-',
      r.pavitraSummary || '-',
      r.remarks || '-',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HR_Manager_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>HR Manager Overall Reports Hub</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Executive overview of consolidated reports submitted by Biradar Nandini (HR Manager)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by specialist details, remarks, keywords..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {(searchTerm || filterDate) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterDate('');
            }}
            className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
          Loading HR Manager Reports...
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200">
          No consolidated HR manager reports found.
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReports.map((r) => (
            <div key={r.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <span className="text-sm font-extrabold text-slate-900">{r.submittedBy || 'Biradar Nandini'}</span>
                  <span className="text-xs text-slate-400 ml-3 font-mono">Date: <strong className="text-slate-800 font-bold">{r.reportDate}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                    {r.status || 'SUBMITTED'}
                  </span>
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> Full Report Preview
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Work Records</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{r.totalRecords || 0}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Daily Report Logs</div>
                  <div className="text-xl font-black text-emerald-600 mt-0.5">{r.totalDailyReports || 0}</div>
                </div>
              </div>

              <div className="space-y-2 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-2 py-1.5 border-b border-slate-200/60">
                  <span className="text-sky-700 font-bold w-28 shrink-0">Aravind (Exit):</span>
                  <span className="text-slate-700 font-medium">{r.aravindSummary || '-'}</span>
                </div>
                <div className="flex items-start gap-2 py-1.5 border-b border-slate-200/60">
                  <span className="text-purple-700 font-bold w-28 shrink-0">Nitisha (POSH):</span>
                  <span className="text-slate-700 font-medium">{r.nitishaSummary || '-'}</span>
                </div>
                <div className="flex items-start gap-2 py-1.5 border-b border-slate-200/60">
                  <span className="text-amber-700 font-bold w-28 shrink-0">Veena (ATS):</span>
                  <span className="text-slate-700 font-medium">{r.veenaSummary || '-'}</span>
                </div>
                <div className="flex items-start gap-2 py-1.5 border-b border-slate-200/60">
                  <span className="text-rose-700 font-bold w-28 shrink-0">Charitha (Payroll):</span>
                  <span className="text-slate-700 font-medium">{r.charithaSummary || '-'}</span>
                </div>
                <div className="flex items-start gap-2 py-1.5">
                  <span className="text-emerald-700 font-bold w-28 shrink-0">Pavitra (Leaves):</span>
                  <span className="text-slate-700 font-medium">{r.pavitraSummary || '-'}</span>
                </div>
              </div>

              {r.remarks && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900">Manager Remarks:</span> <span className="text-amber-800">{r.remarks}</span>
                </div>
              )}
            </div>
          ))}

          {/* Universal Pagination */}
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredReports.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  HR Manager Full Consolidated Report
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Submitted by {selectedReport.submittedBy || 'Biradar Nandini'} • Date: {selectedReport.reportDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-sky-700 block mb-1">Aravind (Resignation & Exit)</span>
                  <p className="text-slate-800">{selectedReport.aravindSummary || 'No data'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-purple-700 block mb-1">Nitisha (Discipline & POSH)</span>
                  <p className="text-slate-800">{selectedReport.nitishaSummary || 'No data'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-amber-700 block mb-1">Veena (Onboarding & ATS)</span>
                  <p className="text-slate-800">{selectedReport.veenaSummary || 'No data'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-rose-700 block mb-1">Charitha (Salary & Payroll)</span>
                  <p className="text-slate-800">{selectedReport.charithaSummary || 'No data'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-700 block mb-1">Pavitra (Attendance & Leave)</span>
                  <p className="text-slate-800">{selectedReport.pavitraSummary || 'No data'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
