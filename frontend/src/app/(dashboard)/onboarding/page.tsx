'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  RotateCw,
  Upload,
  Download,
  Plus,
  SlidersHorizontal,
  FileSpreadsheet,
  CheckCircle2,
  IdCard,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { veenaApi } from '@/lib/veena-api';
import { Pagination } from '@/components/Pagination';

interface OnboardingRecord {
  id: string;
  employeeId?: string; // Candidate ID e.g. ADP0001
  candidateName: string; // Candidate Name
  phoneNumber: string; // Mobile Number
  email: string;
  college: string; // College/University
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
  offerRemarks: string; // Remarks
}

const SOURCE_OPTIONS = ['College', 'LinkedIn', 'Naukri', 'Referral', 'Job Portal', 'Walk-in', 'Direct', 'Other'];
const STAGE_OPTIONS = ['Joining', 'Documentation', 'Verification', 'Induction', 'IT Assets', 'Training', 'Onboarding', 'Completed', 'Application', 'Screening', 'Interview', 'Selection', 'Offer'];
const STATUS_OPTIONS = ['Active', 'Joined', 'In Progress', 'Pending', 'On Hold', 'Completed', 'Dropped', 'Selected'];
const ROLE_OPTIONS = ['Sales', 'HR', 'Operational Team', 'Tech', 'Team Leader', 'Academic', 'Marketing', 'Finance'];

// Bulletproof date formatter: strictly outputs DD-MM-YYYY and NEVER shifts backward by one day
function formatExcelDate(val: any): string {
  if (val === null || val === undefined || val === '' || val === '-') return '-';

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '-';
    // Use UTC date parts so timezone offset never subtracts or shifts a day
    const d = String(val.getUTCDate()).padStart(2, '0');
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const y = val.getUTCFullYear();
    return `${d}-${m}-${y}`;
  }

  if (typeof val === 'number') {
    const utcDays = val - 25569;
    const utcMs = Math.round(utcDays * 86400 * 1000);
    const date = new Date(utcMs + 60 * 60 * 1000); // 1hr buffer to protect against midnight boundary
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

  // Check if DD-MM-YYYY or DD-MM-YY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (ddmmyyyy) {
    const d = ddmmyyyy[1].padStart(2, '0');
    const m = ddmmyyyy[2].padStart(2, '0');
    let y = ddmmyyyy[3];
    if (y.length === 2) y = '20' + y;
    return `${d}-${m}-${y}`;
  }

  // Check if YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) {
    const y = yyyymmdd[1];
    const m = yyyymmdd[2].padStart(2, '0');
    const d = yyyymmdd[3].padStart(2, '0');
    return `${d}-${m}-${y}`;
  }

  // Month name e.g. 15-Aug-2026 or Aug 15 2026
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

