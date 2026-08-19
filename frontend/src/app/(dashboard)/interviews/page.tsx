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
  CheckCircle2,
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
    const d = String(val.getUTCDate()).padStart(2, '0');
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const y = val.getUTCFullYear();
    return `${d}-${m}-${y}`;
  }

  if (typeof val === 'number') {
    const utcDays = val - 25569;
    const utcMs = Math.round(utcDays * 86400 * 1000);
    const date = new Date(utcMs + 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      const d = String(date.getUTCDate()).padStart(2, '0');
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const y = date.getUTCFullYear();
      return `${d}-${m}-${y}`;
    }
  }

  const str = String(val).trim();
  if (!str || str === '-') return '-';

  const lower = str.toLowerCase();
  if (['sent', 'not selected', 'selected', 'yes', 'no', 'done', 'pending', 'active', 'rejected', 'dropped', 'none', 'n/a', 'na'].includes(lower)) {
    return str;
  }

  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, '0');
    const m = ddmmyyyy[2].padStart(2, '0');
    let y = ddmmyyyy[3];
    if (y.length === 2) y = '20' + y;
    return `${d}-${m}-${y}`;
  }

  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) {
    const y = yyyymmdd[1];
    const m = yyyymmdd[2].padStart(2, '0');
    const d = yyyymmdd[3].padStart(2, '0');
    return `${d}-${m}-${y}`;
  }

  const monthNameMatch = str.match(/^(\d{1,2})[-\s/](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s/](\d{2,4})/i) || str.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{2,4})/i);
  if (monthNameMatch) {
    const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    let d = '01';
    let m = '01';
    let y = '2026';
    if (isNaN(Number(monthNameMatch[1]))) {
      m = months[monthNameMatch[1].toLowerCase().slice(0, 3)] || '01';
      d = String(monthNameMatch[2]).padStart(2, '0');
      y = monthNameMatch[3];
    } else {
      d = String(monthNameMatch[1]).padStart(2, '0');
      m = months[monthNameMatch[2].toLowerCase().slice(0, 3)] || '01';
      y = monthNameMatch[3];
    }
    if (y.length === 2) y = '20' + y;
    return `${d}-${m}-${y}`;
  }

  if (str.includes('GMT') || str.includes('India Standard Time') || str.includes('IST') || str.includes('T')) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getUTCDate()).padStart(2, '0');
      const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
      const y = parsed.getUTCFullYear();
      return `${d}-${m}-${y}`;
    }
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
    currentStage: 'Interview',
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
      // Strictly fetch directly from Recruitment table
      const res = await veenaApi.getRecruitment();
      if (Array.isArray(res)) {
        setCandidates(
          res.map((c: any) => ({
            id: c.id,
            candidateName: c.candidateName || c.employeeName || '',
            phoneNumber: c.phoneNumber || c.mobileNumber || '',
            email: c.email || '',
            college: c.college || c.collegeUniversity || '',
            location: c.location || '',
            source: c.source || 'Direct',
            roleApplied: c.roleApplied || 'Sales',
            recruiter: c.recruiter || 'Abbu Veena',
            applicationDate: c.applicationDate || '',
            currentStage: c.currentStage || 'Interview',
            status: c.status || 'Active',
            interviews: c.interviews || '',
            selection: c.selection || '',
            offers: c.offers || '',
            joining: c.joining || '',
            onboarding: c.onboarding || '',
            offerRemarks: c.offerRemarks || c.remarks || '',
          }))
        );
      } else {
        setCandidates([]);
      }
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear any legacy localStorage onboarding cache
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adyapan_imported_onboarding_candidates');
    }
    loadCandidates();
  }, []);

  const pipelineStages = ['Application', 'Screening', 'Interview', 'Selection', 'Offer', 'Joining', 'Onboarding', 'Completed'];

  // Filtering Logic
  const filteredCandidates = candidates.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (c.candidateName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phoneNumber || '').includes(q) ||
      (c.college || '').toLowerCase().includes(q) ||
      (c.roleApplied || '').toLowerCase().includes(q) ||
      (c.recruiter || '').toLowerCase().includes(q);

    const matchesStage = !stageFilter || (c.currentStage || '').toLowerCase() === stageFilter.toLowerCase();
    const matchesStatus = !statusFilter || (c.status || '').toLowerCase() === statusFilter.toLowerCase();
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
        'Phone': '9876543210',
        'Email': 'ankit.verma@example.com',
        'College': 'IIT Kanpur',
        'Location': 'Bangalore',
        'Source': 'LinkedIn',
        'Role Applied': 'Sales',
        'Recruiter': 'Abbu Veena',
        'App Date': '12-08-2026',
        'Stage': 'Interview',
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
    XLSX.utils.book_append_sheet(wb, ws, 'Recruitment Candidates');
    XLSX.writeFile(wb, 'Interviews_Candidates_Template.xlsx');
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

        const formatted = jsonData
          .map((row) => ({
            candidateName: String(
              findRowValue(row, ['Candidate Name', 'CandidateName', 'candidate_name', 'Employee Name', 'Name', 'Applicant Name']) || ''
            ).trim(),
            phoneNumber: String(
              findRowValue(row, ['Phone', 'Mobile Number', 'Phone Number', 'phone', 'Mobile', 'Contact']) || ''
            ).trim(),
            email: String(findRowValue(row, ['Email', 'EMAIL', 'email', 'Email Address']) || '').trim(),
            college: String(
              findRowValue(row, ['College', 'College/University', 'COLLEGE', 'college', 'University']) || ''
            ).trim(),
            location: String(findRowValue(row, ['Location', 'LOCATION', 'location', 'City']) || '').trim(),
            source: String(findRowValue(row, ['Source', 'SOURCE', 'source']) || 'Direct').trim(),
            roleApplied: String(findRowValue(row, ['Role Applied', 'Role', 'role', 'Position', 'Designation']) || 'Sales').trim(),
            recruiter: String(findRowValue(row, ['Recruiter', 'RECRUITER', 'recruiter']) || 'Abbu Veena').trim(),
            applicationDate: formatExcelDate(
              findRowValue(row, ['App Date', 'Application Date', 'AppDate', 'Date', 'date', 'Applied Date'])
            ),
            currentStage: String(findRowValue(row, ['Stage', 'Current Stage', 'stage', 'current_stage']) || 'Interview').trim(),
            status: String(findRowValue(row, ['Status', 'STATUS', 'status']) || 'Active').trim(),
            interviews: String(findRowValue(row, ['Interviews', 'INTERVIEWS', 'interviews', 'Interview']) || '').trim(),
            selection: String(findRowValue(row, ['Selection', 'SELECTION', 'selection']) || '').trim(),
            offers: formatExcelDate(findRowValue(row, ['Offers', 'OFFERS', 'offers', 'Offer Date'])),
            joining: formatExcelDate(findRowValue(row, ['Joining', 'JOINING', 'joining', 'Joining Date', 'DOJ'])),
            onboarding: formatExcelDate(findRowValue(row, ['Onboarding', 'ONBOARDING', 'onboarding', 'Onboarding Date'])),
            offerRemarks: String(
              findRowValue(row, ['Offer Remarks', 'Remarks', 'OfferRemarks', 'remarks', 'Notes', 'Comment']) || ''
            ).trim(),
          }))
          .filter((r) => r.candidateName);

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

  // Confirm Bulk Import
  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      let count = 0;
      for (const item of importData) {
        try {
          await veenaApi.createRecruitment(item);
          count++;
        } catch (err) {
          console.error('Failed to import recruitment candidate:', err);
        }
      }
      loadCandidates();
      setShowImportModal(false);
      setImportData([]);
      alert(`Successfully imported ${count} candidate(s) to Recruitment!`);
    } catch {
      loadCandidates();
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
        await veenaApi.updateRecruitment(editingCandidate.id, form);
        alert('Candidate updated successfully in Recruitment!');
      } else {
        await veenaApi.createRecruitment(form);
        alert('Candidate added successfully to Recruitment!');
      }
      loadCandidates();
      setShowAddModal(false);
      setEditingCandidate(null);
      resetForm();
    } catch (err: any) {
      alert('Error saving record: ' + (err?.message || 'Failed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this candidate?')) return;
    try {
      await veenaApi.deleteRecruitment(id);
      loadCandidates();
    } catch (err) {
      console.error('Delete error:', err);
    }
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
      currentStage: 'Interview',
      status: 'Active',
      interviews: '',
      selection: '',
      offers: '',
      joining: '',
      onboarding: '',
      offerRemarks: '',
    });
    setEditingCandidate(null);
  };

  const handleEditClick = (c: CandidateRecord) => {
    setEditingCandidate(c);
    setForm({
      candidateName: c.candidateName,
      phoneNumber: c.phoneNumber,
      email: c.email,
      college: c.college,
      location: c.location,
      source: c.source,
      roleApplied: c.roleApplied,
      recruiter: c.recruiter,
      applicationDate: c.applicationDate,
      currentStage: c.currentStage,
      status: c.status,
      interviews: c.interviews,
      selection: c.selection,
      offers: c.offers,
      joining: c.joining,
      onboarding: c.onboarding,
      offerRemarks: c.offerRemarks,
    });
    setShowAddModal(true);
  };

  const exportCSV = () => {
    const headers = [
      'Candidate Name',
      'Phone',
      'Email',
      'College',
      'Location',
      'Source',
      'Role Applied',
      'Recruiter',
      'App Date',
      'Stage',
      'Status',
      'Interviews',
      'Selection',
      'Offers',
      'Joining',
      'Onboarding',
      'Offer Remarks',
    ];
    const rows = filteredCandidates.map((c) => [
      c.candidateName,
      c.phoneNumber,
      c.email,
      c.college,
      c.location,
      c.source,
      c.roleApplied,
      c.recruiter,
      c.applicationDate,
      c.currentStage,
      c.status,
      c.interviews,
      c.selection,
      c.offers,
      c.joining,
      c.onboarding,
      c.offerRemarks,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interviews-candidates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Interviews &amp; Candidates</h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Recruitment candidates &amp; interview evaluation pipeline ({candidates.length} total)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadCandidates}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Template
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-orange-600" />
            Import XLSX
          </button>
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates by name, email, phone, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="">All Stages</option>
            {pipelineStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="In Progress">In Progress</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
            <option value="Joined">Joined</option>
            <option value="Dropped">Dropped</option>
            <option value="On Hold">On Hold</option>
          </select>

          {(stageFilter || statusFilter || searchTerm) && (
            <button
              onClick={() => {
                setStageFilter('');
                setStatusFilter('');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 px-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Candidate Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">College</th>
                <th className="py-3.5 px-4">Role Applied</th>
                <th className="py-3.5 px-4">Recruiter</th>
                <th className="py-3.5 px-4">App Date</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Interviews</th>
                <th className="py-3.5 px-4">Selection</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12 text-slate-400 font-medium">
                    No candidates found in Recruitment table.
                  </td>
                </tr>
              ) : (
                paginatedCandidates.map((cand, idx) => (
                  <tr key={cand.id || idx} className="hover:bg-orange-50/30 transition-colors whitespace-nowrap">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{cand.candidateName}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{cand.phoneNumber || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{cand.email || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{cand.college || '-'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{cand.roleApplied || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{cand.recruiter || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{cand.applicationDate || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        {cand.currentStage || 'Interview'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {cand.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{cand.interviews || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{cand.selection || '-'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(cand)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cand.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          title="Delete"
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

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100">
          <Pagination
            currentPage={page}
            totalItems={filteredCandidates.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Candidate Name *</label>
                  <input
                    type="text"
                    required
                    value={form.candidateName}
                    onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    placeholder="e.g. rahul@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">College</label>
                  <input
                    type="text"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    placeholder="e.g. IIT Delhi"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    placeholder="e.g. Bangalore"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Role Applied</label>
                  <input
                    type="text"
                    value={form.roleApplied}
                    onChange={(e) => setForm({ ...form, roleApplied: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    placeholder="e.g. Sales"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Stage</label>
                  <select
                    value={form.currentStage}
                    onChange={(e) => setForm({ ...form, currentStage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  >
                    {pipelineStages.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Selected">Selected</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Joined">Joined</option>
                    <option value="Dropped">Dropped</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Interviews Notes</label>
                  <input
                    type="text"
                    value={form.interviews}
                    onChange={(e) => setForm({ ...form, interviews: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    placeholder="e.g. Round 1 Cleared, scheduled for Technical"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Offer Remarks</label>
                  <input
                    type="text"
                    value={form.offerRemarks}
                    onChange={(e) => setForm({ ...form, offerRemarks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    placeholder="e.g. Strong technical performance"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 cursor-pointer"
                >
                  {editingCandidate ? 'Update Candidate' : 'Save Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Confirm Recruitment Import</h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {importData.length} candidate(s) ready to import directly into Recruitment table
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border rounded-2xl">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 border-b">
                  <tr className="text-[10px] font-bold text-slate-500 uppercase">
                    <th className="p-3">#</th>
                    <th className="p-3">Candidate Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {importData.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400 text-[10px]">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{row.candidateName}</td>
                      <td className="p-3 text-slate-600">{row.phoneNumber || '-'}</td>
                      <td className="p-3 text-slate-600">{row.email || '-'}</td>
                      <td className="p-3 text-slate-600">{row.roleApplied || '-'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-50 text-orange-700">
                          {row.currentStage || 'Interview'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700">
                          {row.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-slate-500 font-semibold">
                Will save directly to Database Recruitment table
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirm &amp; Import ({importData.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
