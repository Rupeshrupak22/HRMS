'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Users,
  ClipboardCheck,
  TrendingUp,
  Award,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  Upload,
  Download,
  Plus,
  SlidersHorizontal,
} from 'lucide-react';

interface RecruitmentEntry {
  id: string;
  employeeName: string;
  mobileNumber: string;
  email: string;
  collegeUniversity: string;
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
  remarks: string;
}

const SOURCE_OPTIONS = ['College', 'LinkedIn', 'Naukri', 'Referral', 'Job Portal', 'Walk-in', 'Other'];
const STAGE_OPTIONS = ['Application', 'Screening', 'Interview', 'Selection', 'Offer', 'Joining', 'Onboarding', 'Completed'];
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Selected', 'Rejected', 'On Hold', 'Joined', 'Dropped'];
const ROLE_OPTIONS = ['Sales', 'HR', 'Operational Team', 'Tech', 'Team Leader', 'Academic', 'Marketing', 'Finance'];

export default function RecruitmentTrackerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = useState<RecruitmentEntry | null>(null);
  const [entries, setEntries] = useState<RecruitmentEntry[]>([]);

  const emptyForm = {
    employeeName: '', mobileNumber: '', email: '', collegeUniversity: '',
    location: '', source: '', roleApplied: '', recruiter: '', applicationDate: '',
    currentStage: 'Application', status: 'Pending', interviews: '', selection: '',
    offers: '', joining: '', onboarding: '', remarks: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.mobileNumber.includes(searchTerm) ||
      e.recruiter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || e.roleApplied === filterRole;
    const matchesStage = !filterStage || e.currentStage === filterStage;
    const matchesStatus = !filterStatus || e.status === filterStatus;
    return matchesSearch && matchesRole && matchesStage && matchesStatus;
  });

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [ev.target.name]: ev.target.value }));
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (editingId) {
      setEntries((prev) => prev.map((e) => e.id === editingId ? { ...e, ...formData } : e));
      setEditingId(null);
    } else {
      setEntries((prev) => [{ id: `REC-${String(prev.length + 1).padStart(3, '0')}`, ...formData }, ...prev]);
    }
    setFormData(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (entry: RecruitmentEntry) => {
    setEditingId(entry.id);
    setFormData({
      employeeName: entry.employeeName, mobileNumber: entry.mobileNumber, email: entry.email,
      collegeUniversity: entry.collegeUniversity, location: entry.location, source: entry.source,
      roleApplied: entry.roleApplied, recruiter: entry.recruiter, applicationDate: entry.applicationDate,
      currentStage: entry.currentStage, status: entry.status, interviews: entry.interviews,
      selection: entry.selection, offers: entry.offers, joining: entry.joining,
      onboarding: entry.onboarding, remarks: entry.remarks,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Employee Name', 'Mobile Number', 'Email', 'College/University', 'Location', 'Source', 'Role Applied', 'Recruiter', 'Application Date', 'Current Stage', 'Status', 'Interviews', 'Selection', 'Offers', 'Joining', 'Onboarding', 'Remarks'];
    const rows = filteredEntries.map((e) => [e.id, e.employeeName, e.mobileNumber, e.email, e.collegeUniversity, e.location, e.source, e.roleApplied, e.recruiter, e.applicationDate, e.currentStage, e.status, e.interviews, e.selection, e.offers, e.joining, e.onboarding, e.remarks]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recruitment-onboarding-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (text: string) => {
    const lines = text.split('\n').filter(Boolean);
    if (lines.length < 2) return;
    const newEntries = lines.slice(1).map((line, i) => {
      const cols = line.split(',').map((c) => c.replace(/"/g, '').trim());
      return {
        id: `REC-${String(entries.length + i + 1).padStart(3, '0')}`,
        employeeName: cols[1] || '', mobileNumber: cols[2] || '', email: cols[3] || '',
        collegeUniversity: cols[4] || '', location: cols[5] || '', source: cols[6] || '',
        roleApplied: cols[7] || '', recruiter: cols[8] || '', applicationDate: cols[9] || '',
        currentStage: cols[10] || 'Application', status: cols[11] || 'Pending',
        interviews: cols[12] || '', selection: cols[13] || '', offers: cols[14] || '',
        joining: cols[15] || '', onboarding: cols[16] || '', remarks: cols[17] || '',
      };
    });
    setEntries((prev) => [...newEntries, ...prev]);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Stats
  const joinedCount = entries.filter((e) => e.status === 'Joined').length;
  const inProgressCount = entries.filter((e) => e.status === 'In Progress').length;
  const selectedCount = entries.filter((e) => e.status === 'Selected').length;


  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Application': 'bg-slate-100 text-slate-700 border-slate-200',
      'Screening': 'bg-purple-50 text-purple-700 border-purple-200',
      'Interview': 'bg-blue-50 text-blue-700 border-blue-200',
      'Selection': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Offer': 'bg-amber-50 text-amber-700 border-amber-200',
      'Joining': 'bg-teal-50 text-teal-700 border-teal-200',
      'Onboarding': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Completed': 'bg-green-50 text-green-700 border-green-200',
    };
    return colors[stage] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
      'Selected': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Rejected': 'bg-red-50 text-red-700 border-red-200',
      'On Hold': 'bg-orange-50 text-orange-700 border-orange-200',
      'Joined': 'bg-green-50 text-green-800 border-green-300',
      'Dropped': 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return colors[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-6 text-white shadow-lg shadow-orange-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-20 -translate-x-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Recruitment &amp; Onboarding</h1>
              <p className="text-[11px] text-orange-100 font-medium">
                End-to-end recruitment pipeline — from application to onboarding
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Hiring Pipeline</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {STAGE_OPTIONS.map((stage, idx) => {
            const count = entries.filter((e) => e.currentStage === stage).length;
            return (
              <React.Fragment key={stage}>
                <button
                  onClick={() => { setFilterStage(filterStage === stage ? '' : stage); }}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    filterStage === stage
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <div>{stage}</div>
                  <div className={`text-lg font-black mt-0.5 ${filterStage === stage ? 'text-white' : 'text-slate-900'}`}>{count}</div>
                </button>
                {idx < STAGE_OPTIONS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Candidates</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{entries.length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-slate-500">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600">Active pipeline</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joined</p>
              <p className="text-3xl font-black text-emerald-600 mt-1">{joinedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${entries.length ? (joinedCount / entries.length) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Progress</p>
              <p className="text-3xl font-black text-blue-600 mt-1">{inProgressCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${entries.length ? (inProgressCount / entries.length) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected</p>
              <p className="text-3xl font-black text-orange-600 mt-1">{selectedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${entries.length ? (selectedCount / entries.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidates..."
                className="w-64 bg-slate-50 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:bg-white transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showFilters ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
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
          <div className="flex items-center gap-2">
            <button onClick={() => setEntries([...entries])} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => handleImportCSV(ev.target?.result as string);
              reader.readAsText(file);
              e.target.value = '';
            }} />
            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer" title="Import CSV">
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button onClick={exportCSV} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer" title="Export CSV">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button onClick={openNewForm} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              Add Candidate
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="bg-slate-50 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="bg-slate-50 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
              <option value="">All Stages</option>
              {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {(filterRole || filterStage || filterStatus) && (
              <button onClick={() => { setFilterRole(''); setFilterStage(''); setFilterStatus(''); }} className="text-[11px] text-orange-600 font-bold hover:underline cursor-pointer">
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Candidate Register</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Showing {filteredEntries.length} of {entries.length} candidates</p>
          </div>
          {(searchTerm || filterRole || filterStage || filterStatus) && (
            <button onClick={() => { setSearchTerm(''); setFilterRole(''); setFilterStage(''); setFilterStatus(''); }} className="text-[11px] text-orange-600 font-bold hover:underline cursor-pointer">
              Reset All Filters
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Employee Name</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Mobile Number</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Email</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">College/University</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Location</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Source</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Role Applied</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Recruiter</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Application Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Current Stage</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Interviews</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Selection</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Offers</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Joining</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Onboarding</th>
                <th className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Remarks</th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-orange-50/40 transition-all group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                        {entry.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 whitespace-nowrap text-[11px]">{entry.employeeName}</div>
                        <div className="text-[9px] text-slate-400 font-medium">{entry.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap text-[11px]">{entry.mobileNumber}</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-[11px]">{entry.email}</td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap text-[11px]">{entry.collegeUniversity}</td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap text-[11px]">{entry.location}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold rounded-md whitespace-nowrap">{entry.source}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md whitespace-nowrap">{entry.roleApplied}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap text-[11px]">{entry.recruiter}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap text-[11px]">{entry.applicationDate}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md whitespace-nowrap ${getStageColor(entry.currentStage)}`}>{entry.currentStage}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-md whitespace-nowrap ${getStatusColor(entry.status)}`}>{entry.status}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-[11px]">{entry.interviews || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-[11px]">{entry.selection || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-[11px]">{entry.offers || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-[11px]">{entry.joining || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-[11px]">{entry.onboarding || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-[140px] truncate text-[11px]" title={entry.remarks}>{entry.remarks || '-'}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewingEntry(entry)} title="View" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleEdit(entry)} title="Edit" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(entry.id)} title="Delete" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={18} className="py-16 text-center">
                    <div className="text-slate-300 mb-2"><Users className="w-10 h-10 mx-auto" /></div>
                    <p className="text-sm font-bold text-slate-400">No candidates found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[11px] text-slate-500 font-medium">
            {filteredEntries.length} candidates shown
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Managed by: Veena (Onboarding &amp; Hiring)</span>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingId ? 'Edit Recruitment Record' : 'Add New Candidate'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Fill in the candidate details below</p>
              </div>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Section: Personal Info */}
              <div>
                <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Employee Name *</label>
                    <input type="text" name="employeeName" value={formData.employeeName} onChange={handleInputChange} required placeholder="Full name" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number *</label>
                    <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required placeholder="9876543210" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="email@example.com" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">College/University</label>
                    <input type="text" name="collegeUniversity" value={formData.collegeUniversity} onChange={handleInputChange} placeholder="e.g. IIT Bombay" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Location *</label>
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} required placeholder="e.g. Mumbai" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Source *</label>
                    <select name="source" value={formData.source} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
                      <option value="">Select Source</option>
                      {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section: Job Info */}
              <div>
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Job Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Role Applied *</label>
                    <select name="roleApplied" value={formData.roleApplied} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
                      <option value="">Select Role</option>
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Recruiter *</label>
                    <input type="text" name="recruiter" value={formData.recruiter} onChange={handleInputChange} required placeholder="e.g. Veena" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Application Date *</label>
                    <input type="date" name="applicationDate" value={formData.applicationDate} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Current Stage *</label>
                    <select name="currentStage" value={formData.currentStage} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
                      {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Status *</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Interviews</label>
                    <input type="text" name="interviews" value={formData.interviews} onChange={handleInputChange} placeholder="e.g. Cleared (2 rounds)" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                </div>
              </div>

              {/* Section: Pipeline Progress */}
              <div>
                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Pipeline Progress
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Selection</label>
                    <input type="text" name="selection" value={formData.selection} onChange={handleInputChange} placeholder="e.g. Selected / Pending" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Offers</label>
                    <input type="text" name="offers" value={formData.offers} onChange={handleInputChange} placeholder="e.g. Sent / Accepted" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Joining</label>
                    <input type="text" name="joining" value={formData.joining} onChange={handleInputChange} placeholder="e.g. 2026-09-01" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Onboarding</label>
                    <input type="text" name="onboarding" value={formData.onboarding} onChange={handleInputChange} placeholder="e.g. Completed / In Progress" className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 transition-all" />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Remarks</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={2} placeholder="Any additional notes..." className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/10 resize-none transition-all" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 cursor-pointer transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 cursor-pointer transition-all">
                  {editingId ? 'Update Record' : 'Save Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Header with avatar */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-500/20">
                    {viewingEntry.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{viewingEntry.employeeName}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">{viewingEntry.id} • {viewingEntry.roleApplied}</p>
                  </div>
                </div>
                <button onClick={() => setViewingEntry(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 cursor-pointer transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-2.5 py-1 border text-[10px] font-bold rounded-lg ${getStageColor(viewingEntry.currentStage)}`}>
                  {viewingEntry.currentStage}
                </span>
                <span className={`px-2.5 py-1 border text-[10px] font-bold rounded-lg ${getStatusColor(viewingEntry.status)}`}>
                  {viewingEntry.status}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Mobile</div>
                    <div className="text-xs font-semibold text-slate-800">{viewingEntry.mobileNumber}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Email</div>
                    <div className="text-xs font-semibold text-slate-800">{viewingEntry.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">College/University</div>
                    <div className="text-xs font-semibold text-slate-800">{viewingEntry.collegeUniversity || '-'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Location</div>
                    <div className="text-xs font-semibold text-slate-800">{viewingEntry.location}</div>
                  </div>
                </div>
              </div>

              {/* Pipeline Details */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Pipeline Progress</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <ViewField label="Source" value={viewingEntry.source} />
                  <ViewField label="Recruiter" value={viewingEntry.recruiter} />
                  <ViewField label="Application Date" value={viewingEntry.applicationDate} />
                  <ViewField label="Interviews" value={viewingEntry.interviews} />
                  <ViewField label="Selection" value={viewingEntry.selection} />
                  <ViewField label="Offers" value={viewingEntry.offers} />
                  <ViewField label="Joining" value={viewingEntry.joining} />
                  <ViewField label="Onboarding" value={viewingEntry.onboarding} />
                </div>
              </div>

              {/* Remarks */}
              {viewingEntry.remarks && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">Remarks</div>
                  <div className="text-xs text-slate-700 bg-amber-50 border border-amber-100 p-3 rounded-xl leading-relaxed">{viewingEntry.remarks}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => { setViewingEntry(null); handleEdit(viewingEntry); }} className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px] hover:bg-amber-100 cursor-pointer transition-colors flex items-center gap-1.5">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => setViewingEntry(null)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-[11px] hover:bg-slate-200 cursor-pointer transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-slate-50/80">
      <div className="text-[9px] text-slate-400 font-bold uppercase">{label}</div>
      <div className="text-[11px] font-semibold text-slate-800 mt-0.5">{value || '-'}</div>
    </div>
  );
}
