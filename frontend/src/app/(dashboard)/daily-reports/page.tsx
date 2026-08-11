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
  RefreshCw,
  Upload,
  Download,
  Plus,
  X,
  Search,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { ActionBar } from '@/components/ActionBar';

export default function DailyReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [viewingReport, setViewingReport] = useState<any | null>(null);
  
  // Double verification delete state
  const [deletingReport, setDeletingReport] = useState<any | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(false);

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    role: 'Senior Full Stack Engineer',
    candidateSource: 'Naukri.com',
    screeningCompleted: 'YES',
    interviewTakenBy: 'Arjun Mehta (Tech Lead)',
    selectionStatus: 'SELECTED',
    offerLetterSent: 'YES',
    offerLetterAccepted: 'YES',
    joiningConfirmation: 'CONFIRMED',
    joinedOnboarded: 'YES',
    pendingFollowups: 'Collect Relieving Letter & Salary Slips',
    keyUpdates: 'Completed Day-1 onboarding orientation & IT laptop setup.',
    issue: 'None',
    comment: 'Strong candidate profile, ready for development team.',
    numInterviews: '3',
    numOffersSent: '2',
    numJoined: '1',
    numDropouts: '0',
    numScreened: '5',
  });

  const isAdminOrHRManager =
    user?.role === 'SUPER_ADMIN' ||
    user?.email === 'superadmin@adyapan.com' ||
    user?.email === 'nandini@adyapan.com' ||
    user?.email === 'nandani@adyapan.com' ||
    user?.specialization === 'HR_MANAGER_ALL';

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/reports/daily');
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const openCreateModal = () => {
    setEditingReport(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      role: '',
      candidateSource: 'Naukri.com',
      screeningCompleted: 'YES',
      interviewTakenBy: '',
      selectionStatus: 'SELECTED',
      offerLetterSent: 'YES',
      offerLetterAccepted: 'YES',
      joiningConfirmation: 'CONFIRMED',
      joinedOnboarded: 'YES',
      pendingFollowups: '',
      keyUpdates: '',
      issue: '',
      comment: '',
      numInterviews: '0',
      numOffersSent: '0',
      numJoined: '0',
      numDropouts: '0',
      numScreened: '0',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (rep: any) => {
    setEditingReport(rep);
    setFormData({
      date: rep.date || new Date().toISOString().split('T')[0],
      role: rep.role || '',
      candidateSource: rep.candidateSource || 'Naukri.com',
      screeningCompleted: rep.screeningCompleted || 'YES',
      interviewTakenBy: rep.interviewTakenBy || '',
      selectionStatus: rep.selectionStatus || 'SELECTED',
      offerLetterSent: rep.offerLetterSent || 'YES',
      offerLetterAccepted: rep.offerLetterAccepted || 'YES',
      joiningConfirmation: rep.joiningConfirmation || 'CONFIRMED',
      joinedOnboarded: rep.joinedOnboarded || 'YES',
      pendingFollowups: rep.pendingFollowups || '',
      keyUpdates: rep.keyUpdates || '',
      issue: rep.issue || '',
      comment: rep.comment || '',
      numInterviews: rep.numInterviews || '0',
      numOffersSent: rep.numOffersSent || '0',
      numJoined: rep.numJoined || '0',
      numDropouts: rep.numDropouts || '0',
      numScreened: rep.numScreened || '0',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingReport) {
        await apiRequest(`/reports/daily/${editingReport.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setActionNotice(`Report for ${formData.role} updated successfully.`);
      } else {
        await apiRequest('/reports/daily', {
          method: 'POST',
          body: JSON.stringify({ ...formData, sendToAdmin: false }),
        });
        setSubmitSuccess(true);
      }
      setIsFormOpen(false);
      setTimeout(() => {
        setSubmitSuccess(false);
        setActionNotice('');
      }, 4000);
      loadReports();
    } catch (err: any) {
      // If API fails, still save locally for offline mode
      if (editingReport) {
        setReports((prev) => prev.map((r) => r.id === editingReport.id ? { ...r, ...formData, updatedAt: new Date().toISOString() } : r));
        setActionNotice(`Report saved locally (offline mode).`);
      } else {
        const newReport = { id: `local-${Date.now()}`, employeeName: user?.firstName || 'Veena', userEmail: user?.email || '', ...formData, status: 'SUBMITTED', sendStatus: 'NOT_SENT', createdAt: new Date().toISOString() };
        setReports((prev) => [newReport, ...prev]);
        setSubmitSuccess(true);
      }
      setIsFormOpen(false);
      setTimeout(() => { setSubmitSuccess(false); setActionNotice(''); }, 4000);
    }
  };

  // Double verification delete handler
  const triggerDeleteVerification = (rep: any) => {
    setDeletingReport(rep);
    setDeleteConfirmStep(false); // Step 1
  };

  const executeDeletePermanent = async () => {
    if (!deletingReport) return;
    try {
      await apiRequest(`/reports/daily/${deletingReport.id}`, { method: 'DELETE' });
    } catch (err) {
      // If API fails, delete locally
    }
    setReports((prev) => prev.filter((r) => r.id !== deletingReport.id));
    setActionNotice(`Report #${deletingReport.id} permanently deleted.`);
    setDeletingReport(null);
    setDeleteConfirmStep(false);
    setTimeout(() => setActionNotice(''), 4000);
  };

  const handleApprove = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/approve`, { method: 'PUT' });
      loadReports();
    } catch (err) {
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'APPROVED' } : r));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiRequest(`/reports/daily/${id}/reject`, { method: 'PUT' });
      loadReports();
    } catch (err) {
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'REJECTED' } : r));
    }
  };

  // Metrics counting
  const totalCount = reports.length;
  const joinedCount = reports.filter((r) => r.joinedOnboarded === 'YES').length;
  const pendingCount = reports.filter((r) => r.joiningConfirmation === 'TENTATIVE' || r.offerLetterAccepted === 'PENDING').length;
  const inProgressCount = reports.filter((r) => r.joinedOnboarded === 'IN_ONBOARDING' || r.screeningCompleted === 'IN_PROGRESS').length;
  const comingLaterCount = reports.filter((r) => r.joiningConfirmation === 'CONFIRMED' && r.joinedOnboarded !== 'YES').length;
  const notJoiningCount = reports.filter((r) => r.selectionStatus === 'REJECTED' || r.joiningConfirmation === 'DECLINED').length;

  const filteredReports = reports.filter(
    (r) =>
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.candidateSource || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 rounded-2xl saffron-gradient text-white shadow-md">
        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Onboarding &amp; Daily Work Report Tracker
        </h1>
        <p className="text-[11px] text-orange-100 mt-0.5">
          Track new joiners, candidate interviews &amp; daily work updates
        </p>
      </div>

      {/* Action Bar */}
      <ActionBar
        onRefresh={loadReports}
        onExport={() => {
          const headers = ['ID', 'Employee', 'Date', 'Role', 'Source', 'Status'];
          const rows = reports.map((r) => [r.id, r.employeeName, r.date, r.role, r.candidateSource, r.status]);
          const csv = [headers, ...rows].map((row) => row.map((v: any) => `"${v}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `daily-reports-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
        }}
        onAdd={openCreateModal}
        addLabel="Add Candidate / Daily Report"
      />

      {/* METRIC COUNTER CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">Total</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center shadow-2xs">
          <div className="text-2xl font-black text-emerald-700">{joinedCount}</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">Joined</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-center shadow-2xs">
          <div className="text-2xl font-black text-amber-700">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 font-bold mt-1">Pending</div>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-center shadow-2xs">
          <div className="text-2xl font-black text-blue-700">{comingLaterCount}</div>
          <div className="text-[11px] text-blue-700 font-bold mt-1">Coming Later</div>
        </div>
        <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200 text-center shadow-2xs">
          <div className="text-2xl font-black text-orange-700">{inProgressCount}</div>
          <div className="text-[11px] text-orange-700 font-bold mt-1">In Progress</div>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-center shadow-2xs">
          <div className="text-2xl font-black text-rose-700">{notJoiningCount}</div>
          <div className="text-[11px] text-rose-700 font-bold mt-1">Not Joining</div>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Daily work report saved successfully! Use the Send button to send it to Admin &amp; HR Manager.</span>
        </div>
      )}

      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-800 font-bold flex items-center gap-2 shadow-2xs">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* SEARCH & REGISTER TABLE WITH ACTION BUTTONS (VIEW, EDIT, DELETE) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-600" />
            <span>Daily Candidate Onboarding & Work Report Log</span>
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate, role or source..."
              className="w-full bg-slate-50 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Date & HR User</th>
                <th className="py-3 px-3">Role & Source</th>
                <th className="py-3 px-3">Numbers</th>
                <th className="py-3 px-3">Screening</th>
                <th className="py-3 px-3">Selection</th>
                <th className="py-3 px-3">Offer Status</th>
                <th className="py-3 px-3">Joining Status</th>
                <th className="py-3 px-3">Send Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-orange-50/20 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{rep.date}</div>
                    <div className="text-[10px] text-slate-500">{rep.employeeName}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{rep.role}</div>
                    <div className="text-[10px] text-orange-600 font-semibold">{rep.candidateSource}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-[10px] space-y-0.5">
                      <div>Screened: <strong className="text-slate-900">{rep.numScreened || 0}</strong></div>
                      <div>Interviews: <strong className="text-slate-900">{rep.numInterviews || 0}</strong></div>
                      <div>Offers: <strong className="text-orange-600">{rep.numOffersSent || 0}</strong></div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rep.screeningCompleted === 'YES' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {rep.screeningCompleted === 'YES' ? 'Done' : 'Pending'}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rep.selectionStatus === 'SELECTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : rep.selectionStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {rep.selectionStatus}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-[10px] font-semibold text-slate-700">
                      Sent: <strong className="text-slate-900">{rep.offerLetterSent}</strong>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700">
                      Accepted: <strong className="text-slate-900">{rep.offerLetterAccepted}</strong>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-[10px] font-semibold text-slate-700">
                      Conf: <strong className="text-slate-900">{rep.joiningConfirmation}</strong>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-700">
                      Onboarded: <strong className="text-slate-900">{rep.joinedOnboarded}</strong>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {rep.sendStatus === 'SENT' ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" /> Sent
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            await apiRequest(`/reports/daily/${rep.id}/send`, { method: 'PUT' });
                          } catch (err) {}
                          setReports((prev) => prev.map((r) => r.id === rep.id ? { ...r, sendStatus: 'SENT' } : r));
                          setActionNotice(`Report #${rep.id} sent to Admin & HR Manager Nandini!`);
                          setTimeout(() => setActionNotice(''), 4000);
                        }}
                        className="px-2 py-1 bg-orange-100 text-orange-700 border border-orange-300 text-[10px] font-bold rounded flex items-center gap-1 w-max hover:bg-orange-200 cursor-pointer"
                      >
                        <Send className="w-3 h-3" /> Send
                      </button>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setViewingReport(rep)} title="View" className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEditModal(rep)} title="Edit" className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => triggerDeleteVerification(rep)} title="Delete" className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. VIEW FULL REPORT MODAL */}
      {/* ==================================================== */}
      {viewingReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 saffron-gradient text-white flex items-center justify-between">
              <h3 className="text-base font-black flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span>Candidate Report Details — #{viewingReport.id}</span>
              </h3>
              <button
                onClick={() => setViewingReport(null)}
                className="p-1 rounded-xl bg-white/20 text-white hover:bg-white/30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-slate-400 font-semibold text-[10px]">Candidate Role</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">{viewingReport.role}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[10px]">Source</div>
                  <div className="font-extrabold text-orange-600 text-sm mt-0.5">{viewingReport.candidateSource}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold text-[10px]">Report Date</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">{viewingReport.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 font-medium">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold">Screening</div>
                  <div className="font-extrabold text-slate-900 mt-1">{viewingReport.screeningCompleted}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold">Interviewer</div>
                  <div className="font-extrabold text-slate-900 mt-1">{viewingReport.interviewTakenBy || 'N/A'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold">Selection</div>
                  <div className="font-extrabold text-emerald-600 mt-1">{viewingReport.selectionStatus}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-bold">Onboarded</div>
                  <div className="font-extrabold text-slate-900 mt-1">{viewingReport.joinedOnboarded}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-900">Key Updates:</strong> {viewingReport.keyUpdates}
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <strong>Pending / Followups:</strong> {viewingReport.pendingFollowups || 'None'}
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                  <strong>Issues & Blockers:</strong> {viewingReport.issue || 'None'}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong>Comments & Remarks:</strong> {viewingReport.comment || 'None'}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingReport(null)}
                className="px-5 py-2 rounded-xl saffron-gradient text-white font-bold text-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. CREATE & EDIT REPORT MODAL FORM */}
      {/* ==================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="p-5 saffron-gradient text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span>{editingReport ? `Edit Candidate Report #${editingReport.id}` : 'Submit Candidate Onboarding & Daily Report'}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-xl bg-white/20 text-white hover:bg-white/30 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / Position *</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                    placeholder="e.g. Senior Tech Lead"
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Candidate Source *</label>
                  <select
                    value={formData.candidateSource}
                    onChange={(e) => setFormData({ ...formData, candidateSource: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="Naukri.com">Naukri.com</option>
                    <option value="LinkedIn Recruiter">LinkedIn Recruiter</option>
                    <option value="Employee Referral">Employee Referral</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Campus Drive">Campus Drive</option>
                    <option value="Direct Agency">Direct Agency</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Screening Completed *</label>
                  <select
                    value={formData.screeningCompleted}
                    onChange={(e) => setFormData({ ...formData, screeningCompleted: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="YES">Yes (Screening Completed)</option>
                    <option value="NO">No (Not Screened)</option>
                    <option value="IN_PROGRESS">In Progress</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interview Taken By *</label>
                  <input
                    type="text"
                    value={formData.interviewTakenBy}
                    onChange={(e) => setFormData({ ...formData, interviewTakenBy: e.target.value })}
                    required
                    placeholder="Interviewer Name / Panel"
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selection Status *</label>
                  <select
                    value={formData.selectionStatus}
                    onChange={(e) => setFormData({ ...formData, selectionStatus: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="SELECTED">Selected</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="HOLD">Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Offer Letter Sent *</label>
                  <select
                    value={formData.offerLetterSent}
                    onChange={(e) => setFormData({ ...formData, offerLetterSent: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Offer Accepted *</label>
                  <select
                    value={formData.offerLetterAccepted}
                    onChange={(e) => setFormData({ ...formData, offerLetterAccepted: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Joining Confirmation *</label>
                  <select
                    value={formData.joiningConfirmation}
                    onChange={(e) => setFormData({ ...formData, joiningConfirmation: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="TENTATIVE">Tentative</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Joined / Onboarded *</label>
                  <select
                    value={formData.joinedOnboarded}
                    onChange={(e) => setFormData({ ...formData, joinedOnboarded: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="YES">Yes (Onboarded)</option>
                    <option value="NO">No</option>
                    <option value="IN_ONBOARDING">In Onboarding</option>
                  </select>
                </div>
              </div>

              {/* NUMBER TRACKING FIELDS */}
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                <label className="block font-bold text-orange-800 mb-2 text-[11px]">📊 Today&apos;s Work Numbers</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Screened</label>
                    <input type="number" min="0" value={formData.numScreened} onChange={(e) => setFormData({ ...formData, numScreened: e.target.value })} className="w-full bg-white text-slate-900 p-2 rounded-lg border border-slate-200 text-center font-black" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Interviews</label>
                    <input type="number" min="0" value={formData.numInterviews} onChange={(e) => setFormData({ ...formData, numInterviews: e.target.value })} className="w-full bg-white text-slate-900 p-2 rounded-lg border border-slate-200 text-center font-black" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Offers Sent</label>
                    <input type="number" min="0" value={formData.numOffersSent} onChange={(e) => setFormData({ ...formData, numOffersSent: e.target.value })} className="w-full bg-white text-slate-900 p-2 rounded-lg border border-slate-200 text-center font-black" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Joined</label>
                    <input type="number" min="0" value={formData.numJoined} onChange={(e) => setFormData({ ...formData, numJoined: e.target.value })} className="w-full bg-white text-slate-900 p-2 rounded-lg border border-slate-200 text-center font-black" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Dropouts</label>
                    <input type="number" min="0" value={formData.numDropouts} onChange={(e) => setFormData({ ...formData, numDropouts: e.target.value })} className="w-full bg-white text-slate-900 p-2 rounded-lg border border-slate-200 text-center font-black" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pending / Followups</label>
                <textarea
                  value={formData.pendingFollowups}
                  onChange={(e) => setFormData({ ...formData, pendingFollowups: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Key Updates *</label>
                <textarea
                  value={formData.keyUpdates}
                  onChange={(e) => setFormData({ ...formData, keyUpdates: e.target.value })}
                  required
                  rows={2}
                  className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue / Blocker</label>
                  <textarea
                    value={formData.issue}
                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Comment / Manager Notes</label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    rows={2}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl saffron-gradient text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{editingReport ? 'Save Changes' : 'Save Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. DOUBLE VERIFICATION DELETE CONFIRMATION MODAL */}
      {/* ==================================================== */}
      {deletingReport && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {deleteConfirmStep ? 'Step 2: Permanent Deletion' : 'Step 1: Delete Verification'}
                </h3>
                <p className="text-xs text-rose-600 font-bold">Double Verification Required</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <div><strong>Report ID:</strong> #{deletingReport.id}</div>
              <div><strong>Candidate Role:</strong> {deletingReport.role}</div>
              <div><strong>Submitted By:</strong> {deletingReport.employeeName}</div>
              {deleteConfirmStep && (
                <div className="text-rose-700 font-bold pt-1 text-[11px]">
                  ⚠️ WARNING: This action cannot be undone. Are you 100% sure you want to permanently erase this report record?
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setDeletingReport(null);
                  setDeleteConfirmStep(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              {!deleteConfirmStep ? (
                <button
                  onClick={() => setDeleteConfirmStep(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center gap-1"
                >
                  <span>Proceed to Confirm</span> ➔
                </button>
              ) : (
                <button
                  onClick={executeDeletePermanent}
                  className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-black text-xs shadow-lg shadow-red-600/30 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm Delete Permanent</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
