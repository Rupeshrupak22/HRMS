'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, Users, CheckCircle2, XCircle, FileText, Send, Filter } from 'lucide-react';
import { veenaApi } from '@/lib/veena-api';

export function VeenaDashboard() {
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [dropouts, setDropouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [ob, dr] = await Promise.all([veenaApi.getOnboarding(), veenaApi.getDropouts()]);
        setOnboarding(ob);
        setDropouts(dr);
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const stats = {
    total: onboarding.length,
    active: onboarding.filter((r: any) => r.status === 'Active').length,
    joined: onboarding.filter((r: any) => r.status === 'Joined').length,
    dropouts: dropouts.length,
  };

  // Filter candidates based on active card filter + dropdown filters
  const getFilteredCandidates = () => {
    let results: any[] = [];
    if (activeFilter === 'dropouts') {
      results = dropouts;
    } else if (activeFilter === 'active') {
      results = onboarding.filter((r) => r.status === 'Active');
    } else if (activeFilter === 'joined') {
      results = onboarding.filter((r) => r.status === 'Joined');
    } else if (activeFilter === 'total') {
      results = onboarding;
    } else {
      results = onboarding;
    }

    if (stageFilter) results = results.filter((r) => r.currentStage === stageFilter);
    if (statusFilter) results = results.filter((r) => r.status === statusFilter);
    return results;
  };

  const filteredCandidates = getFilteredCandidates();

  if (loading) return <div className="p-10 text-center text-slate-400 text-sm">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <span>Veena — HR Onboarding & Hiring System</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              ONBOARDING & HIRING SPECIALIST
            </span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            End-to-end recruitment pipeline, candidate tracking, and onboarding management
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/onboarding" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer">
            <UserPlus className="w-4 h-4" /> Add Candidate
          </Link>
          <Link href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1 cursor-pointer">
            <Send className="w-3.5 h-3.5" /> Submit Daily Report
          </Link>
        </div>
      </div>

      {/* Stat Cards - Clickable Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => setActiveFilter(activeFilter === 'total' ? null : 'total')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${activeFilter === 'total' ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
          <div className="text-left">
            <div className="text-xs text-slate-500 font-semibold">Total Candidates</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
            <div className="text-[10px] text-slate-500 mt-1">All pipeline candidates</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Users className="w-5 h-5" />
          </div>
        </button>

        <button onClick={() => setActiveFilter(activeFilter === 'active' ? null : 'active')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${activeFilter === 'active' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
          <div className="text-left">
            <div className="text-xs text-slate-500 font-semibold">Active Pipeline</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{stats.active}</div>
            <div className="text-[10px] text-blue-600 mt-1 font-bold">Currently in process</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <UserPlus className="w-5 h-5" />
          </div>
        </button>

        <button onClick={() => setActiveFilter(activeFilter === 'joined' ? null : 'joined')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${activeFilter === 'joined' ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
          <div className="text-left">
            <div className="text-xs text-slate-500 font-semibold">Joined</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{stats.joined}</div>
            <div className="text-[10px] text-emerald-600 mt-1 font-bold">Successfully onboarded</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>

        <button onClick={() => setActiveFilter(activeFilter === 'dropouts' ? null : 'dropouts')}
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${activeFilter === 'dropouts' ? 'bg-red-50 border-red-400 ring-2 ring-red-200' : 'bg-white border-slate-200 hover:border-red-300'}`}>
          <div className="text-left">
            <div className="text-xs text-slate-500 font-semibold">Dropouts</div>
            <div className="text-2xl font-black text-red-600 mt-1">{stats.dropouts}</div>
            <div className="text-[10px] text-red-600 mt-1 font-bold">Candidates dropped out</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <XCircle className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <Filter className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-bold text-slate-700">Filters:</span>

        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
          <option value="">All Stages</option>
          <option value="Screening">Screening</option>
          <option value="Interview">Interview</option>
          <option value="Selection">Selection</option>
          <option value="Offer">Offer</option>
          <option value="Joining">Joining</option>
          <option value="Onboarding">Onboarding</option>
          <option value="Joined">Joined</option>
          <option value="Dropout">Dropout</option>
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer">
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Selected">Selected</option>
          <option value="Rejected">Rejected</option>
          <option value="Joined">Joined</option>
          <option value="Dropped">Dropped</option>
        </select>

        {(stageFilter || statusFilter || activeFilter) && (
          <button onClick={() => { setStageFilter(''); setStatusFilter(''); setActiveFilter(null); }}
            className="px-3 py-2 rounded-lg bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">
            Clear All
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500 font-semibold">
          Showing {filteredCandidates.length} candidate(s)
        </span>
      </div>

      {/* Candidates Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">Candidate</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Phone</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Source</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Role</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Stage</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No candidates found. Click a stat card or adjust filters.</td></tr>
              ) : (
                filteredCandidates.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.candidateName}</td>
                    <td className="px-4 py-3 text-slate-700">{r.phoneNumber || r.employeeId || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.email || r.dropoutDate || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.source || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{r.roleApplied || r.role || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.currentStage === 'Joined' ? 'bg-green-100 text-green-700' : r.currentStage === 'Dropout' || r.dropoutStage ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.currentStage || r.dropoutStage || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Joined' ? 'bg-green-100 text-green-700' : r.status === 'Rejected' || r.status === 'Dropped' ? 'bg-red-100 text-red-700' : r.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.status || 'Dropout'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/onboarding" className="p-4 rounded-xl bg-orange-50 border border-orange-200 hover:border-orange-400 transition-colors flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Onboarding</div>
              <div className="text-[10px] text-slate-500">Manage recruitment pipeline</div>
            </div>
          </Link>
          <Link href="/dropouts" className="p-4 rounded-xl bg-red-50 border border-red-200 hover:border-red-400 transition-colors flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Dropout</div>
              <div className="text-[10px] text-slate-500">Track candidate dropouts</div>
            </div>
          </Link>
          <Link href="/daily-reports" className="p-4 rounded-xl bg-blue-50 border border-blue-200 hover:border-blue-400 transition-colors flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Daily Reports</div>
              <div className="text-[10px] text-slate-500">Submit daily activity reports</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
