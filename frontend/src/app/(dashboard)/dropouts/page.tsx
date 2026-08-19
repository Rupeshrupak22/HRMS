'use client';

import React, { useState, useEffect } from 'react';
import {
  UserX,
  Search,
  Plus,
  X,
  Eye,
  Pencil,
  Trash2,
  Download,
  Filter,
  TrendingDown,
  Users,
  BarChart3,
} from 'lucide-react';
import { ActionBar } from '@/components/ActionBar';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

interface DropoutEntry {
  id: string;
  candidateName: string;
  employeeId: string;
  role: string;
  source: string;
  dropoutDate: string;
  dropoutStage: string;
  dropoutReason: string;
  recruiter: string;
  remarks: string;
}

const ROLE_OPTIONS = ['Sales', 'HR', 'Operational Team', 'Tech', 'Team Leader'];
const SOURCE_OPTIONS = ['College', 'LinkedIn', 'Naukri', 'Referral', 'Job Portal', 'Other'];
const DROPOUT_STAGE_OPTIONS = ['Selection', 'Interview', 'Offer Letter', 'Joining', 'Onboarding', 'Termination', 'Resignation'];
const DROPOUT_REASON_OPTIONS = ['Not Interested', 'Salary Issue', 'Accepted Another Offer', 'Personal Reason', 'No Response', 'Failed Interview', 'Other'];
function formatDisplayDate(val: any): string {
  if (!val || val === '-') return '-';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '-';
    const isEndOfDay = val.getHours() === 23 && val.getMinutes() >= 45;
    const adjusted = new Date(val.getTime() + (isEndOfDay ? 20 * 60 * 1000 : 0));
    return `${String(adjusted.getDate()).padStart(2, '0')}-${String(adjusted.getMonth() + 1).padStart(2, '0')}-${adjusted.getFullYear()}`;
  }
  const str = String(val).trim();
  if (str.includes('GMT') || str.includes('India Standard Time') || (str.includes('T') && str.length > 10)) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const isEndOfDay = parsed.getHours() === 23 && parsed.getMinutes() >= 45;
      const adjusted = new Date(parsed.getTime() + (isEndOfDay ? 20 * 60 * 1000 : 0));
      return `${String(adjusted.getDate()).padStart(2, '0')}-${String(adjusted.getMonth() + 1).padStart(2, '0')}-${adjusted.getFullYear()}`;
    }
  }
  const yyyymmdd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) return `${yyyymmdd[3].padStart(2, '0')}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[1]}`;
  return str;
}

