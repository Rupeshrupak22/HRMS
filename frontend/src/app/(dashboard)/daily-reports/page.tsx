'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AravindDailyReport } from '@/components/AravindDailyReport';
import { NitishaDailyReport } from '@/components/NitishaDailyReport';
import { VeenaDailyReport } from '@/components/VeenaDailyReport';

export default function DailyReportsPage() {
  const { user } = useAuth();

  // Show Aravind-specific daily report
  if (user?.specialization === 'RESIGNATION_EXIT') {
    return <AravindDailyReport />;
  }

  // Show Nitisha-specific daily report
  if (user?.specialization === 'DISCIPLINE_POSH') {
    return <NitishaDailyReport />;
  }

  // Show Veena-specific daily report
  if (user?.specialization === 'ONBOARDING_HIRING') {
    return <VeenaDailyReport />;
  }

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8.5,
    tasksCompleted: '',
    blockers: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isAdminOrHRManager =
    user?.role === 'SUPER_ADMIN' ||
    user?.email === 'superadmin@adyapan.com' ||
    user?.email === 'nandini@adyapan.com' ||
    user?.specialization === 'HR_MANAGER_ALL';

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/reports/daily');
      setReports(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setReports([
        {
          id: 'rep-001',
          employeeName: 'Pavitra (HR Attendance & Leave)',
          userEmail: 'pavitra@adyapan.com',
          date: new Date().toISOString().split('T')[0],
          hoursWorked: 8.5,
          tasksCompleted: 'Processed 14 leave applications and updated Loss of Pay (LOP) log for Technology department.',
          blockers: 'None',
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rep-002',
          employeeName: 'Charitha (HR Salary & Payroll)',
          userEmail: 'charitha@adyapan.com',
          date: new Date().toISOString().split('T')[0],
          hoursWorked: 9.0,
          tasksCompleted: 'Verified CTC breakdown and prepared August monthly salary disbursement bank register.',
          blockers: 'Awaiting 2 bank account verification details from operations team.',
          status: 'SUBMITTED',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rep-003',
          employeeName: 'Abbu Veena (HR Onboarding & Hiring)',
          userEmail: 'veena@adyapan.com',
          date: new Date().toISOString().split('T')[0],
          hoursWorked: 8.0,
          tasksCompleted: 'Screened 18 candidate resumes via AI ATS, issued 2 offer letters, and completed document checks.',
          blockers: 'None',
          status: 'SUBMITTED',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rep-004',
          employeeName: 'Nitisha (HR Discipline & POSH)',
          userEmail: 'nitisha@adyapan.com',
          date: new Date().toISOString().split('T')[0],
          hoursWorked: 8.5,
          tasksCompleted: 'Conducted annual POSH compliance awareness session and reviewed 1 conduct warning case.',
          blockers: 'None',
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'rep-005',
          employeeName: 'Aravind Madhesh Kumar (HR Resignation & Exit)',
          userEmail: 'aravind@adyapan.com',
          date: new Date().toISOString().split('T')[0],
          hoursWorked: 8.0,
          tasksCompleted: 'Processed 1 exit clearance form, calculated Full & Final (F&F) balance, and issued No-Dues certificate.',
          blockers: 'Pending IT hardware asset return sign-off.',
          status: 'SUBMITTED',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tasksCompleted.trim()) return;

    try {
      await apiRequest('/reports/daily', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setSubmitSuccess(true);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        hoursWorked: 8.5,
        tasksCompleted: '',
        blockers: '',
      });
      setTimeout(() => setSubmitSuccess(false), 4000);
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to submit daily report');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/approve`, { method: 'PUT' });
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to approve report');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/reject`, { method: 'PUT' });
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Failed to reject report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span>Daily Work Report System</span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Submit daily accomplishments & tasks. Submitted reports are routed to Admin & HR Manager Biradar Nandini.
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-xs text-xs font-bold text-white border border-white/30 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Routing: Super Admin & Nandini</span>
        </div>
      </div>

      {/* Form & Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Submit Daily Report Form (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-orange-600" />
            <span>Submit Today's Work Report</span>
          </h2>

          {submitSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Daily report submitted to Admin & HR Manager Nandini!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Report Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hours Worked</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.5"
                    value={formData.hoursWorked}
                    onChange={(e) => setFormData({ ...formData, hoursWorked: Number(e.target.value) })}
                    required
                    className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tasks & Accomplishments Completed Today *
              </label>
              <textarea
                value={formData.tasksCompleted}
                onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
                required
                rows={4}
                placeholder="Describe key completed tasks, cases handled, files processed..."
                className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Blockers / Assistance Needed (Optional)
              </label>
              <textarea
                value={formData.blockers}
                onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                rows={2}
                placeholder="Any pending approvals, hardware issues, or department dependencies..."
                className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl saffron-gradient text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Daily Work Report</span>
            </button>
          </form>
        </div>

        {/* Right: All Daily Reports Queue / Feed (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-600" />
              <span>
                {isAdminOrHRManager ? 'Admin & HR Manager Review Queue' : 'Submitted Work Reports'}
              </span>
            </h2>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              {reports.length} Reports Logged
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs hover:border-orange-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{rep.employeeName}</span>
                    <span className="text-[10px] text-slate-400">({rep.userEmail})</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      rep.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : rep.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-4">
                  <span>Date: <strong className="text-slate-800">{rep.date}</strong></span>
                  <span>Hours: <strong className="text-slate-800">{rep.hoursWorked} hrs</strong></span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
                  <strong>Work Done:</strong> {rep.tasksCompleted}
                </div>

                {rep.blockers && rep.blockers !== 'None' && (
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Blockers:</strong> {rep.blockers}</span>
                  </div>
                )}

                {/* Manager / Admin Action Buttons */}
                {isAdminOrHRManager && rep.status === 'SUBMITTED' && (
                  <div className="pt-2 flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleApprove(rep.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(rep.id)}
                      className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
