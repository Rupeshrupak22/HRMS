'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Search,
  Filter,
  RotateCw,
  Upload,
  Download,
  Plus,
  X,
  Pencil,
  Trash2,
  FileSpreadsheet,
  UserX,
  FileText,
  Target,
  UserCheck,
  ArrowUpRight,
  ClipboardCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { veenaApi } from '@/lib/veena-api';
import { Pagination } from '@/components/Pagination';

interface CandidateRecord {
  id: string;
  candidateId?: string;
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

export function VeenaDashboard() {
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [dropouts, setDropouts] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
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

  const [onboardingList, setOnboardingList] = useState<any[]>([]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Recruitment Candidates strictly from DB
      try {
        const res = await veenaApi.getRecruitment();
        setCandidates(Array.isArray(res) ? res : []);
      } catch {
        setCandidates([]);
      }

      // 2. Onboarding Records strictly from DB
      try {
        const onbRes = await veenaApi.getOnboarding();
        setOnboardingList(Array.isArray(onbRes) ? onbRes : []);
      } catch {
        setOnboardingList([]);
      }

      // 3. Dropouts strictly from DB
      try {
        const dropRes = await veenaApi.getDropouts();
        setDropouts(Array.isArray(dropRes) ? dropRes : []);
      } catch {
        setDropouts([]);
      }

      // 4. Daily Reports strictly from DB
      try {
        const repRes = await veenaApi.getDailyReports();
        setDailyReports(Array.isArray(repRes) ? repRes : []);
      } catch {
        setDailyReports([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = loadAllData;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adyapan_imported_onboarding_candidates');
      localStorage.removeItem('adyapan_imported_dropout_candidates');
    }
    loadAllData();
  }, []);

  // Dynamic Metrics strictly from current stage and status
  const totalCount = candidates.length;

  // 1. Total Rejected: Candidates with status Rejected or selection/offers = Not Selected
  const rejectedCount = candidates.filter((c) => {
    const status = (c.status || '').toLowerCase().trim();
    const stage = (c.currentStage || '').toLowerCase().trim();
    const sel = (c.selection || '').toLowerCase().trim();
    const off = (c.offers || '').toLowerCase().trim();
    return (
      status === 'rejected' ||
      stage === 'rejected' ||
      stage === 'reject' ||
      sel === 'not selected' ||
      off === 'not selected'
    );
  }).length;

  // 2. Offer Released: Candidates strictly in Offer Stage (excluding selection)
  const offerCount = candidates.filter((c) => {
    const stage = (c.currentStage || '').toLowerCase().trim();
    return stage === 'offer' || stage === 'offers';
  }).length;

  // 3. Joining: Candidates strictly in Joining Stage (excluding onboarding)
  const joinedCount = candidates.filter((c) => {
    const stage = (c.currentStage || '').toLowerCase().trim();
    const join = (c.joining || '').toLowerCase().trim();
    return (stage === 'joining' || (join === 'yes' && stage !== 'interviews' && stage !== 'interview' && stage !== 'offer' && stage !== 'offers')) &&
      stage !== 'onboarding' && stage !== 'completed';
  }).length;

  // 4. Dropout Cases
  const dropoutsCount = dropouts.length > 0
    ? dropouts.length
    : candidates.filter(c => {
      const st = (c.status || '').toLowerCase().trim();
      const stg = (c.currentStage || '').toLowerCase().trim();
      return st === 'dropped' || st === 'dropout' || stg === 'dropout' || stg === 'dropped';
    }).length;

  const dailyReportsCount = dailyReports.length;
  const conversionRate = totalCount + dropoutsCount > 0 ? (((joinedCount) / (totalCount + dropoutsCount)) * 100).toFixed(1) : '0';
  const dropoutRate = totalCount + dropoutsCount > 0 ? (((dropoutsCount) / (totalCount + dropoutsCount)) * 100).toFixed(1) : '0';

  // Pipeline Stages strictly reflecting candidates in each current stage
  const pipelineStages = [
    {
      name: 'Application',
      count: candidates.filter((c) => {
        const stg = (c.currentStage || '').toLowerCase().trim();
        return stg === 'application' || stg === 'applied';
      }).length,
    },
    {
      name: 'Screening',
      count: candidates.filter((c) => {
        const stg = (c.currentStage || '').toLowerCase().trim();
        return stg === 'screening';
      }).length,
    },
    {
      name: 'Interview',
      count: candidates.filter((c) => {
        const stg = (c.currentStage || '').toLowerCase().trim();
        return stg === 'interview' || stg === 'interviews';
      }).length,
    },
    {
      name: 'Selection',
      count: candidates.filter((c) => {
        const st = (c.status || '').toLowerCase().trim();
        const sel = (c.selection || '').toLowerCase().trim();
        if (st === 'rejected' || st === 'dropped' || st === 'dropout' || sel === 'not selected' || sel === 'rejected') {
          return false;
        }
        return st === 'selected';
      }).length,
    },
    {
      name: 'Offer',
      count: candidates.filter((c) => {
        const stg = (c.currentStage || '').toLowerCase().trim();
        return stg === 'offer' || stg === 'offers';
      }).length,
    },
    {
      name: 'Joining',
      count: candidates.filter((c) => {
        const stg = (c.currentStage || '').toLowerCase().trim();
        const join = (c.joining || '').toLowerCase().trim();
        return stg === 'joining' || (join === 'yes' && stg !== 'onboarding' && stg !== 'completed' && stg !== 'joined');
      }).length,
    },
    {
      name: 'Onboarding',
      count: onboardingList.length > 0
        ? onboardingList.length
        : candidates.filter((c) => {
            const stg = (c.currentStage || '').toLowerCase().trim();
            const st = (c.status || '').toLowerCase().trim();
            if (st === 'rejected' || st === 'dropped' || st === 'dropout') return false;
            return stg === 'onboarding' || ['active', 'selected', 'joined', 'onboarding'].includes(st);
          }).length,
    },
    {
      name: 'Completed',
      count: candidates.filter((c) => {
        const stg = (c.currentStage || '').toLowerCase().trim();
        const status = (c.status || '').toLowerCase().trim();
        return stg === 'completed' || stg === 'joined' || status === 'joined';
      }).length,
    },
  ];

  const [activeCardFilter, setActiveCardFilter] = useState<string | null>(null);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      (c.candidateName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phoneNumber || '').includes(searchTerm) ||
      (c.college || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.roleApplied || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesCard = true;
    if (activeCardFilter) {
      const stage = (c.currentStage || '').toLowerCase().trim();
      const status = (c.status || '').toLowerCase().trim();
      const sel = (c.selection || '').toLowerCase().trim();
      const off = (c.offers || '').toLowerCase().trim();
      const join = (c.joining || '').toLowerCase().trim();

      if (activeCardFilter.startsWith('stage:')) {
        const targetStage = activeCardFilter.split(':')[1].toLowerCase().trim();
        if (targetStage === 'application') {
          matchesCard = stage === 'application' || stage === 'applied';
        } else if (targetStage === 'screening') {
          matchesCard = stage === 'screening';
        } else if (targetStage === 'interview') {
          matchesCard = stage === 'interview' || stage === 'interviews';
        } else if (targetStage === 'selection') {
          const isNotRejected = status !== 'rejected' && status !== 'dropped' && sel !== 'not selected' && sel !== 'rejected';
          matchesCard = status === 'selected' && isNotRejected;
        } else if (targetStage === 'offer') {
          matchesCard = stage === 'offer' || stage === 'offers';
        } else if (targetStage === 'joining') {
          matchesCard = stage === 'joining' || (join === 'yes' && stage !== 'onboarding' && stage !== 'completed' && stage !== 'joined');
        } else if (targetStage === 'onboarding') {
          const isNotRejected = status !== 'rejected' && status !== 'dropped';
          matchesCard = (stage === 'onboarding' || ['active', 'selected', 'joined', 'onboarding'].includes(status)) && isNotRejected;
        } else if (targetStage === 'completed') {
          matchesCard = stage === 'completed' || stage === 'joined' || status === 'joined';
        } else {
          matchesCard = stage === targetStage;
        }
      } else if (activeCardFilter === 'status:Rejected') {
        matchesCard = Boolean(status === 'rejected' || stage === 'rejected' || stage === 'reject' || sel === 'not selected' || off === 'not selected');
      } else if (activeCardFilter === 'status:Offers') {
        matchesCard = Boolean(stage === 'offer' || stage === 'offers');
      } else if (activeCardFilter === 'status:Joined') {
        matchesCard = Boolean((stage === 'joining' || (join === 'yes' && stage !== 'interviews' && stage !== 'interview' && stage !== 'offer' && stage !== 'offers' && stage !== 'onboarding' && stage !== 'completed')) && status !== 'rejected' && status !== 'dropped');
      }
    }

    let matchesStage = true;
    if (stageFilter) {
      const candStage = (c.currentStage || '').toLowerCase().trim();
      const target = stageFilter.toLowerCase().trim();
      if (target === 'interview' || target === 'interviews') {
        matchesStage = candStage === 'interview' || candStage === 'interviews';
      } else if (target === 'selection' || target === 'selected') {
        const sel = (c.selection || '').toLowerCase().trim();
        const st = (c.status || '').toLowerCase().trim();
        matchesStage = candStage === 'selection' || candStage === 'selected' || sel === 'selected' || st === 'selected';
      } else if (target === 'offer' || target === 'offers') {
        matchesStage = candStage === 'offer' || candStage === 'offers';
      } else if (target === 'joining') {
        const join = (c.joining || '').toLowerCase().trim();
        matchesStage = candStage === 'joining' || join === 'yes';
      } else if (target === 'completed' || target === 'joined') {
        matchesStage = candStage === 'completed' || candStage === 'joined' || (c.status || '').toLowerCase().trim() === 'joined';
      } else {
        matchesStage = candStage === target;
      }
    }

    let matchesStatus = true;
    if (statusFilter) {
      const candStatus = (c.status || '').toLowerCase().trim();
      const target = statusFilter.toLowerCase().trim();
      matchesStatus = candStatus === target;
    }

    return matchesSearch && matchesCard && matchesStage && matchesStatus;
  });

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, stageFilter, statusFilter, activeCardFilter]);

  const paginatedCandidates = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCandidates.slice(start, start + PAGE_SIZE);
  }, [filteredCandidates, page]);

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
          candidateId: String(findRowValue(row, ['Candidate ID', 'CANDIDATE ID', 'CandidateId', 'candidate_id', 'ID', 'Id', 'Emp ID', 'EMP ID', 'Employee ID', 'ID No', 'Candidate_Id']) || '').trim(),
          candidateName: String(findRowValue(row, ['Candidate Name', 'EMPLOYEE NAME', 'Name', 'candidate_name', 'Applicant Name']) || '').trim(),
          phoneNumber: String(findRowValue(row, ['Mobile Number', 'MOBILE NUMBER', 'Phone Number', 'Phone', 'phone', 'Contact']) || '').trim(),
          email: String(findRowValue(row, ['Email', 'EMAIL', 'email', 'Email Address']) || '').trim(),
          college: String(findRowValue(row, ['College/University', 'COLLEGE/UNIVERSITY', 'College', 'college', 'University']) || '').trim(),
          location: String(findRowValue(row, ['Location', 'LOCATION', 'location', 'City']) || '').trim(),
          source: String(findRowValue(row, ['Source', 'SOURCE', 'source']) || 'LinkedIn').trim(),
          roleApplied: String(findRowValue(row, ['Role Applied', 'ROLE APPLIED', 'Role', 'role', 'Position']) || 'Sales').trim(),
          recruiter: String(findRowValue(row, ['Recruiter', 'RECRUITER', 'recruiter']) || 'Abbu Veena').trim(),
          applicationDate: formatExcelDate(findRowValue(row, ['Application Date', 'APPLICATION DATE', 'Application Begin Date', 'Application Start Date', 'Date of Application', 'Applied Date', 'App Date', 'Date', 'date'])),
          currentStage: String(findRowValue(row, ['Current Stage', 'CURRENT STAGE', 'Stage', 'stage']) || 'Screening').trim(),
          status: String(findRowValue(row, ['Status', 'STATUS', 'status']) || 'Active').trim(),
          interviews: String(findRowValue(row, ['Interviews', 'INTERVIEWS', 'interviews']) || '').trim(),
          selection: String(findRowValue(row, ['Selection', 'SELECTION', 'selection']) || '').trim(),
          offers: formatExcelDate(findRowValue(row, ['Offers', 'OFFERS', 'offers', 'Offer Date'])),
          joining: formatExcelDate(findRowValue(row, ['Joining', 'JOINING', 'joining', 'Joining Date', 'DOJ', 'Date of Joining'])),
          onboarding: formatExcelDate(findRowValue(row, ['Onboarding', 'ONBOARDING', 'onboarding', 'Onboarding Date', 'DOJ', 'Date of Joining'])),
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

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      let count = 0;
      try {
        const res = await veenaApi.createRecruitmentBulk(importData);
        count = res?.count || importData.length;
      } catch (bulkErr) {
        console.warn('Bulk endpoint fallback to individual creation:', bulkErr);
        for (const item of importData) {
          try {
            await veenaApi.createRecruitment(item);
            count++;
          } catch (err) {
            console.error('Failed to create candidate in DB:', item, err);
          }
        }
      }
      await loadAllData();
      setShowImportModal(false);
      setImportData([]);
      alert(`Successfully saved ${count} candidate(s) directly to Database!`);
    } catch {
      await loadAllData();
      alert('Import finished.');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateName.trim()) {
      alert('Please enter Candidate Name');
      return;
    }

    try {
      if (editingCandidate) {
        await veenaApi.updateRecruitment(editingCandidate.id, form);
        alert('Candidate updated successfully in Database!');
      } else {
        await veenaApi.createRecruitment(form);
        alert('Candidate added successfully to Database!');
      }
      await loadAllData();
      resetForm();
    } catch (e: any) {
      alert('Error saving record: ' + (e?.message || 'Failed'));
      await loadAllData();
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
      await veenaApi.deleteRecruitment(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
    await loadAllData();
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
      {/* Top Banner - Matches Image Design */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Recruitment & Onboarding</h1>
            <p className="text-xs text-orange-100 mt-0.5">
              End-to-end recruitment pipeline — from application to onboarding
            </p>
          </div>
        </div>
      </div>

      {/* HIRING PIPELINE Stages Row */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-400 tracking-wider uppercase">HIRING PIPELINE</h2>
          {activeCardFilter && (
            <button
              onClick={() => setActiveCardFilter(null)}
              className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Clear Card Filter</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {pipelineStages.map((stg, i) => {
            const isSelected = activeCardFilter === `stage:${stg.name}`;
            return (
              <button
                key={i}
                onClick={() => setActiveCardFilter(isSelected ? null : `stage:${stg.name}`)}
                className={`p-3 rounded-2xl text-center space-y-1 transition-all cursor-pointer border ${isSelected
                    ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200 shadow-sm'
                    : 'bg-slate-50/80 border-slate-100 hover:border-orange-300'
                  }`}
              >
                <div className={`text-[10px] font-bold uppercase ${isSelected ? 'text-orange-600' : 'text-slate-500'}`}>
                  {stg.name}
                </div>
                <div className={`text-xl font-black ${isSelected ? 'text-orange-600' : 'text-slate-900'}`}>
                  {stg.count}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 text-slate-700 hover:text-orange-600 text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-orange-500" />
          <span>Recruitment Tracker</span>
        </Link>
        <Link
          href="/interviews"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 text-slate-700 hover:text-orange-600 text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
        >
          <Users className="w-4 h-4 text-blue-500" />
          <span>Interviews &amp; Candidates</span>
        </Link>
        <Link
          href="/onboarding"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 text-slate-700 hover:text-orange-600 text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
        >
          <Target className="w-4 h-4 text-indigo-500" />
          <span>Onboarding Pipeline</span>
        </Link>
        <Link
          href="/dropouts"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:border-rose-400 text-slate-700 hover:text-rose-600 text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
        >
          <UserX className="w-4 h-4 text-rose-500" />
          <span>Dropout Tracker ({dropoutsCount})</span>
        </Link>
        <Link
          href="/daily-reports"
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-amber-600 text-xs font-bold transition-all shadow-2xs whitespace-nowrap cursor-pointer"
        >
          <FileText className="w-4 h-4 text-amber-500" />
          <span>Daily Reports ({dailyReportsCount})</span>
        </Link>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. TOTAL CANDIDATES (Recruitment) */}
        <button
          onClick={() => setActiveCardFilter(activeCardFilter === 'all' ? null : 'all')}
          className={`p-5 rounded-3xl border shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${activeCardFilter === 'all' ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200' : 'bg-white border-slate-200 hover:border-orange-300'
            }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL RECRUITMENT</div>
            <div className="text-3xl font-black text-slate-900 mt-1">{totalCount}</div>
            <div className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↗ Active Candidates</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Users className="w-6 h-6" />
          </div>
        </button>

        {/* 2. TOTAL REJECTED */}
        <button
          onClick={() => setActiveCardFilter(activeCardFilter === 'status:Rejected' ? null : 'status:Rejected')}
          className={`p-5 rounded-3xl border shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${activeCardFilter === 'status:Rejected' ? 'bg-red-50 border-red-400 ring-2 ring-red-200' : 'bg-white border-slate-200 hover:border-red-300'
            }`}
        >
          <div>
            <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">TOTAL REJECTED</div>
            <div className="text-3xl font-black text-red-600 mt-1">{rejectedCount}</div>
            <div className="text-[10px] font-bold text-red-700 mt-1">
              Not Selected / Rejected
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <UserX className="w-6 h-6" />
          </div>
        </button>

        {/* 3. OFFERS RELEASED */}
        <button
          onClick={() => setActiveCardFilter(activeCardFilter === 'status:Offers' ? null : 'status:Offers')}
          className={`p-5 rounded-3xl border shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${activeCardFilter === 'status:Offers' ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200' : 'bg-white border-indigo-200 hover:border-indigo-400'
            }`}
        >
          <div>
            <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">OFFERS RELEASED</div>
            <div className="text-3xl font-black text-indigo-600 mt-1">{offerCount}</div>
            <div className="text-[10px] font-bold text-indigo-700 mt-1">
              Offer Stage Candidates
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Award className="w-6 h-6" />
          </div>
        </button>

        {/* 4. JOINING */}
        <button
          onClick={() => setActiveCardFilter(activeCardFilter === 'status:Joined' ? null : 'status:Joined')}
          className={`p-5 rounded-3xl border shadow-xs flex items-center justify-between text-left transition-all cursor-pointer ${activeCardFilter === 'status:Joined' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200' : 'bg-white border-emerald-200 hover:border-emerald-400'
            }`}
        >
          <div>
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">JOINING</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">{joinedCount}</div>
            <div className="text-[10px] font-bold text-emerald-700 mt-1">
              Confirmed Joining Stage
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </button>

        {/* 5. DROPOUT CASES */}
        <Link
          href="/dropouts"
          className="p-5 rounded-3xl border border-slate-200 hover:border-rose-400 bg-white hover:bg-rose-50/30 shadow-xs flex items-center justify-between text-left transition-all cursor-pointer group"
        >
          <div>
            <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">DROPOUT CASES</div>
            <div className="text-3xl font-black text-rose-600 mt-1">{dropoutsCount}</div>
            <div className="text-[10px] font-bold text-rose-500 mt-1">
              {dropoutRate}% Dropout Rate
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
            <UserX className="w-6 h-6" />
          </div>
        </Link>
      </div>

      {/* Control Bar: Search, Filters, Refresh, Import, Template, Add Candidate */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-colors font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="">All Stages</option>
              {pipelineStages.map((s, i) => (
                <option key={i} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadAllData}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <label className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer flex items-center justify-center" title="Import XLSX/CSV">
            <Upload className="w-4 h-4" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleDownloadTemplate}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Download Template"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-5 py-2.5 rounded-2xl saffron-gradient text-white text-xs font-extrabold shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Candidate Register Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">Candidate Register</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Showing {filteredCandidates.length} of {candidates.length} candidates
          </p>
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
                paginatedCandidates.map((c, idx) => (
                  <tr key={c.id || idx} className="hover:bg-orange-50/20 transition-colors">
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${c.currentStage === 'Joined' || c.currentStage === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          c.currentStage === 'Dropout' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        {c.currentStage || 'Screening'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'Joined' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
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
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">{formatExcelDate(c.joining)}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{formatExcelDate(c.onboarding)}</td>
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
                <UserPlus className="w-5 h-5" />
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
                      <option key={i} value={s.name}>{s.name}</option>
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
