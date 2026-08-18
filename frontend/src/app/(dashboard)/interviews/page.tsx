'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  RotateCw,
  Upload,
  Download,
  Plus,
  X,
  Pencil,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { veenaApi } from '@/lib/veena-api';
import { Pagination } from '@/components/Pagination';

interface CandidateRecord {
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

export default function InterviewsPage() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<CandidateRecord | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<CandidateRecord, 'id'>>({
    candidateName: '',
    phoneNumber: '',
    email: '',
    college: '',
    location: '',
    source: 'LinkedIn',
    roleApplied: 'Sales',
    recruiter: 'Abbu Veena',
    applicationDate: new Date().toISOString().split('T')[0],
    currentStage: 'Screening',
    status: 'Active',
    interviews: '',
    selection: '',
    offers: '',
    joining: '',
    onboarding: '',
    offerRemarks: '',
  });

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await veenaApi.getOnboarding();
      const list = Array.isArray(res) ? res : [];
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_onboarding_candidates') : null;
      let localList: any[] = [];
      try { localList = savedLocal ? JSON.parse(savedLocal) : []; } catch { localList = []; }

      const existingNames = new Set(list.map((c: any) => (c.candidateName || '').toLowerCase().trim()));
      const uniqueLocal = localList.filter((c: any) => !existingNames.has((c.candidateName || '').toLowerCase().trim()));
      
