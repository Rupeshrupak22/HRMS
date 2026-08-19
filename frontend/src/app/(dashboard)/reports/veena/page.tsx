'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, UserPlus, UserX, Calendar, Eye, X, Download, Target, Search, Users, ClipboardCheck } from 'lucide-react';
import { veenaApi } from '@/lib/veena-api';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export default function VeenaReportPage() {
  const [recruitment, setRecruitment] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [dropouts, setDropouts] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Pagination states
  const [pageRec, setPageRec] = useState(1);
  const [pageOnb, setPageOnb] = useState(1);
  const [pageDrop, setPageDrop] = useState(1);
  const [pageRep, setPageRep] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    // 1. Recruitment candidates strictly from DB
    veenaApi.getRecruitment().then((res) => {
      const list = Array.isArray(res) ? res : [];
      setRecruitment(list);
    }).catch(() => {
      setRecruitment([]);
    });

    // 2. Onboarding employees strictly from DB
    veenaApi.getOnboarding().then((res) => {
      const list = Array.isArray(res) ? res : [];
      setOnboarding(list);
    }).catch(() => {
      setOnboarding([]);
    });

    // 3. Dropout candidates strictly from DB
    veenaApi.getDropouts().then((res) => {
      const list = Array.isArray(res) ? res : [];
      setDropouts(list);
    }).catch(() => {
      setDropouts([]);
    });

    // 4. Daily reports
    apiRequest('/reports/daily').then((res) => {
      const arr = Array.isArray(res) ? res : [];
      setDailyReports(arr.filter((r: any) => 
        r.userEmail === 'veena@adyapan.com' || 
        r.specialization === 'ONBOARDING_HIRING' || 
        (r.employeeName || '').toLowerCase().includes('veena')
      ));
    }).catch(() => {
      veenaApi.getDailyReports().then((res) => {
        const arr = Array.isArray(res) ? res : [];
        setDailyReports(arr.filter((r: any) => 
          r.userEmail === 'veena@adyapan.com' || 
          r.specialization === 'ONBOARDING_HIRING' || 
          (r.employeeName || '').toLowerCase().includes('veena')
        ));
      }).catch(() => setDailyReports([]));
    });
  }, []);

  const filterRecords = (records: any[]) => {
    return records.filter((r) => {
      const created = r.date || r.applicationDate || r.dropoutDate || (r.createdAt ? r.createdAt.split('T')[0] : '');
      const matchesDate = !filterDate || created === filterDate;

      const q = searchTerm.toLowerCase().trim();
      const name = (r.candidateName || r.name || r.employeeName || '').toLowerCase();
      const phone = (r.phoneNumber || r.mobileNumber || r.phone || '').toLowerCase();
      const role = (r.roleApplied || r.role || r.department || '').toLowerCase();
      const status = (r.status || r.currentStage || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || phone.includes(q) || role.includes(q) || status.includes(q);
      return matchesDate && matchesSearch;
    });
  };

  const filteredRecruitment = filterRecords(recruitment);
  const filteredOnboarding = filterRecords(onboarding);
  const filteredDropouts = filterRecords(dropouts);
  const filteredDailyReports = filterRecords(dailyReports);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Abbu Veena&apos;s Complete Recruitment &amp; Onboarding Report</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Candidate recruitment pipeline, onboarding stages, dropouts, and daily submissions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, phone, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-[220px]"
            />
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPageRec(1);
                setPageOnb(1);
                setPageDrop(1);
                setPageRep(1);
              }}
              className="text-xs font-bold text-white border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          {(filterDate || searchTerm) && (
            <button
              onClick={() => {
                setFilterDate('');
                setSearchTerm('');
                setPageRec(1);
                setPageOnb(1);
                setPageDrop(1);
                setPageRep(1);
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
          Showing records for: {filterDate}
        </div>
      )}

      {/* 1. Recruitment Tracker Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserPlus className="w-4 h-4 text-amber-600" /> Recruitment Tracker ({filteredRecruitment.length})
        </h2>
        {filteredRecruitment.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">No recruitment records found.</p> : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold whitespace-nowrap">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Recruiter</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joining Date</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredRecruitment.slice((pageRec - 1) * PAGE_SIZE, pageRec * PAGE_SIZE).map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-50 transition whitespace-nowrap">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.candidateName || r.employeeName || r.name || 'Candidate'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.phoneNumber || r.mobileNumber || r.phone || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.email || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.college || r.collegeUniversity || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.location || r.department || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.source || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.roleApplied || r.role || r.designation || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.recruiter || 'Abbu Veena'}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">{r.currentStage || r.stage || '-'}</span></td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Joined' || r.status === 'Selected' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status || 'Active'}</span></td>
                    <td className="px-4 py-2.5 text-slate-600 font-medium">{r.joining || r.applicationDate || '-'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageRec} totalItems={filteredRecruitment.length} pageSize={PAGE_SIZE} onPageChange={setPageRec} />
          </div>
        )}
      </section>

      {/* 2. Onboarding Pipeline Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Target className="w-4 h-4 text-blue-600" /> Onboarding Pipeline ({filteredOnboarding.length})
        </h2>
        {filteredOnboarding.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">No onboarding records found.</p> : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold whitespace-nowrap">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Recruiter</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joining Date</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredOnboarding.slice((pageOnb - 1) * PAGE_SIZE, pageOnb * PAGE_SIZE).map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-50 transition whitespace-nowrap">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.candidateName || r.name || 'Candidate'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.phoneNumber || r.mobileNumber || r.phone || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.email || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.college || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.location || r.department || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.source || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.roleApplied || r.role || r.designation || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.recruiter || 'Abbu Veena'}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">{r.currentStage || r.stage || '-'}</span></td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Joined' || r.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status || 'Active'}</span></td>
                    <td className="px-4 py-2.5 text-slate-600 font-medium">{r.joining || r.applicationDate || '-'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageOnb} totalItems={filteredOnboarding.length} pageSize={PAGE_SIZE} onPageChange={setPageOnb} />
          </div>
        )}
      </section>

      {/* 3. Dropout Tracker Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserX className="w-4 h-4 text-red-600" /> Dropout Records ({filteredDropouts.length})
        </h2>
        {filteredDropouts.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">No dropout records found.</p> : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Date</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredDropouts.slice((pageDrop - 1) * PAGE_SIZE, pageDrop * PAGE_SIZE).map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.candidateName || r.name || 'Candidate'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.role || r.department || '-'}</td>
                    <td className="px-4 py-2.5 text-rose-700 font-medium">{r.dropoutReason || r.reason || '-'}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">{r.dropoutStage || r.stage || '-'}</span></td>
                    <td className="px-4 py-2.5 text-slate-600">{r.dropoutDate || r.date || '-'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageDrop} totalItems={filteredDropouts.length} pageSize={PAGE_SIZE} onPageChange={setPageDrop} />
          </div>
        )}
      </section>

      {/* 4. Daily Reports Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-amber-600" /> Daily Reports Submitted ({filteredDailyReports.length})
        </h2>
        {filteredDailyReports.length === 0 ? <p className="text-xs text-slate-400 py-4 text-center">No daily reports submitted yet</p> : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Key Hiring Performance</th>
                  <th className="px-4 py-3">Blockers / Issues</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action / Preview</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredDailyReports.slice((pageRep - 1) * PAGE_SIZE, pageRep * PAGE_SIZE).map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.date || r.reportDate || (r.createdAt ? r.createdAt.split('T')[0] : '-')}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{r.employeeName || 'Abbu Veena'}</td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-sm truncate" title={r.keyUpdates}>{r.keyUpdates || '-'}</td>
                    <td className="px-4 py-2.5 text-rose-600 max-w-xs truncate" title={r.issue}>{r.issue || '-'}</td>
                    <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">APPROVED</span></td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination currentPage={pageRep} totalItems={filteredDailyReports.length} pageSize={PAGE_SIZE} onPageChange={setPageRep} />
          </div>
        )}
      </section>

      {/* Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">Veena Daily Work Report Details</h3>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Date:</span><span className="font-bold text-slate-800">{selectedReport.date || selectedReport.reportDate}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Specialist:</span><span className="font-bold text-slate-800">{selectedReport.employeeName || 'Abbu Veena'}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Email:</span><span className="font-bold text-slate-800">{selectedReport.userEmail || 'veena@adyapan.com'}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500 font-medium">Role:</span><span className="font-bold text-slate-800">{selectedReport.role || 'Onboarding & Hiring Specialist'}</span></div>
              <div className="py-2 border-b border-slate-50"><span className="text-slate-500 font-medium block mb-1">Key Performance Actions:</span><p className="p-2.5 rounded-xl bg-slate-50 text-slate-800 font-medium">{selectedReport.keyUpdates || '-'}</p></div>
              <div className="py-2 border-b border-slate-50"><span className="text-slate-500 font-medium block mb-1">Issues / Blockers:</span><p className="p-2.5 rounded-xl bg-rose-50 text-rose-800 font-medium">{selectedReport.issue || '-'}</p></div>
              <div className="py-2"><span className="text-slate-500 font-medium block mb-1">Remarks / Comments:</span><p className="p-2.5 rounded-xl bg-amber-50 text-amber-900 font-medium">{selectedReport.comment || '-'}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
