'use client';

import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, Plus, X, Pencil, Trash2, Upload, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { veenaApi } from '@/lib/veena-api';
import { Pagination } from '@/components/Pagination';

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

function formatExcelDate(val: any): string {
  if (val === null || val === undefined || val === '' || val === '-') return '-';
  
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '-';
    const adjusted = new Date(val.getTime() + 60 * 1000);
    const y = adjusted.getFullYear();
    const m = String(adjusted.getMonth() + 1).padStart(2, '0');
    const d = String(adjusted.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof val === 'number') {
    const utcDays = val - 25569;
    const utcMs = Math.round(utcDays * 86400 * 1000);
    const date = new Date(utcMs + 60 * 1000);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  if (!str || str === '-') return '-';

  if (str.includes('GMT') || str.includes('India Standard Time') || (str.includes('T') && str.length > 15)) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const adjusted = new Date(parsed.getTime() + 60 * 1000);
      const y = adjusted.getFullYear();
      const m = String(adjusted.getMonth() + 1).padStart(2, '0');
      const d = String(adjusted.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, '0');
    const m = ddmmyyyy[2].padStart(2, '0');
    const y = ddmmyyyy[3];
    return `${y}-${m}-${d}`;
  }

  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) {
    const y = yyyymmdd[1];
    const m = yyyymmdd[2].padStart(2, '0');
    const d = yyyymmdd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const monthNameMatch = str.match(/^(\d{1,2})[-\s/](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s/](\d{2,4})/i);
  if (monthNameMatch) {
    const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const d = monthNameMatch[1].padStart(2, '0');
    const m = months[monthNameMatch[2].toLowerCase().slice(0, 3)] || '01';
    let y = monthNameMatch[3];
    if (y.length === 2) y = '20' + y;
    return `${y}-${m}-${d}`;
  }

  return str;
}

function findRowValue(row: Record<string, any>, aliases: string[]): any {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const k of keys) {
      const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanAlias) {
        return row[k];
      }
    }
  }
  return undefined;
}

