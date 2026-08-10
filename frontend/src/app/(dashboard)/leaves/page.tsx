'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CalendarDays, Plus, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';

export default function LeavesPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const loadData = async () => {
    try {
      const bData = await apiRequest('/leaves/my-balances');
      setBalances(bData.length > 0 ? bData : [
        { leaveType: { id: 'lt-cl', name: 'Casual Leave' }, totalDays: 12, usedDays: 4 },
        { leaveType: { id: 'lt-sl', name: 'Sick Leave' }, totalDays: 12, usedDays: 2 },
        { leaveType: { id: 'lt-el', name: 'Earned Leave' }, totalDays: 18, usedDays: 5 },
      ]);

      const hData = await apiRequest('/leaves/holidays');
      setHolidays(hData);

      if (['SUPER_ADMIN', 'HR_ADMIN', 'DEPARTMENT_HEAD', 'TEAM_LEADER'].includes(user?.role || '')) {
        const pData = await apiRequest('/leaves/pending');
        setPendingRequests(pData);
      }
    } catch (err) {
      setBalances([
        { leaveType: { id: 'lt-cl', name: 'Casual Leave' }, totalDays: 12, usedDays: 4 },
        { leaveType: { id: 'lt-sl', name: 'Sick Leave' }, totalDays: 12, usedDays: 2 },
        { leaveType: { id: 'lt-el', name: 'Earned Leave' }, totalDays: 18, usedDays: 5 },
      ]);
      setHolidays([
        { title: 'Republic Day', date: '2026-01-26', type: 'NATIONAL' },
        { title: 'Independence Day', date: '2026-08-15', type: 'NATIONAL' },
        { title: 'Diwali', date: '2026-11-08', type: 'COMPANY' },
      ]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/leaves/apply', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setIsApplyModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to apply leave');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiRequest(`/leaves/${id}/approve`, { method: 'PUT' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiRequest(`/leaves/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason: 'Operational urgency' }) });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-orange-600" />
            <span>Leave Management & Approvals</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Check leave balances, submit requests & manage company holidays
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="px-4 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balances.map((b, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-500">{b.leaveType?.name}</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {b.totalDays - b.usedDays} <span className="text-xs text-slate-500 font-medium">/ {b.totalDays} Days Left</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Used: {b.usedDays} days</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-black text-sm">
              {b.totalDays - b.usedDays}d
            </div>
          </div>
        ))}
      </div>

      {/* Pending Approvals Section for Managers/HR */}
      {['SUPER_ADMIN', 'HR_ADMIN', 'DEPARTMENT_HEAD', 'TEAM_LEADER'].includes(user?.role || '') && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Pending Leave Requests ({pendingRequests.length})</span>
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-2">No pending leave requests.</div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      {req.employee?.firstName} {req.employee?.lastName} ({req.leaveType?.name})
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Duration: {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()} ({req.totalDays} Days)
                    </div>
                    <div className="text-slate-700 mt-1 italic">"{req.reason}"</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Holiday Calendar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span>Official Company Holidays (2026)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {holidays.map((h, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900">{h.title}</div>
                <div className="text-[10px] text-slate-500">{new Date(h.date).toDateString()}</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-bold text-[10px]">{h.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 mb-4">Apply for Leave</h2>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  required
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="">Select Leave Type</option>
                  {balances.map((b) => (
                    <option key={b.leaveType?.id} value={b.leaveType?.id}>
                      {b.leaveType?.name} ({b.totalDays - b.usedDays} left)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  rows={3}
                  className="w-full bg-slate-50 text-xs text-slate-900 p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