      setCandidates([...list, ...uniqueLocal]);
    } catch {
      const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('adyapan_imported_onboarding_candidates') : null;
      let localList: any[] = [];
      try { localList = savedLocal ? JSON.parse(savedLocal) : []; } catch { localList = []; }
      setCandidates(localList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const pipelineStages = ['Application', 'Screening', 'Interview', 'Selection', 'Offer', 'Joining', 'Onboarding', 'Completed'];

  // Filtering Logic
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      (c.candidateName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phoneNumber || '').includes(searchTerm) ||
      (c.college || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.roleApplied || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = !stageFilter || c.currentStage === stageFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStage && matchesStatus;
  });

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, stageFilter, statusFilter]);

  const paginatedCandidates = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCandidates.slice(start, start + PAGE_SIZE);
  }, [filteredCandidates, page]);

  // Template Download
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Candidate Name': 'Ankit Verma',
        'Mobile Number': '9876543210',
        'Email': 'ankit.verma@example.com',
        'College/University': 'IIT Kanpur',
        'Location': 'Bangalore',
        'Source': 'LinkedIn',
        'Role Applied': 'Sales Specialist',
        'Recruiter': 'Abbu Veena',
        'Application Date': '2026-08-12',
        'Current Stage': 'Interview',
        'Status': 'Active',
        'Interviews': 'Round 1 Cleared',
        'Selection': 'Pending Round 2',
        'Offers': '-',
        'Joining': '-',
        'Onboarding': '-',
        'Offer Remarks': 'Strong candidate',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
    XLSX.writeFile(wb, 'Candidate_Register_Template.xlsx');
  };

  // Upload Excel
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
          alert('File is empty or has no valid rows.');
          return;
        }

        const formatted = jsonData.map((row) => ({
          candidateName: String(findRowValue(row, ['Candidate Name', 'EMPLOYEE NAME', 'Name', 'candidate_name', 'Applicant Name']) || '').trim(),
          phoneNumber: String(findRowValue(row, ['Mobile Number', 'MOBILE NUMBER', 'Phone Number', 'Phone', 'phone', 'Contact']) || '').trim(),
          email: String(findRowValue(row, ['Email', 'EMAIL', 'email', 'Email Address']) || '').trim(),
          college: String(findRowValue(row, ['College/University', 'COLLEGE/UNIVERSITY', 'College', 'college', 'University']) || '').trim(),
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
          alert('No valid candidate names found in uploaded file.');
          return;
        }

        setImportData(formatted);
        setShowImportModal(true);
      } catch {
        alert('Failed to parse Excel file. Please upload a valid .xlsx or .csv file.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save to Local Storage & API
  const saveLocalCandidates = (updatedList: CandidateRecord[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adyapan_imported_onboarding_candidates', JSON.stringify(updatedList));
    }
  };

  // Confirm Bulk Import
  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const createdList: CandidateRecord[] = [];
      for (const item of importData) {
        try {
          const created = await veenaApi.createOnboarding(item);
          createdList.push(created);
        } catch {
          createdList.push({ ...item, id: `imp-${Date.now()}-${Math.random()}` });
        }
      }
      const newTotal = [...createdList, ...candidates];
      setCandidates(newTotal);
      saveLocalCandidates(newTotal);
      setShowImportModal(false);
      setImportData([]);
      alert(`Successfully imported ${createdList.length} candidate(s)!`);
    } catch {
      alert('Import finished.');
    } finally {
      setImporting(false);
    }
  };

  // Save / Update Candidate
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateName.trim()) {
      alert('Please enter Candidate Name');
      return;
    }

    try {
      if (editingCandidate) {
        let updated = { ...editingCandidate, ...form };
        try {
          updated = await veenaApi.updateOnboarding(editingCandidate.id, form);
        } catch {}
        const newTotal = candidates.map((c) => c.id === editingCandidate.id ? updated : c);
        setCandidates(newTotal);
        saveLocalCandidates(newTotal);
        alert('Candidate updated successfully!');
      } else {
        let created = { ...form, id: `cand-${Date.now()}` };
        try {
          created = await veenaApi.createOnboarding(form);
        } catch {}
        const newTotal = [created, ...candidates];
        setCandidates(newTotal);
        saveLocalCandidates(newTotal);
        alert('Candidate added successfully!');
      }
      resetForm();
    } catch {
      alert('Action saved locally.');
      resetForm();
    }
  };

  const handleEdit = (cand: CandidateRecord) => {
    const { id, ...rest } = cand;
    setForm(rest);
    setEditingCandidate(cand);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await veenaApi.deleteOnboarding(id);
    } catch {}
    const newTotal = candidates.filter((c) => c.id !== id);
    setCandidates(newTotal);
    saveLocalCandidates(newTotal);
  };

  const resetForm = () => {
    setForm({
      candidateName: '',
      phoneNumber: '',
      email: '',
      college: '',
      location: '',
      source: 'LinkedIn',
      roleApplied: 'Sales',
      recruiter: 'Abbu Veena',
      applicationDate: new Date().toISOString().split('T')[0],
      currentStage: 'Screening',
      status: 'Active',
      interviews: '',
      selection: '',
      offers: '',
      joining: '',
      onboarding: '',
      offerRemarks: '',
    });
    setEditingCandidate(null);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            <span>Interviews & Candidate Register</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage candidate recruitment pipeline, import XLSX records and add candidates manually
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadCandidates}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RotateCw className="w-4 h-4" />
          </button>

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
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2 rounded-xl saffron-gradient text-white text-xs font-extrabold shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Candidate Register Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Candidate Register</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">All Stages</option>
              {pipelineStages.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">EMPLOYEE NAME</th>
                <th className="py-3.5 px-4">MOBILE NUMBER</th>
                <th className="py-3.5 px-4">EMAIL</th>
                <th className="py-3.5 px-4">COLLEGE/UNIVERSITY</th>
                <th className="py-3.5 px-4">LOCATION</th>
                <th className="py-3.5 px-4">SOURCE</th>
                <th className="py-3.5 px-4">ROLE APPLIED</th>
                <th className="py-3.5 px-4">RECRUITER</th>
                <th className="py-3.5 px-4">APPLICATION DATE</th>
                <th className="py-3.5 px-4">CURRENT STAGE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">INTERVIEWS</th>
                <th className="py-3.5 px-4">SELECTION</th>
                <th className="py-3.5 px-4">OFFERS</th>
                <th className="py-3.5 px-4">JOINING</th>
                <th className="py-3.5 px-4">ONBOARDING</th>
                <th className="py-3.5 px-4">OFFER REMARKS</th>
                <th className="py-3.5 px-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={18} className="py-8 text-center text-slate-400 font-medium">
                    Loading Candidate Register...
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-12 text-center text-slate-400">
                    No candidate records found. Click "+ Add Candidate" or "Import XLSX" to add records.
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">{c.candidateName}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.phoneNumber || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.email || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.college || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.location || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.source || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.roleApplied || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.recruiter || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{formatExcelDate(c.applicationDate)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.currentStage === 'Joined' || c.currentStage === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        c.currentStage === 'Dropout' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.currentStage || 'Screening'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Joined' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        c.status === 'Rejected' || c.status === 'Dropped' ? 'bg-red-50 text-red-700 border border-red-200' :
                        c.status === 'Active' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.interviews || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.selection || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{formatExcelDate(c.offers)}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{formatExcelDate(c.joining)}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.onboarding || '-'}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.offerRemarks || '-'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-600 transition-colors cursor-pointer"
                          title="Edit Candidate"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors cursor-pointer"
                          title="Delete Candidate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={filteredCandidates.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Manual Add / Edit Candidate Popup Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between saffron-gradient text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h3 className="text-sm font-black">{editingCandidate ? 'Edit Candidate Details' : 'Add Candidate Manually'}</h3>
              </div>
              <button
                onClick={resetForm}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ankit Verma"
                    value={form.candidateName}
                    onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. candidate@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">College / University</label>
                  <input
                    type="text"
                    placeholder="e.g. IIT Kanpur / Delhi University"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Naukri">Naukri</option>
                    <option value="College">College Campus</option>
                    <option value="Referral">Referral</option>
                    <option value="Direct">Direct Application</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Applied</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Specialist"
                    value={form.roleApplied}
                    onChange={(e) => setForm({ ...form, roleApplied: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Application Date</label>
                  <input
                    type="date"
                    value={form.applicationDate}
                    onChange={(e) => setForm({ ...form, applicationDate: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Stage</label>
                  <select
                    value={form.currentStage}
                    onChange={(e) => setForm({ ...form, currentStage: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                  >
                    {pipelineStages.map((s, i) => (
                      <option key={i} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-bold cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Selected">Selected</option>
                    <option value="Joined">Joined</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Interviews Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Round 1 Cleared"
                    value={form.interviews}
                    onChange={(e) => setForm({ ...form, interviews: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Offer Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Offer Accepted"
                    value={form.offerRemarks}
                    onChange={(e) => setForm({ ...form, offerRemarks: e.target.value })}
                    className="w-full bg-slate-50 text-slate-900 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl saffron-gradient text-white font-bold shadow-md shadow-orange-500/20 hover:opacity-95 transition-all cursor-pointer"
                >
                  {editingCandidate ? 'Update Candidate' : 'Save Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* XLSX Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                  Candidates Import Preview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{importData.length} records ready to import</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto flex-1 border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Mobile</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">College</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importData.map((row: any, i) => (
                    <tr key={i} className="hover:bg-orange-50/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.candidateName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row.phoneNumber || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row.email || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-700">{row.college || '-'}</td>
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
