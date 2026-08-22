'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  CalendarDays,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Send,
  ArrowRight,
  Sparkles,
  CheckCircle,
  XCircle,
  FileCheck,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

export function PavitraDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    async function loadPavitraReports() {
      try {
        const raw = await apiRequest('/reports/daily');
        const list = Array.isArray(raw) ? raw : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
        // Filter reports belonging to Pavitra / Attendance & Leave specialist
        const pavitraReports = list.filter((r: any) =>
          r.userEmail === 'pavitra@adyapan.com' ||
          r.specialization === 'ATTENDANCE_LEAVE' ||
          (r.employeeName || '').toLowerCase().includes('pavitra')
        );
        setReports(pavitraReports);
      } catch (err) {
        console.error('Failed to load Pavitra daily reports:', err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    }
    loadPavitraReports();
  }, []);

  const totalReports = reports.length;
  const approvedReports = reports.filter((r) => r.status === 'APPROVED').length;
  const pendingReports = reports.filter((r) => r.status !== 'APPROVED' && r.status !== 'REJECTED').length;
  const latestReport = reports.length > 0 ? reports[0] : null;

  const getStatusLabel = (status: string) => {
    if (status === 'APPROVED') return 'APPROVED';
    if (status === 'REJECTED') return 'REJECTED';
    return 'PENDING';
  };

  const parseReportMetrics = (report: any) => {
    if (!report) return { present: 0, absent: 0, late: 0, lop: 0, leavesApproved: 0, issues: '', lopUpdates: '', comment: '' };
    const text = `${report.keyUpdates || ''} ${report.comment || ''} ${report.issue || ''}`;
    const presMatch = text.match(/Present:\s*(\d+)/i);
    const absMatch = text.match(/Absent:\s*(\d+)/i);
    const lateMatch = text.match(/Late:\s*(\d+)/i);
    const lopMatch = text.match(/LOP:\s*(\d+)/i);
    const apprMatch = text.match(/Leaves Approved:\s*(\d+)/i) || text.match(/Approved:\s*(\d+)/i);

    const issuesMatch = text.match(/Issues Resolved:\s*([^.]+)/i);
    const lopUpMatch = text.match(/LOP Updates:\s*([^.]+)/i);

    return {
      present: presMatch ? parseInt(presMatch[1], 10) : (report.presentCount || 0),
      absent: absMatch ? parseInt(absMatch[1], 10) : (report.absentCount || 0),
      late: lateMatch ? parseInt(lateMatch[1], 10) : (report.lateCount || 0),
      lop: lopMatch ? parseInt(lopMatch[1], 10) : (report.lopCount || 0),
      leavesApproved: apprMatch ? parseInt(apprMatch[1], 10) : (report.leavesApproved || 0),
      issues: issuesMatch ? issuesMatch[1].trim() : (report.issue || report.attendanceIssuesResolved || ''),
      lopUpdates: lopUpMatch ? lopUpMatch[1].trim() : (report.lopUpdates || ''),
      comment: report.comment || report.remarks || '',
    };
  };

  const activeDateReport = selectedDate
    ? reports.find((r) => (r.date || r.createdAt?.split('T')[0]) === selectedDate)
    : (reports.find((r) => (r.date || r.createdAt?.split('T')[0]) === todayStr) || latestReport);

  const activeMetrics = parseReportMetrics(activeDateReport);

  const displayedReports = selectedDate
    ? reports.filter((r) => (r.date || r.createdAt?.split('T')[0]) === selectedDate)
    : reports;

  if (loading) {
    return <div className="p-10 text-center text-slate-400 text-sm">Loading Pavitra&apos;s report dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <span>Pavitra — Attendance & Leave Operations</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              SPECIALIST
            </span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Welcome back, {user?.firstName}. Daily attendance logs, leave approval reports, and LOP trackings.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Link href="/daily-reports" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer hover:bg-orange-50 transition-colors">
            <Send className="w-3.5 h-3.5" /> Submit Daily Report
          </Link>
          <Link href="/reports/pavitra" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors">
            <FileText className="w-3.5 h-3.5" /> View Full Report
          </Link>
        </div>
      </div>

      {/* Date Filter & Selector Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span className="font-extrabold text-slate-800">Filter Dashboard by Date:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-bold outline-none cursor-pointer"
          />
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            Yesterday
          </button>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="px-3 py-1.5 rounded-xl font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer"
            >
              Clear (All Dates)
            </button>
          )}
        </div>
      </div>

      {/* Specialist Report Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total Reports Submitted</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalReports}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Daily reports logged</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Approved Reports</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{approvedReports}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5 font-bold">Verified by HR Manager</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Pending Approval</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingReports}</div>
            <div className="text-[10px] text-amber-600 mt-0.5 font-bold">Awaiting review</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Latest Status</div>
            <div className="text-sm font-black text-slate-900 mt-2">
              {latestReport ? (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  latestReport.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : latestReport.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {getStatusLabel(latestReport.status)}
                </span>
              ) : (
                <span className="text-slate-400 font-normal">No report yet</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Most recent submission</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Daily Work Report Summary Card for Selected/Active Date */}
      {activeDateReport ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Daily Report Summary — {activeDateReport.date || (activeDateReport.createdAt ? activeDateReport.createdAt.split('T')[0] : 'Today')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted by {activeDateReport.employeeName || 'Pavitra (Attendance & Leave)'}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
              activeDateReport.status === 'APPROVED'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : activeDateReport.status === 'REJECTED'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              {getStatusLabel(activeDateReport.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <div className="text-xs text-emerald-800 font-semibold">Present</div>
              <div className="text-lg font-black text-emerald-700 mt-1">{activeMetrics.present}</div>
            </div>
            <div className="p-3 rounded-xl bg-red-50/50 border border-red-100">
              <div className="text-xs text-red-800 font-semibold">Absent</div>
              <div className="text-lg font-black text-red-700 mt-1">{activeMetrics.absent}</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-800 font-semibold">LOP</div>
              <div className="text-lg font-black text-gray-800 mt-1">{activeMetrics.lop}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
              <div className="text-xs text-amber-800 font-semibold">Late Login</div>
              <div className="text-lg font-black text-amber-700 mt-1">{activeMetrics.late}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
              <div className="text-xs text-blue-800 font-semibold">Leaves Approved</div>
              <div className="text-lg font-black text-blue-700 mt-1">{activeMetrics.leavesApproved}</div>
            </div>
          </div>

          {activeMetrics.issues && (
            <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-100 text-xs">
              <div className="font-bold text-orange-900">Attendance Issues Resolved:</div>
              <div className="text-slate-700 mt-0.5">{activeMetrics.issues}</div>
            </div>
          )}

          {activeMetrics.lopUpdates && (
            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-100 text-xs">
              <div className="font-bold text-red-900">LOP Updates:</div>
              <div className="text-slate-700 mt-0.5">{activeMetrics.lopUpdates}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">
            {selectedDate ? `No Daily Work Report Found for ${selectedDate}` : 'No Daily Work Report Submitted Yet'}
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Submit your daily attendance & leave report to log daily stats and resolution updates for HR Manager review.
          </p>
          <Link
            href="/daily-reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl saffron-gradient text-white text-xs font-bold shadow-md cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Submit Daily Report
          </Link>
        </div>
      )}

      {/* Date-Wise Submitted Reports History Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Pavitra&apos;s Date-Wise Submitted Daily Work Reports
            {selectedDate && <span className="text-xs text-orange-600 font-normal ml-2">({selectedDate})</span>}
          </h3>
          <Link
            href="/reports/pavitra"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            View Complete Report Page <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {displayedReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Reported Metrics</th>
                  <th className="px-4 py-3">Attendance Issues</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedReports.map((report) => {
                  const m = parseReportMetrics(report);
                  const rDate = report.date || (report.createdAt ? report.createdAt.split('T')[0] : '-');
                  return (
                    <tr key={report.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {rDate}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        Present: <strong className="text-emerald-600">{m.present}</strong> • Absent: <strong className="text-red-500">{m.absent}</strong> • Late: <strong className="text-amber-600">{m.late}</strong> • Leaves: <strong className="text-blue-600">{m.leavesApproved}</strong>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {m.issues || report.keyUpdates || 'No issues noted'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          report.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : report.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedDate(rDate)}
                          className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 font-bold text-[10px] cursor-pointer"
                        >
                          View Date
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            {selectedDate ? `No daily report found for ${selectedDate}.` : 'No daily report history found.'}
          </div>
        )}
      </div>

      {/* Operations Quick Links */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Pavitra&apos;s Quick Operations Hub</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <Link href="/employee-master" className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Employee Master</div>
              <div className="text-[10px] text-slate-500">Master Directory</div>
            </div>
          </Link>

          <Link href="/employees" className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Employees</div>
              <div className="text-[10px] text-slate-500">View Directory</div>
            </div>
          </Link>

          <Link href="/attendance" className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Attendance</div>
              <div className="text-[10px] text-slate-500">Attendance Logs</div>
            </div>
          </Link>

          <Link href="/leaves" className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Leaves</div>
              <div className="text-[10px] text-slate-500">Leave Requests</div>
            </div>
          </Link>

          <Link href="/daily-reports" className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Daily Reports</div>
              <div className="text-[10px] text-slate-500">Submit Daily Work</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}


