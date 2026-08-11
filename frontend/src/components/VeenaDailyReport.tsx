'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { veenaApi } from '@/lib/veena-api';

interface DailyReportRecord {
  id: string;
  date: string;
  role: string;
  candidateSourced: string;
  screeningDone: string;
  interviewsTaken: string;
  selected: string;
  offerLetterSent: string;
  offerAccepted: string;
  joiningConfirmed: string;
  joined: string;
  onboarded: string;
  pendingFollowups: string;
  keyUpdatesIssue: string;
}

export function VeenaDailyReport() {
  const [records, setRecords] = useState<DailyReportRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<DailyReportRecord, 'id'>>({
    date: '',
    role: '',
    candidateSourced: '',
    screeningDone: '',
    interviewsTaken: '',
    selected: '',
    offerLetterSent: '',
    offerAccepted: '',
    joiningConfirmed: '',
    joined: '',
    onboarded: '',
    pendingFollowups: '',
    keyUpdatesIssue: '',
  });

  useEffect(() => {
    veenaApi.getDailyReports().then(setRecords).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({ date: '', role: '', candidateSourced: '', screeningDone: '', interviewsTaken: '', selected: '', offerLetterSent: '', offerAccepted: '', joiningConfirmed: '', joined: '', onboarded: '', pendingFollowups: '', keyUpdatesIssue: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: DailyReportRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await veenaApi.deleteDailyReport(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await veenaApi.updateDailyReport(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? updated : r));
    } else {
      const created = await veenaApi.createDailyReport(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <span>Daily Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track daily recruitment activities, sourcing, and onboarding progress
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Daily Report'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Daily Report' : 'New Daily Report'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role *</label>
              <input type="text" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Candidate Sourced</label>
              <input type="text" value={form.candidateSourced} onChange={(e) => setForm({ ...form, candidateSourced: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Screening Done</label>
              <input type="text" value={form.screeningDone} onChange={(e) => setForm({ ...form, screeningDone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Interviews Taken</label>
              <input type="text" value={form.interviewsTaken} onChange={(e) => setForm({ ...form, interviewsTaken: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Selected</label>
              <input type="text" value={form.selected} onChange={(e) => setForm({ ...form, selected: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Offer Letter Sent</label>
              <input type="text" value={form.offerLetterSent} onChange={(e) => setForm({ ...form, offerLetterSent: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Offer Accepted</label>
              <input type="text" value={form.offerAccepted} onChange={(e) => setForm({ ...form, offerAccepted: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Confirmed</label>
              <input type="text" value={form.joiningConfirmed} onChange={(e) => setForm({ ...form, joiningConfirmed: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Joined</label>
              <input type="text" value={form.joined} onChange={(e) => setForm({ ...form, joined: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Onboarded</label>
              <input type="text" value={form.onboarded} onChange={(e) => setForm({ ...form, onboarded: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pending Followups</label>
              <input type="text" value={form.pendingFollowups} onChange={(e) => setForm({ ...form, pendingFollowups: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Key Updates / Issues</label>
              <textarea value={form.keyUpdatesIssue} onChange={(e) => setForm({ ...form, keyUpdatesIssue: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Daily Report' : 'Save Daily Report'}
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Role</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Sourced</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Screening</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Interviews</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Selected</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Offer Sent</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Accepted</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Joining</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Joined</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Onboarded</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Followups</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Key Updates</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.date}</td>
                  <td className="px-4 py-3 text-slate-700">{r.role}</td>
                  <td className="px-4 py-3 text-slate-700">{r.candidateSourced}</td>
                  <td className="px-4 py-3 text-slate-700">{r.screeningDone}</td>
                  <td className="px-4 py-3 text-slate-700">{r.interviewsTaken}</td>
                  <td className="px-4 py-3 text-slate-700">{r.selected}</td>
                  <td className="px-4 py-3 text-slate-700">{r.offerLetterSent}</td>
                  <td className="px-4 py-3 text-slate-700">{r.offerAccepted}</td>
                  <td className="px-4 py-3 text-slate-700">{r.joiningConfirmed}</td>
                  <td className="px-4 py-3 text-slate-700">{r.joined}</td>
                  <td className="px-4 py-3 text-slate-700">{r.onboarded}</td>
                  <td className="px-4 py-3 text-slate-700">{r.pendingFollowups}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{r.keyUpdatesIssue}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors cursor-pointer" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