export default function DropoutTrackerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDropout, setViewingDropout] = useState<DropoutEntry | null>(null);

  const [dropouts, setDropouts] = useState<DropoutEntry[]>([]);

  const loadDropouts = async () => {
    try {
      const data = await apiRequest('/veena/dropouts');
      setDropouts(Array.isArray(data) ? data : []);
    } catch { setDropouts([]); }
  };

  useEffect(() => { loadDropouts(); }, []);

  const [formData, setFormData] = useState({
    candidateName: '', employeeId: '', role: '', source: '',
    dropoutDate: '', dropoutStage: '', dropoutReason: '', recruiter: '', remarks: '',
  });

  const filteredDropouts = dropouts.filter((d) => {
    const candidate = (d.candidateName || '').toLowerCase();
    const empId = (d.employeeId || '').toLowerCase();
    const recruiter = (d.recruiter || '').toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm || candidate.includes(q) || empId.includes(q) || recruiter.includes(q);
    const matchesRole = !filterRole || d.role === filterRole;
    const matchesStage = !filterStage || d.dropoutStage === filterStage;
    return matchesSearch && matchesRole && matchesStage;
  });

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRole, filterStage]);

  const paginatedDropouts = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredDropouts.slice(start, start + PAGE_SIZE);
  }, [filteredDropouts, page]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiRequest(`/veena/dropouts/${editingId}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        await apiRequest('/veena/dropouts', { method: 'POST', body: JSON.stringify(formData) });
      }
    } catch {
      // Fallback: save locally
      if (editingId) {
        setDropouts((prev) => prev.map((d) => d.id === editingId ? { ...d, ...formData } : d));
      } else {
        setDropouts((prev) => [{ id: `DROP-${Date.now()}`, ...formData }, ...prev]);
      }
    }
    setEditingId(null);
    setFormData({ candidateName: '', employeeId: '', role: '', source: '', dropoutDate: '', dropoutStage: '', dropoutReason: '', recruiter: '', remarks: '' });
    setShowForm(false);
    loadDropouts();
  };

  const handleEdit = (drop: DropoutEntry) => {
    setEditingId(drop.id);
    setFormData({ candidateName: drop.candidateName, employeeId: drop.employeeId, role: drop.role, source: drop.source, dropoutDate: drop.dropoutDate, dropoutStage: drop.dropoutStage, dropoutReason: drop.dropoutReason, recruiter: drop.recruiter, remarks: drop.remarks });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this dropout record?')) {
      try { await apiRequest(`/veena/dropouts/${id}`, { method: 'DELETE' }); } catch {}
      setDropouts((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormData({ candidateName: '', employeeId: '', role: '', source: '', dropoutDate: '', dropoutStage: '', dropoutReason: '', recruiter: '', remarks: '' });
    setShowForm(true);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Candidate Name', 'Employee ID', 'Role', 'Source', 'Dropout Date', 'Dropout Stage', 'Dropout Reason', 'Recruiter', 'Remarks'];
    const rows = filteredDropouts.map((d) => [d.id, d.candidateName, d.employeeId, d.role, d.source, d.dropoutDate, d.dropoutStage, d.dropoutReason, d.recruiter, d.remarks]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dropout-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = async (text: string) => {
    const lines = text.split('\n').filter(Boolean);
    if (lines.length < 2) return;
    const newEntries = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.replace(/"/g, '').trim());
      return { candidateName: cols[1] || '', employeeId: cols[2] || '', role: cols[3] || '', source: cols[4] || '', dropoutDate: cols[5] || '', dropoutStage: cols[6] || '', dropoutReason: cols[7] || '', recruiter: cols[8] || '', remarks: cols[9] || '' };
    });
    try {
      for (const entry of newEntries) {
        await apiRequest('/veena/dropouts', { method: 'POST', body: JSON.stringify(entry) });
      }
      loadDropouts();
    } catch {
      setDropouts((prev) => [...newEntries.map((e, i) => ({ ...e, id: `DROP-${Date.now()}-${i}` })), ...prev]);
    }
  };

  // Stats
  const reasonCounts: Record<string, number> = {};
  dropouts.forEach((d) => {
    if (d.dropoutReason) {
      reasonCounts[d.dropoutReason] = (reasonCounts[d.dropoutReason] || 0) + 1;
    }
  });
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
  const nowMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const thisMonthCount = dropouts.filter((d) => d.dropoutDate && d.dropoutDate.startsWith(nowMonth)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 rounded-2xl saffron-gradient text-white shadow-md">
        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
          <UserX className="w-5 h-5" />
          Candidate Dropout Tracker
        </h1>
        <p className="text-[11px] text-orange-100 mt-0.5">
          Track dropouts, analyze reasons &amp; manage recruitment pipeline
        </p>
      </div>

      {/* Action Bar */}
      <ActionBar
        onRefresh={loadDropouts}
        onImportCSV={handleImportCSV}
        onExport={exportCSV}
        onAdd={openNewForm}
        addLabel="Add Dropout"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase">
            <Users className="w-3.5 h-3.5" /> Total Dropouts
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{dropouts.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase">
            <TrendingDown className="w-3.5 h-3.5" /> This Month
          </div>
          <div className="text-2xl font-black text-red-600 mt-1">{thisMonthCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase">
            <BarChart3 className="w-3.5 h-3.5" /> Top Reason
          </div>
          <div className="text-sm font-black text-slate-900 mt-1">{topReason ? topReason[0] : '-'}</div>
          <div className="text-[10px] text-slate-400">{topReason ? `${topReason[1]} cases` : ''}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase">
            <Filter className="w-3.5 h-3.5" /> Showing
          </div>
          <div className="text-2xl font-black text-orange-600 mt-1">{filteredDropouts.length}</div>
          <div className="text-[10px] text-slate-400">of {dropouts.length} records</div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID or recruiter..."
            className="w-full bg-white text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400"
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="bg-white text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="bg-white text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
          <option value="">All Stages</option>
          {DROPOUT_STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterRole || filterStage || searchTerm) && (
          <button onClick={() => { setFilterRole(''); setFilterStage(''); setSearchTerm(''); }} className="text-[11px] text-orange-600 font-bold hover:underline cursor-pointer">
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Dropout Date</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Recruiter</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedDropouts.map((drop) => (
                <tr key={drop.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{drop.candidateName}</div>
                    <div className="text-[10px] text-slate-400">{drop.employeeId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded">{drop.role}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-semibold rounded">{drop.source}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{formatDisplayDate(drop.dropoutDate)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-semibold rounded">{drop.dropoutStage}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-semibold rounded">{drop.dropoutReason}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{drop.recruiter}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-0.5">
                      <button onClick={() => setViewingDropout(drop)} title="View" className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 cursor-pointer"><Eye className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleEdit(drop)} title="Edit" className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(drop.id)} title="Delete" className="p-1.5 rounded-md text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDropouts.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-slate-400 text-xs">No dropout records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalItems={filteredDropouts.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-base font-black text-slate-900">
                {editingId ? 'Edit Dropout Record' : 'Add New Dropout'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Candidate Name *</label>
                  <input type="text" name="candidateName" value={formData.candidateName} onChange={handleInputChange} required placeholder="Full name" className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Employee ID *</label>
                  <input type="text" name="employeeId" value={formData.employeeId} onChange={handleInputChange} required placeholder="EMP-XXX" className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Role *</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
                    <option value="">Select</option>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Source *</label>
                  <select name="source" value={formData.source} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
                    <option value="">Select</option>
                    {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Dropout Date *</label>
                  <input type="date" name="dropoutDate" value={formData.dropoutDate} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Dropout Stage *</label>
                  <select name="dropoutStage" value={formData.dropoutStage} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
                    <option value="">Select</option>
                    {DROPOUT_STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Dropout Reason *</label>
                  <select name="dropoutReason" value={formData.dropoutReason} onChange={handleInputChange} required className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 cursor-pointer">
                    <option value="">Select</option>
                    {DROPOUT_REASON_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Recruiter *</label>
                  <input type="text" name="recruiter" value={formData.recruiter} onChange={handleInputChange} required placeholder="e.g. Veena" className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Remarks</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={2} placeholder="Any additional context..." className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-400 resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] hover:bg-slate-200 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg saffron-gradient text-white font-bold text-[11px] shadow cursor-pointer">
                  {editingId ? 'Update' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingDropout && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Dropout Details</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{viewingDropout.id}</p>
              </div>
              <button onClick={() => setViewingDropout(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <DetailItem label="Candidate Name" value={viewingDropout.candidateName} />
                <DetailItem label="Employee ID" value={viewingDropout.employeeId} />
                <DetailItem label="Role" value={viewingDropout.role} />
                <DetailItem label="Source" value={viewingDropout.source} />
                <DetailItem label="Dropout Date" value={viewingDropout.dropoutDate} />
                <DetailItem label="Dropout Stage" value={viewingDropout.dropoutStage} />
                <DetailItem label="Dropout Reason" value={viewingDropout.dropoutReason} />
                <DetailItem label="Recruiter" value={viewingDropout.recruiter} />
              </div>
              {viewingDropout.remarks && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Remarks</div>
                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg">{viewingDropout.remarks}</div>
                </div>
              )}
              <div className="flex justify-end pt-1">
                <button onClick={() => setViewingDropout(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] hover:bg-slate-200 cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 font-bold uppercase">{label}</div>
      <div className="text-xs font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}
