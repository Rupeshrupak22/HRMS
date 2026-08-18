'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Search,
  Calendar,
  Filter,
  Eye,
  X,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  RotateCw,
  UserCheck,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export default function AllDailyReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const PAGE_SIZE = 20;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/reports/daily');
      const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      setReports(list);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const specialistCounts = useMemo(() => {
    return {
      aravind: reports.filter((r) => r.userEmail === 'aravind@adyapan.com' || (r.employeeName || '').toLowerCase().includes('aravind')).length,
      nitisha: reports.filter((r) => r.userEmail === 'nitisha@adyapan.com' || (r.employeeName || '').toLowerCase().includes('nitisha')).length,
      pavitra: reports.filter((r) => r.userEmail === 'pavitra@adyapan.com' || (r.employeeName || '').toLowerCase().includes('pavitra')).length,
      charitha: reports.filter((r) => r.userEmail === 'charitha@adyapan.com' || (r.employeeName || '').toLowerCase().includes('charitha')).length,
      veena: reports.filter((r) => r.userEmail === 'veena@adyapan.com' || (r.employeeName || '').toLowerCase().includes('veena')).length,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.employeeName || '').toLowerCase().includes(q) ||
        (r.userEmail || '').toLowerCase().includes(q) ||
        (r.role || '').toLowerCase().includes(q) ||
        (r.keyUpdates || '').toLowerCase().includes(q) ||
        (r.tasksCompleted || '').toLowerCase().includes(q) ||
        (r.issue || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q);

      let matchesSpecialist = true;
      if (selectedSpecialist !== 'ALL') {
        const specEmail = selectedSpecialist.toLowerCase();
        matchesSpecialist =
          (r.userEmail || '').toLowerCase() === specEmail ||
          (r.employeeName || '').toLowerCase().includes(selectedSpecialist.split('@')[0]);
      }

      const reportDate = r.date || (r.createdAt ? r.createdAt.split('T')[0] : '');
      const matchesDate = !selectedDate || reportDate === selectedDate;

      const matchesStatus =
        selectedStatus === 'ALL' || (r.status || 'SUBMITTED').toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesSpecialist && matchesDate && matchesStatus;
    });
  }, [reports, searchTerm, selectedSpecialist, selectedDate, selectedStatus]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSpecialist, selectedDate, selectedStatus]);

  // Paginated slice (max 20 per page)
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(start, start + PAGE_SIZE);
  }, [filteredReports, currentPage]);

  const exportCSV = () => {
    const headers = ['Employee Name', 'Email', 'Specialization/Role', 'Date', 'Key Tasks & Updates', 'Issues/Blockers', 'Remarks/Comments', 'Status'];
    const rows = filteredReports.map((r) => [
      r.employeeName || 'Staff',
      r.userEmail || '-',
      r.role || '-',
      r.date || (r.createdAt ? r.createdAt.split('T')[0] : '-'),
      r.keyUpdates || r.tasksCompleted || '-',
      r.issue || r.blockers || '-',
      r.comment || '-',
      r.status || 'SUBMITTED',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HR_Specialist_Daily_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-indigo-400" />
            <span>All Daily Reports Master Hub</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Real-time live aggregation of daily reports submitted by all 5 HR Specialists
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Refresh Reports"
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

      {/* Specialist KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          { key: 'aravind@adyapan.com', name: 'Aravind', role: 'Resignation & Exit', count: specialistCounts.aravind, color: 'text-sky-600', href: '/reports/aravind' },
          { key: 'veena@adyapan.com', name: 'Veena', role: 'Onboarding & ATS', count: specialistCounts.veena, color: 'text-amber-600', href: '/reports/veena' },
          { key: 'nitisha@adyapan.com', name: 'Nitisha', role: 'Discipline & POSH', count: specialistCounts.nitisha, color: 'text-purple-600', href: '/reports/nitisha' },
          { key: 'pavitra@adyapan.com', name: 'Pavitra', role: 'Attendance & Leave', count: specialistCounts.pavitra, color: 'text-emerald-600', href: '/reports/pavitra' },
          { key: 'charitha@adyapan.com', name: 'Charitha', role: 'Salary & Payroll', count: specialistCounts.charitha, color: 'text-rose-600', href: '/reports/charitha' },
        ].map((s) => {
          const isSelected = selectedSpecialist === s.key;
          return (
            <div
              key={s.name}
              onClick={() => setSelectedSpecialist(isSelected ? 'ALL' : s.key)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs hover:shadow-md ${
                isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{s.name}</span>
                <span className={`text-xs font-black ${s.color}`}>{s.count} Logs</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.role}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-indigo-600">
                <span>{isSelected ? 'Filtered' : 'Filter by ' + s.name}</span>
                <Link href={s.href} onClick={(e) => e.stopPropagation()} className="text-slate-400 hover:text-slate-700 underline">
                  Full Page →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports by specialist, tasks, updates, issues..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
            />
          </div>

          {/* Specialist Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Specialist:</span>
            <select
              value={selectedSpecialist}
              onChange={(e) => setSelectedSpecialist(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Specialists</option>
              <option value="aravind@adyapan.com">Aravind (Exit & Resignation)</option>
              <option value="veena@adyapan.com">Veena (Onboarding & ATS)</option>
              <option value="nitisha@adyapan.com">Nitisha (Discipline & POSH)</option>
              <option value="pavitra@adyapan.com">Pavitra (Attendance & Leave)</option>
              <option value="charitha@adyapan.com">Charitha (Salary & Payroll)</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">APPROVED</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {(searchTerm || selectedSpecialist !== 'ALL' || selectedDate || selectedStatus !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecialist('ALL');
              setSelectedDate('');
              setSelectedStatus('ALL');
            }}
            className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Specialist / Name</th>
                <th className="py-3.5 px-4">Role / Domain</th>
                <th className="py-3.5 px-4">Report Date</th>
                <th className="py-3.5 px-4 min-w-[280px]">Key Tasks & Completed Updates</th>
                <th className="py-3.5 px-4 min-w-[180px]">Issues / Blockers</th>
                <th className="py-3.5 px-4 min-w-[180px]">Remarks / Follow-up</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Loading Daily Reports...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching daily reports found.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((r) => {
                  const dateVal = r.date || (r.createdAt ? r.createdAt.split('T')[0] : '-');
                  const statusVal = r.status || 'SUBMITTED';
                  const isApproved = statusVal === 'APPROVED';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      className="hover:bg-indigo-50/30 transition-colors group cursor-pointer text-slate-700"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {r.employeeName || 'Specialist'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.userEmail || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                          {r.role || 'HR Specialist'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {dateVal}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="line-clamp-2 text-slate-800 font-medium leading-relaxed">
                          {r.keyUpdates || r.tasksCompleted || 'Regular daily tasks completed.'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="line-clamp-2 text-rose-700 font-medium">
                          {r.issue || r.blockers || '-'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="line-clamp-2 text-slate-600">
                          {r.comment || '-'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : statusVal === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isApproved ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                          {statusVal}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReport(r);
                          }}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="View Full Report Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Universal Pagination (Max 20 per page) */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredReports.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Full Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                  <ClipboardList className="w-5 h-5 text-indigo-400" />
                  {selectedReport.employeeName || 'Specialist Report'}
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {selectedReport.role || 'HR Specialist'} • Date: {selectedReport.date || (selectedReport.createdAt?.split('T')[0])}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted By</span>
                  <strong className="text-slate-900 font-bold">{selectedReport.userEmail || '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <span className="font-bold text-indigo-600">{selectedReport.status || 'SUBMITTED'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Key Tasks & Updates</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.keyUpdates || selectedReport.tasksCompleted || 'No task notes.'}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Issues & Blockers</h4>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-200 text-rose-900 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedReport.issue || selectedReport.blockers || 'None reported.'}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Remarks & Next Steps</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.comment || 'No additional comments.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