export default function OnboardingPage() {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<OnboardingRecord | null>(null);

  // Import XLSX Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const emptyForm: Omit<OnboardingRecord, 'id'> = {
    employeeId: '',
    candidateName: '',
    phoneNumber: '',
    email: '',
    college: '',
    location: '',
    source: 'LinkedIn',
    roleApplied: 'Sales',
    recruiter: 'Abbu Veena',
    applicationDate: new Date().toISOString().split('T')[0],
    currentStage: 'Joining',
    status: 'Active',
    interviews: '',
    selection: 'Selected',
    offers: '',
    joining: 'Yes',
    onboarding: 'Pending BGV',
    offerRemarks: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await veenaApi.getOnboarding();
      if (Array.isArray(data)) {
        setRecords(
          data.map((c: any) => ({
            id: c.id,
            employeeId: c.employeeId || c.candidateId || '',
            candidateName: c.candidateName || c.employeeName || '',
            phoneNumber: c.phoneNumber || c.mobileNumber || '',
            email: c.email || '',
            college: c.college || c.collegeUniversity || '',
            location: c.location || '',
            source: c.source || 'Direct',
            roleApplied: c.roleApplied || 'Sales',
            recruiter: c.recruiter || 'Abbu Veena',
            applicationDate: c.applicationDate || c.joiningDate || '',
            currentStage: c.currentStage || 'Joining',
            status: c.status || 'Active',
            interviews: c.interviews || '',
            selection: c.selection || 'Selected',
            offers: c.offers || '',
            joining: c.joining || '',
            onboarding: c.onboarding || '',
            offerRemarks: c.offerRemarks || c.remarks || '',
          }))
        );
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.employeeId || '').toLowerCase().includes(q) ||
        r.candidateName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phoneNumber.includes(q) ||
        r.college.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.roleApplied.toLowerCase().includes(q) ||
        r.recruiter.toLowerCase().includes(q);

      const matchesRole = !filterRole || r.roleApplied === filterRole;
      const matchesStage = !filterStage || r.currentStage.toLowerCase() === filterStage.toLowerCase();
      const matchesStatus = !filterStatus || r.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesRole && matchesStage && matchesStatus;
    });
  }, [records, searchTerm, filterRole, filterStage, filterStatus]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRole, filterStage, filterStatus]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, page]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!formData.candidateName.trim()) {
      alert('Please enter Candidate Name');
      return;
    }
    try {
      if (editingId) {
        await veenaApi.updateOnboarding(editingId, formData);
        alert('Onboarding candidate updated successfully!');
      } else {
        await veenaApi.createOnboarding(formData);
        alert('Onboarding candidate added successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      loadRecords();
    } catch (err: any) {
      alert('Error saving record: ' + (err?.message || 'Failed'));
    }
  };

  const handleEdit = (record: OnboardingRecord) => {
    setEditingId(record.id);
    setFormData({
      employeeId: record.employeeId || '',
      candidateName: record.candidateName,
      phoneNumber: record.phoneNumber,
      email: record.email,
      college: record.college,
      location: record.location,
      source: record.source,
      roleApplied: record.roleApplied,
      recruiter: record.recruiter,
      applicationDate: record.applicationDate,
      currentStage: record.currentStage,
      status: record.status,
      interviews: record.interviews,
      selection: record.selection,
      offers: record.offers,
      joining: record.joining,
      onboarding: record.onboarding,
      offerRemarks: record.offerRemarks,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this onboarding record?')) {
      try {
        await veenaApi.deleteOnboarding(id);
        loadRecords();
      } catch (err: any) {
        alert('Failed to delete: ' + (err?.message || 'Error'));
      }
    }
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  // Download template with exact requested headers
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Candidate ID': 'ADP0001',
        'Candidate Name': 'Aakash Singhania',
        'Mobile Number': '9876501234',
        'Email': 'aakash.singhania@adyapan.com',
        'College/University': 'BITS Pilani',
        'Location': 'Bangalore',
        'Source': 'Direct',
        'Role Applied': 'Sales',
        'Recruiter': 'Abbu Veena',
        'Application Date': '15-08-2026',
        'Current Stage': 'Joining',
        'Status': 'Joined',
        'Interviews': 'Cleared Final Round',
        'Selection': 'Selected',
        'Offers': '20-08-2026',
        'Joining': '01-09-2026',
        'Onboarding': 'Completed',
        'Remarks': 'Completed BGV and documentation',
      },
      {
        'Candidate ID': '',
        'Candidate Name': 'Sneha Nair',
        'Mobile Number': '9876505678',
        'Email': 'sneha.nair@adyapan.com',
        'College/University': 'Christ University',
        'Location': 'Bangalore',
        'Source': 'Referral',
        'Role Applied': 'HR',
        'Recruiter': 'Abbu Veena',
        'Application Date': '18-08-2026',
        'Current Stage': 'Induction',
        'Status': 'Active',
        'Interviews': 'Cleared Round 2',
        'Selection': 'Selected',
        'Offers': '22-08-2026',
        'Joining': '05-09-2026',
        'Onboarding': 'In Progress',
        'Remarks': 'Laptop assigned',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Onboarding Register');
    XLSX.writeFile(wb, 'Onboarding_Register_Template.xlsx');
  };

  // Upload Excel with exact alias matching for Candidate ID, Candidate Name, Mobile Number, Email, College/University, Location, Source, Role Applied, Recruiter, Application Date, Current Stage, Status, Interviews, Selection, Offers, Joining, Onboarding, Remarks
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

        const formatted = jsonData
          .map((row) => {
            const candIdVal = String(
              findRowValue(row, [
                'Candidate ID',
                'CANDIDATE ID',
                'CandidateId',
                'candidate_id',
                'Candidate ID / ADP ID',
                'Employee ID',
                'EMPLOYEE ID',
                'EmployeeId',
                'employee_id',
                'Emp ID',
                'EMP ID',
                'Emp Id',
                'ID',
                'Id',
                'ADP ID',
                'ADP Id',
              ]) || ''
            ).trim();

            return {
              employeeId: candIdVal,
              candidateName: String(
                findRowValue(row, [
                  'Candidate Name',
                  'CANDIDATE NAME',
                  'CandidateName',
                  'candidate_name',
                  'Employee Name',
                  'EMPLOYEE NAME',
                  'EmployeeName',
                  'employee_name',
                  'Name',
                  'Applicant Name',
                ]) || ''
              ).trim(),
              phoneNumber: String(
                findRowValue(row, ['Mobile Number', 'MOBILE NUMBER', 'MobileNumber', 'mobile_number', 'Phone Number', 'Phone', 'phone', 'Contact']) || ''
              ).trim(),
              email: String(findRowValue(row, ['Email', 'EMAIL', 'email', 'Official Email', 'Work Email', 'Email Address']) || '').trim(),
              college: String(
                findRowValue(row, ['College/University', 'COLLEGE/UNIVERSITY', 'College', 'college', 'University', 'College University']) || ''
              ).trim(),
              location: String(findRowValue(row, ['Location', 'LOCATION', 'location', 'City', 'Work Location']) || '').trim(),
              source: String(findRowValue(row, ['Source', 'SOURCE', 'source']) || 'Direct').trim(),
              roleApplied: String(findRowValue(row, ['Role Applied', 'ROLE APPLIED', 'Role', 'role', 'Designation', 'Position']) || 'Sales').trim(),
              recruiter: String(findRowValue(row, ['Recruiter', 'RECRUITER', 'recruiter']) || 'Abbu Veena').trim(),
              applicationDate: formatExcelDate(
                findRowValue(row, ['Application Date', 'APPLICATION DATE', 'ApplicationDate', 'App Date', 'Applied Date', 'Date', 'date', 'Joining Date', 'DOJ'])
              ),
              currentStage: String(findRowValue(row, ['Current Stage', 'CURRENT STAGE', 'CurrentStage', 'Stage', 'stage']) || 'Joining').trim(),
              status: String(findRowValue(row, ['Status', 'STATUS', 'status']) || 'Active').trim(),
              interviews: String(findRowValue(row, ['Interviews', 'INTERVIEWS', 'interviews', 'Interview']) || '').trim(),
              selection: String(findRowValue(row, ['Selection', 'SELECTION', 'selection']) || 'Selected').trim(),
              offers: formatExcelDate(findRowValue(row, ['Offers', 'OFFERS', 'offers', 'Offer Date'])),
              joining: formatExcelDate(findRowValue(row, ['Joining', 'JOINING', 'joining', 'Joining Date', 'DOJ'])),
              onboarding: formatExcelDate(findRowValue(row, ['Onboarding', 'ONBOARDING', 'onboarding', 'Onboarding Date'])),
              offerRemarks: String(
                findRowValue(row, ['Remarks', 'REMARKS', 'remarks', 'Offer Remarks', 'OFFER REMARKS', 'Notes', 'Comment']) || ''
              ).trim(),
            };
          })
          .filter((r) => r.candidateName);

        if (formatted.length === 0) {
          alert('No valid candidate records found in file. Please ensure Candidate Name column exists.');
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
      let count = 0;
      for (const item of importData) {
        try {
          await veenaApi.createOnboarding(item);
          count++;
        } catch (err) {
          console.error('Failed to import onboarding record:', err);
        }
      }
      loadRecords();
      setShowImportModal(false);
      setImportData([]);
      alert(`Successfully saved ${count} onboarding record(s) to Database!`);
    } catch {
      loadRecords();
      alert('Import process completed.');
    } finally {
      setImporting(false);
    }
  };

  // Export with exact requested headers
  const exportCSV = () => {
    const headers = [
      'Candidate ID',
      'Candidate Name',
      'Mobile Number',
      'Email',
      'College/University',
      'Location',
      'Source',
      'Role Applied',
      'Recruiter',
      'Application Date',
      'Current Stage',
      'Status',
      'Interviews',
      'Selection',
      'Offers',
      'Joining',
      'Onboarding',
      'Remarks',
    ];
    const rows = filteredRecords.map((e) => [
      e.employeeId || '',
      e.candidateName,
      e.phoneNumber,
      e.email,
      e.college,
      e.location,
      e.source,
      e.roleApplied,
      e.recruiter,
      e.applicationDate,
      e.currentStage,
      e.status,
      e.interviews,
      e.selection,
      e.offers,
      e.joining,
      e.onboarding,
      e.offerRemarks,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onboarding-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStageColor = (stage: string) => {
    const s = (stage || '').toLowerCase();
    if (s === 'joining') return 'bg-teal-50 text-teal-700 border-teal-200';
    if (s === 'documentation') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'verification') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (s === 'induction') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (s === 'it assets') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'onboarding') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'completed') return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'joined') return 'bg-green-50 text-green-800 border-green-300';
    if (s === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'in progress') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (s === 'pending') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (s === 'on hold') return 'bg-orange-50 text-orange-700 border-orange-200';
    if (s === 'dropped') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (s === 'selected') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-screen p-4 sm:p-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-6 text-white shadow-xl shadow-orange-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-20 -translate-x-20 blur-xl" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Onboarding Pipeline</h1>
              <p className="text-xs text-orange-100 font-medium mt-0.5">
                End-to-end candidate onboarding, Candidate IDs, verification &amp; joining register
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-xs font-bold border border-white/20">
              Total Onboarding: {records.length}
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Candidate ID, Name, Email, Phone..."
                className="w-full bg-slate-50 text-xs pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:bg-white transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showFilters
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {(filterRole || filterStage || filterStatus) && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">
                  {[filterRole, filterStage, filterStatus].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadRecords}
              className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Template
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-orange-600" />
              Import XLSX
            </button>

            <button
              onClick={exportCSV}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export
            </button>

            <button
              onClick={openNewForm}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Candidate
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-slate-50 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="bg-slate-50 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer"
            >
              <option value="">All Stages</option>
              {STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {(filterRole || filterStage || filterStatus) && (
              <button
                onClick={() => {
                  setFilterRole('');
                  setFilterStage('');
                  setFilterStatus('');
                }}
                className="text-[11px] text-orange-600 font-bold hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-3xl border border-orange-200 shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              <IdCard className="w-4 h-4 text-orange-600" />
              {editingId ? 'Edit Onboarding Candidate' : 'New Onboarding Candidate'}
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Candidate ID (ADP Format)
              </label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="e.g. ADP0001 (leave blank if not yet assigned)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Candidate Name *</label>
              <input
                type="text"
                required
                value={formData.candidateName}
                onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                placeholder="Full Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="10 digit mobile"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="candidate@adyapan.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">College/University</label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="University Name"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Bangalore, Hyderabad..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Role Applied</label>
              <select
                value={formData.roleApplied}
                onChange={(e) => setFormData({ ...formData, roleApplied: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Recruiter</label>
              <input
                type="text"
                value={formData.recruiter}
                onChange={(e) => setFormData({ ...formData, recruiter: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Application Date</label>
              <input
                type="text"
                value={formData.applicationDate}
                onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
                placeholder="DD-MM-YYYY"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Current Stage</label>
              <select
                value={formData.currentStage}
                onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Interviews</label>
              <input
                type="text"
                value={formData.interviews}
                onChange={(e) => setFormData({ ...formData, interviews: e.target.value })}
                placeholder="Interview details"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Selection</label>
              <input
                type="text"
                value={formData.selection}
                onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
                placeholder="Selection status"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Offers</label>
              <input
                type="text"
                value={formData.offers}
                onChange={(e) => setFormData({ ...formData, offers: e.target.value })}
                placeholder="Offer details"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Joining</label>
              <input
                type="text"
                value={formData.joining}
                onChange={(e) => setFormData({ ...formData, joining: e.target.value })}
                placeholder="Joining date / status"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Onboarding</label>
              <input
                type="text"
                value={formData.onboarding}
                onChange={(e) => setFormData({ ...formData, onboarding: e.target.value })}
                placeholder="Onboarding status"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Remarks</label>
              <input
                type="text"
                value={formData.offerRemarks}
                onChange={(e) => setFormData({ ...formData, offerRemarks: e.target.value })}
                placeholder="BGV completed, asset assigned..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/20 cursor-pointer"
            >
              {editingId ? 'Update Candidate' : 'Save Candidate'}
            </button>
          </div>
        </form>
      )}

      {/* Onboarding Register Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Onboarding Candidate Register</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Showing {filteredRecords.length} of {records.length} onboarding candidates
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Candidate ID</th>
                <th className="py-3 px-3">Candidate Name</th>
                <th className="py-3 px-3">Mobile Number</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">College/University</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Role Applied</th>
                <th className="py-3 px-3">Recruiter</th>
                <th className="py-3 px-3">Application Date</th>
                <th className="py-3 px-3">Current Stage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Interviews</th>
                <th className="py-3 px-3">Selection</th>
                <th className="py-3 px-3">Offers</th>
                <th className="py-3 px-3">Joining</th>
                <th className="py-3 px-3">Onboarding</th>
                <th className="py-3 px-3">Remarks</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={20} className="text-center py-12 text-slate-400 font-medium">
                    No onboarding candidates found. Candidates with Stage &quot;Joining&quot; and Status &quot;Active&quot; from Recruitment will automatically appear here.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, index) => (
                  <tr key={r.id} className="hover:bg-orange-50/30 transition-colors whitespace-nowrap">
                    <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="py-3 px-3">
                      {r.employeeId ? (
                        <span className="px-2.5 py-1 rounded-xl bg-orange-100 text-orange-800 font-mono font-bold text-[11px] border border-orange-200">
                          {r.employeeId}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{r.candidateName}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{r.phoneNumber || '-'}</td>
                    <td className="py-3 px-3 text-slate-600">{r.email || '-'}</td>
                    <td className="py-3 px-3 text-slate-600">{r.college || '-'}</td>
                    <td className="py-3 px-3 text-slate-600">{r.location || '-'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {r.source || 'Direct'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{r.roleApplied || '-'}</td>
                    <td className="py-3 px-3 text-slate-600">{r.recruiter || '-'}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{r.applicationDate || '-'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStageColor(
                          r.currentStage
                        )}`}
                      >
                        {r.currentStage || 'Joining'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(
                          r.status
                        )}`}
                      >
                        {r.status || 'Joined'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{r.interviews || '-'}</td>
                    <td className="py-3 px-3 text-slate-600">{r.selection || '-'}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{r.offers || '-'}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{r.joining || '-'}</td>
                    <td className="py-3 px-3 text-slate-600">{r.onboarding || '-'}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-[150px] truncate" title={r.offerRemarks}>
                      {r.offerRemarks || '-'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingRecord(r)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                          title="Edit & Assign Candidate ID"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
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
            totalItems={filteredRecords.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* View Details Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  {viewingRecord.candidateName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{viewingRecord.candidateName}</h3>
                    {viewingRecord.employeeId && (
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-mono font-bold text-[10px]">
                        {viewingRecord.employeeId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">{viewingRecord.roleApplied} • {viewingRecord.source}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Candidate ID</p>
                <p className="font-bold text-orange-600 font-mono text-sm mt-0.5">{viewingRecord.employeeId || 'Not Assigned (-)'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Application Date</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.applicationDate || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.phoneNumber || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                <p className="font-semibold text-slate-800 mt-0.5 truncate">{viewingRecord.email || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">College/University</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.college || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.location || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Current Stage</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStageColor(viewingRecord.currentStage)}`}>
                  {viewingRecord.currentStage}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(viewingRecord.status)}`}>
                  {viewingRecord.status}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Interviews</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.interviews || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Selection</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.selection || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Offers</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.offers || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Joining</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.joining || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Onboarding</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.onboarding || '-'}</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Remarks</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingRecord.offerRemarks || '-'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding XLSX Import Confirmation Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Confirm Onboarding XLSX Import</h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {importData.length} onboarding candidate record(s) ready to import to Database
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
                    <th className="p-3">Candidate ID</th>
                    <th className="p-3">Candidate Name</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">App Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {importData.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400 text-[10px]">{idx + 1}</td>
                      <td className="p-3">
                        {row.employeeId ? (
                          <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 font-mono font-bold text-[10px]">
                            {row.employeeId}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">-</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{row.candidateName}</td>
                      <td className="p-3 text-slate-600">{row.phoneNumber || '-'}</td>
                      <td className="p-3 text-slate-600">{row.email || '-'}</td>
                      <td className="p-3 text-slate-600">{row.roleApplied || '-'}</td>
                      <td className="p-3 text-slate-600 font-mono text-[10px]">{row.applicationDate || '-'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700">
                          {row.status || 'Joined'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importData.length > 50 && (
                <div className="p-3 bg-slate-50 text-center text-xs text-slate-500 font-medium">
                  + {importData.length - 50} more records...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-slate-500 font-semibold">
                Will insert directly into PostgreSQL Database under Onboarding table
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
