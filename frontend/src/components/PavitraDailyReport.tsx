'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  CalendarOff,
  ClipboardCheck,
  Sparkles,
  FileText,
} from 'lucide-react';

interface AttendanceStats {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  halfDay: number;
}

interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: string;
}

export function PavitraDailyReport() {
  const { user } = useAuth();
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 110,
    present: 94,
    absent: 5,
    late: 4,
    onLeave: 7,
    halfDay: 2,
  });

  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([
    { id: 'lv-1', employeeName: 'Anurag Rana', leaveType: 'Sick Leave', from: '2026-08-12', to: '2026-08-13', days: 2, reason: 'Medical appointment', status: 'PENDING' },
    { id: 'lv-2', employeeName: 'Arijit Paul', leaveType: 'Casual Leave', from: '2026-08-14', to: '2026-08-14', days: 1, reason: 'Personal work', status: 'PENDING' },
    { id: 'lv-3', employeeName: 'Ashish Kumar', leaveType: 'Earned Leave', from: '2026-08-18', to: '2026-08-20', days: 3, reason: 'Family function', status: 'PENDING' },
  ]);

  const [formData, setFormData] = useState({
    date: todayDate,
    presentCount: 94,
    absentCount: 5,
    lateCount: 4,
    onLeaveCount: 7,
    lopCount: 0,
    leavesApproved: 0,
    leavesRejected: 0,
    attendanceIssuesResolved: '',
    lopUpdates: '',
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attendanceData, leaveData, reportsData] = await Promise.allSettled([
        apiRequest('/attendance/today-stats'),
        apiRequest('/leave/requests?status=PENDING'),
        apiRequest('/reports/daily'),
      ]);

      if (attendanceData.status === 'fulfilled' && attendanceData.value) {
        const d = attendanceData.value?.data || attendanceData.value;
        if (d.totalEmployees) setStats(d);
      }

      if (leaveData.status === 'fulfilled') {
        const leaves = leaveData.value?.data || leaveData.value;
        if (Array.isArray(leaves) && leaves.length > 0) setPendingLeaves(leaves);
      }

      if (reportsData.status === 'fulfilled') {
        const reps = reportsData.value?.data || reportsData.value;
        if (Array.isArray(reps)) setReports(reps);
      }
    } catch {}
  };

  const handleLeaveAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      await apiRequest(`/leave/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setPendingLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
      if (action === 'approve') {
        setFormData((f) => ({ ...f, leavesApproved: f.leavesApproved + 1 }));
      } else {
        setFormData((f) => ({ ...f, leavesRejected: f.leavesRejected + 1 }));
      }
    } catch {
      setPendingLeaves((prev) => prev.map((l) => l.id === id ? { ...l, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : l));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tasksCompleted = `Attendance Summary — Present: ${formData.presentCount}, Absent: ${formData.absentCount}, Late: ${formData.lateCount}, On Leave: ${formData.onLeaveCount}, LOP: ${formData.lopCount}. Leaves Approved: ${formData.leavesApproved}, Rejected: ${formData.leavesRejected}. ${formData.attendanceIssuesResolved ? 'Issues Resolved: ' + formData.attendanceIssuesResolved + '.' : ''} ${formData.lopUpdates ? 'LOP Updates: ' + formData.lopUpdates + '.' : ''} ${formData.remarks ? 'Remarks: ' + formData.remarks : ''}`;

      await apiRequest('/reports/daily', {
        method: 'POST',
        body: JSON.stringify({
          date: formData.date,
          employeeName: `${user?.firstName || 'Pavitra'} (Attendance & Leave)`,
          keyUpdates: tasksCompleted,
          comment: formData.remarks || '',
          issue: formData.attendanceIssuesResolved || '',
        }),
      });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    }
  };

  const statCards = [
    { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { label: 'Present Today', value: stats.present, icon: UserCheck, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Absent', value: stats.absent, icon: UserX, color: 'bg-red-50 text-red-700 border-red-200' },
    { label: 'Late Arrivals', value: stats.late, icon: AlertTriangle, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'On Leave', value: stats.onLeave, icon: CalendarOff, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Half Day', value: stats.halfDay, icon: Clock, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            <span>Pavitra — Attendance & Leave Daily Report</span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Submit daily attendance summary, process leave approvals, and report LOP updates to Admin & HR Manager Nandini.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-xs text-xs font-bold text-white border border-white/30 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Today's Attendance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`p-4 rounded-2xl border ${card.color} space-y-1`}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wide">{card.label}</span>
              </div>
              <div className="text-2xl font-black">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Leave Approvals + Daily Report Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Pending Leave Approvals (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarOff className="w-4 h-4 text-orange-600" />
              <span>Pending Leave Approvals</span>
            </h2>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              {pendingLeaves.filter((l) => l.status === 'PENDING').length} Pending
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[400px]">
            {pendingLeaves.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No pending leave requests</p>
            ) : (
              pendingLeaves.map((leave) => (
                <div key={leave.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">{leave.employeeName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      leave.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : leave.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span>Type: <strong className="text-slate-800">{leave.leaveType}</strong></span>
                    <span>From: <strong className="text-slate-800">{leave.from}</strong></span>
                    <span>To: <strong className="text-slate-800">{leave.to}</strong></span>
                    <span>Days: <strong className="text-slate-800">{leave.days}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <strong>Reason:</strong> {leave.reason}
                  </div>
                  {leave.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-1 justify-end">
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'approve')}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'reject')}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Daily Attendance Report Form (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-orange-600" />
            <span>Submit Attendance & Leave Report</span>
          </h2>

          {submitSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Report submitted to Admin & HR Manager Nandini!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Report Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">LOP Count</label>
                <input
                  type="number"
                  value={formData.lopCount}
                  onChange={(e) => setFormData({ ...formData, lopCount: Number(e.target.value) })}
                  className="w-full bg-slate-50 text-slate-900 p-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Present</label>
                <input
                  type="number"
                  value={formData.presentCount}
                  onChange={(e) => setFormData({ ...formData, presentCount: Number(e.target.value) })}
                  className="w-full bg-emerald-50 text-emerald-900 p-2 rounded-xl border border-emerald-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Absent</label>
                <input
                  type="number"
                  value={formData.absentCount}
                  onChange={(e) => setFormData({ ...formData, absentCount: Number(e.target.value) })}
                  className="w-full bg-red-50 text-red-900 p-2 rounded-xl border border-red-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Late Arrivals</label>
                <input
                  type="number"
                  value={formData.lateCount}
                  onChange={(e) => setFormData({ ...formData, lateCount: Number(e.target.value) })}
                  className="w-full bg-amber-50 text-amber-900 p-2 rounded-xl border border-amber-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">On Leave</label>
                <input
                  type="number"
                  value={formData.onLeaveCount}
                  onChange={(e) => setFormData({ ...formData, onLeaveCount: Number(e.target.value) })}
                  className="w-full bg-blue-50 text-blue-900 p-2 rounded-xl border border-blue-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leaves Approved</label>
                <input
                  type="number"
                  value={formData.leavesApproved}
                  onChange={(e) => setFormData({ ...formData, leavesApproved: Number(e.target.value) })}
                  className="w-full bg-slate-50 text-slate-900 p-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leaves Rejected</label>
                <input
                  type="number"
                  value={formData.leavesRejected}
                  onChange={(e) => setFormData({ ...formData, leavesRejected: Number(e.target.value) })}
                  className="w-full bg-slate-50 text-slate-900 p-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Attendance Issues Resolved</label>
              <textarea
                value={formData.attendanceIssuesResolved}
                onChange={(e) => setFormData({ ...formData, attendanceIssuesResolved: e.target.value })}
                rows={2}
                placeholder="Biometric mismatch fixed, manual punch corrected..."
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">LOP Updates</label>
              <textarea
                value={formData.lopUpdates}
                onChange={(e) => setFormData({ ...formData, lopUpdates: e.target.value })}
                rows={2}
                placeholder="LOP deduction applied for 2 employees in Sales dept..."
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Additional Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                placeholder="Any additional notes for HR Manager..."
                className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl saffron-gradient text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Attendance & Leave Report</span>
            </button>
          </form>
        </div>
      </div>

      {/* Previously Submitted Reports */}
      {reports.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-600" />
            <span>My Submitted Reports</span>
          </h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {reports.map((rep: any) => (
              <div key={rep.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{rep.date}</span>
                  <span className="text-slate-500 ml-3">{rep.tasksCompleted?.substring(0, 100)}...</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  rep.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {rep.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
