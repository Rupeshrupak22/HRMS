'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { veenaApi } from '@/lib/veena-api';

interface OnboardingRecord {
  id: string;
  candidateName: string;
  phoneNumber: string;
  email: string;
  college: string;
  location: string;
  source: string;
  roleApplied: string;
  recruiter: string;
  applicationDate: string;
  currentStage: string;
  status: string;
  interviews: string;
  selection: string;
  offers: string;
  joining: string;
  onboarding: string;
  offerRemarks: string;
}

export default function OnboardingPage() {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<OnboardingRecord, 'id'>>({
    candidateName: '',
    phoneNumber: '',
    email: '',
    college: '',
    location: '',
    source: '',
    roleApplied: '',
    recruiter: '',
    applicationDate: '',
    currentStage: '',
    status: '',
    interviews: '',
    selection: '',
    offers: '',
    joining: '',
    onboarding: '',
    offerRemarks: '',
  });

  useEffect(() => {
    veenaApi.getOnboarding().then(setRecords).catch(() => {});
  }, []);

  const resetForm = () => {
    setForm({ candidateName: '', phoneNumber: '', email: '', college: '', location: '', source: '', roleApplied: '', recruiter: '', applicationDate: '', currentStage: '', status: '', interviews: '', selection: '', offers: '', joining: '', onboarding: '', offerRemarks: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (record: OnboardingRecord) => {
    const { id, ...rest } = record;
    setForm(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await veenaApi.deleteOnboarding(id);
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = await veenaApi.updateOnboarding(editingId, form);
      setRecords(records.map((r) => r.id === editingId ? updated : r));
    } else {
      const created = await veenaApi.createOnboarding(form);
      setRecords([created, ...records]);
    }
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-500" />
            <span>Recruitment & Onboarding Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track candidates through the hiring pipeline from sourcing to onboarding
          </p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Candidate'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Candidate' : 'New Candidate'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Candidate Name *</label>
              <input type="text" required value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
              <input type="text" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">College</label>
              <input type="text" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="College">College</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Naukri">Naukri</option>
                <option value="Referral">Referral</option>
                <option value="Job Portal">Job Portal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role Applied</label>
              <select value={form.roleApplied} onChange={(e) => setForm({ ...form, roleApplied: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Operations">Operations</option>
                <option value="Tech">Tech</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Recruiter</label>
              <input type="text" value={form.recruiter} onChange={(e) => setForm({ ...form, recruiter: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Application Date</label>
              <input type="date" value={form.applicationDate} onChange={(e) => setForm({ ...form, applicationDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Current Stage</label>
              <select value={form.currentStage} onChange={(e) => setForm({ ...form, currentStage: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Screening">Screening</option>
                <option value="Interview">Interview</option>
                <option value="Selection">Selection</option>
                <option value="Offer">Offer</option>
                <option value="Joining">Joining</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Joined">Joined</option>
                <option value="Dropout">Dropout</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select</option>
                <option value="Active">Active</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
                <option value="Joined">Joined</option>
                <option value="Dropped">Dropped</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Interviews</label>
              <input type="text" value={form.interviews} onChange={(e) => setForm({ ...form, interviews: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Selection</label>
              <input type="text" value={form.selection} onChange={(e) => setForm({ ...form, selection: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Offers</label>
              <input type="text" value={form.offers} onChange={(e) => setForm({ ...form, offers: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Joining</label>
              <input type="text" value={form.joining} onChange={(e) => setForm({ ...form, joining: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Onboarding</label>
              <input type="text" value={form.onboarding} onChange={(e) => setForm({ ...form, onboarding: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Offer Remarks</label>
              <input type="text" value={form.offerRemarks} onChange={(e) => setForm({ ...form, offerRemarks: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer">
            {editingId ? 'Update Candidate' : 'Save Candidate'}
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Candidate Name</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Phone</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">College</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Location</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Source</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Role Applied</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Recruiter</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">App Date</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Stage</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Interviews</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Selection</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Offers</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Joining</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Onboarding</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Offer Remarks</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.candidateName}</td>
                  <td className="px-4 py-3 text-slate-700">{r.phoneNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{r.email}</td>
                  <td className="px-4 py-3 text-slate-700">{r.college}</td>
                  <td className="px-4 py-3 text-slate-700">{r.location}</td>
                  <td className="px-4 py-3 text-slate-700">{r.source}</td>
                  <td className="px-4 py-3 text-slate-700">{r.roleApplied}</td>
                  <td className="px-4 py-3 text-slate-700">{r.recruiter}</td>
                  <td className="px-4 py-3 text-slate-700">{r.applicationDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.currentStage === 'Joined' ? 'bg-green-100 text-green-700' : r.currentStage === 'Dropout' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.currentStage}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Joined' ? 'bg-green-100 text-green-700' : r.status === 'Rejected' || r.status === 'Dropped' ? 'bg-red-100 text-red-700' : r.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.interviews}</td>
                  <td className="px-4 py-3 text-slate-700">{r.selection}</td>
                  <td className="px-4 py-3 text-slate-700">{r.offers}</td>
                  <td className="px-4 py-3 text-slate-700">{r.joining}</td>
                  <td className="px-4 py-3 text-slate-700">{r.onboarding}</td>
                  <td className="px-4 py-3 text-slate-700">{r.offerRemarks}</td>
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