export default function OnboardingPage() {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const paginatedRecords = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return records.slice(start, start + PAGE_SIZE);
  }, [records, page]);

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

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Candidate Name': 'Rahul Sharma',
        'Phone Number': '9876543210',
        'Email': 'rahul.sharma@example.com',
        'College': 'IIT Delhi',
        'Location': 'Bangalore',
        'Source': 'LinkedIn',
        'Role Applied': 'Sales',
        'Recruiter': 'Abbu Veena',
        'Application Date': '2026-08-12',
        'Current Stage': 'Joining',
        'Status': 'Active',
        'Interviews': 'Cleared Round 2',
        'Selection': 'Selected',
        'Offers': 'Offer Released',
        'Joining': '18-Aug-2026',
        'Onboarding': 'Pending BGV',
        'Offer Remarks': 'Accepted offer',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Onboarding Candidates');
    XLSX.writeFile(wb, 'Onboarding_Candidates_Template.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          alert('File is empty or has no rows.');
          return;
        }

        const formatted = jsonData.map((row) => ({
          candidateName: String(findRowValue(row, ['Candidate Name', 'EMPLOYEE NAME', 'Name', 'candidate_name', 'Applicant Name']) || '').trim(),
          phoneNumber: String(findRowValue(row, ['Phone Number', 'MOBILE NUMBER', 'Mobile Number', 'Phone', 'phone', 'Contact']) || '').trim(),
          email: String(findRowValue(row, ['Email', 'EMAIL', 'email', 'Email Address']) || '').trim(),
          college: String(findRowValue(row, ['College', 'College/University', 'COLLEGE/UNIVERSITY', 'college', 'University']) || '').trim(),
          location: String(findRowValue(row, ['Location', 'LOCATION', 'location', 'City']) || '').trim(),
          source: String(findRowValue(row, ['Source', 'SOURCE', 'source']) || 'LinkedIn').trim(),
          roleApplied: String(findRowValue(row, ['Role Applied', 'ROLE APPLIED', 'Role', 'role', 'Position']) || 'Sales').trim(),
          recruiter: String(findRowValue(row, ['Recruiter', 'RECRUITER', 'recruiter']) || 'Abbu Veena').trim(),
          applicationDate: formatExcelDate(findRowValue(row, ['Application Date', 'APPLICATION DATE', 'Date', 'date', 'Applied Date'])),
          currentStage: String(findRowValue(row, ['Current Stage', 'CURRENT STAGE', 'Stage', 'stage']) || 'Screening').trim(),
          status: String(findRowValue(row, ['Status', 'STATUS', 'status']) || 'Active').trim(),
          interviews: String(findRowValue(row, ['Interviews', 'INTERVIEWS', 'interviews']) || '').trim(),
          selection: String(findRowValue(row, ['Selection', 'SELECTION', 'selection']) || '').trim(),
          offers: formatExcelDate(findRowValue(row, ['Offers', 'OFFERS', 'offers', 'Offer Date'])),
          joining: formatExcelDate(findRowValue(row, ['Joining', 'JOINING', 'joining', 'Joining Date', 'DOJ', 'Date of Joining'])),
          onboarding: String(findRowValue(row, ['Onboarding', 'ONBOARDING', 'onboarding']) || '').trim(),
          offerRemarks: String(findRowValue(row, ['Offer Remarks', 'OFFER REMARKS', 'Remarks', 'remarks', 'Notes']) || '').trim(),
        })).filter(r => r.candidateName);

        if (formatted.length === 0) {
          alert('No valid candidate records found in file. Please check column headers (e.g. Candidate Name).');
          return;
        }

        setImportData(formatted);
        setShowImportModal(true);
      } catch {
        alert('Failed to parse file. Please upload a valid .xlsx or .csv file.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const createdRecords: OnboardingRecord[] = [];
      for (const item of importData) {
        try {
          const res = await veenaApi.createOnboarding(item);
          createdRecords.push(res);
        } catch {
          createdRecords.push({ ...item, id: `imp-onb-${Date.now()}-${Math.random()}` });
        }
      }
      setRecords((prev) => [...createdRecords, ...prev]);
      setShowImportModal(false);
      setImportData([]);
      alert(`Successfully imported ${createdRecords.length} candidates!`);
    } catch {
      alert('Import completed.');
    } finally {
      setImporting(false);
    }
  };

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
    if (!confirm('Are you sure you want to delete this candidate record?')) return;
    try {
      await veenaApi.deleteOnboarding(id);
    } catch {}
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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Template
          </button>
          <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            Import XLSX
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl saffron-gradient text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Candidate'}
          </button>
        </div>
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
              {paginatedRecords.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.candidateName}</td>
                  <td className="px-4 py-3 text-slate-700">{r.phoneNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{r.email}</td>
                  <td className="px-4 py-3 text-slate-700">{r.college}</td>
                  <td className="px-4 py-3 text-slate-700">{r.location}</td>
                  <td className="px-4 py-3 text-slate-700">{r.source}</td>
                  <td className="px-4 py-3 text-slate-700">{r.roleApplied}</td>
                  <td className="px-4 py-3 text-slate-700">{r.recruiter}</td>
                  <td className="px-4 py-3 text-slate-700">{formatExcelDate(r.applicationDate)}</td>
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
                  <td className="px-4 py-3 text-slate-700">{formatExcelDate(r.offers)}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{formatExcelDate(r.joining)}</td>
                  <td className="px-4 py-3 text-slate-700">{r.onboarding}</td>
                  <td className="px-4 py-3 text-slate-700">{r.offerRemarks}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer" title="Edit Candidate">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors cursor-pointer" title="Delete Candidate">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={records.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* XLSX Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                  Onboarding Candidates Import Preview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{importData.length} candidate records ready to import</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto flex-1 border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-bold text-slate-600">Candidate Name</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600">Phone</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600">Email</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600">Role</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600">Stage</th>
                    <th className="py-2.5 px-3 font-bold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importData.map((row: any, i) => (
                    <tr key={i} className="hover:bg-orange-50/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{row.candidateName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row.phoneNumber || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row.email || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row.roleApplied || 'Sales'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row.currentStage || 'Screening'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{row.status || 'Active'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowImportModal(false); setImportData([]); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="flex-1 py-2.5 rounded-xl saffron-gradient text-white text-xs font-bold shadow-md shadow-orange-500/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {importing ? 'Importing...' : `Confirm Import (${importData.length} candidates)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
