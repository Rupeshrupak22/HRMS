'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, UserPlus, UserX, Calendar, Eye, X, Download } from 'lucide-react';
import { veenaApi } from '@/lib/veena-api';
import { apiRequest } from '@/lib/api';
import { Pagination } from '@/components/Pagination';

export default function VeenaReportPage() {
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [dropouts, setDropouts] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Pagination states
  const [pageOnb, setPageOnb] = useState(1);
  const [pageDrop, setPageDrop] = useState(1);
  const [pageRep, setPageRep] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    veenaApi.getOnboarding().then(setOnboarding).catch(() => {});
    veenaApi.getDropouts().then(setDropouts).catch(() => {});
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

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.date || r.applicationDate || r.dropoutDate || (r.createdAt ? r.createdAt.split('T')[0] : '');
      return created === filterDate;
    });
  };

  const filteredOnboarding = filterByDate(onboarding);
  const filteredDropouts = filterByDate(dropouts);
  const filteredDailyReports = filterByDate(dailyReports);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Abbu Veena&apos;s Complete Onboarding & Hiring Report</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Candidate onboarding pipeline, dropouts, recruitment conversions, and daily submissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 shadow-xs">
            <Calendar className="w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setPageOnb(1);
                setPageDrop(1);
                setPageRep(1);
              }}
              className="text-xs font-bold text-white border-none outline-none bg-transparent cursor-pointer"
            />
          </div>
          {filterDate && (
            <button
              onClick={() => {
                setFilterDate('');
                setPageOnb(1);
                setPageDrop(1);
                setPageRep(1);
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
          Showing records for: {filterDate}
        </div>
      )}

      {/* Onboarding Section */}
      <section className="space-y-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <UserPlus className="w-4 h-4 text-blue-600" /> Onboarding Pipeline ({filteredOnboarding.length})
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
                <tbody className="divide-y divide-slate-100">{filteredOnboarding.slice((pageOnb - 1) * PAGE_SIZE, pageOnb * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition whitespace-nowrap">
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

      {/* Dropout Section */}
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
                <tbody className="divide-y divide-slate-100">{filteredDropouts.slice((pageDrop - 1) * PAGE_SIZE, pageDrop * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
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

      {/* Daily Reports Section */}
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
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Sourced</th>
                  <th className="px-4 py-3">Screened</th>
                  <th className="px-4 py-3">Interviews</th>
                  <th className="px-4 py-3">Selected</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Preview</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredDailyReports.slice((pageRep - 1) * PAGE_SIZE, pageRep * PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/30 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{r.date}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r.role}</td>
                    <td className="px-4 py-2.5 font-mono">{r.candidateSourced || 0}</td>
                    <td className="px-4 py-2.5 font-mono">{r.screeningDone || 0}</td>
                    <td className="px-4 py-2.5 font-mono">{r.interviewsTaken || 0}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-emerald-600">{r.selected || 0}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-600">{r.joined || 0}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => setSelectedReport(r)} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto">
                        <Eye className="w-3 h-3 text-slate-600" /> Full Preview
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

      {/* Modal Preview */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Veena Daily Report Full Preview
                </h3>
                <p className="text-xs text-amber-200 mt-0.5">Role: {selectedReport.role} • Date: {selectedReport.date}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200 text-center font-bold">
                <div><span className="text-[10px] text-slate-400 uppercase block">Sourced</span>{selectedReport.candidateSourced || 0}</div>
                <div><span className="text-[10px] text-slate-400 uppercase block">Screened</span>{selectedReport.screeningDone || 0}</div>
                <div><span className="text-[10px] text-slate-400 uppercase block">Interviews</span>{selectedReport.interviewsTaken || 0}</div>
                <div><span className="text-[10px] text-slate-400 uppercase block">Selected</span>{selectedReport.selected || 0}</div>
                <div><span className="text-[10px] text-slate-400 uppercase block">Offers Sent</span>{selectedReport.offerLetterSent || 0}</div>
                <div><span className="text-[10px] text-slate-400 uppercase block">Joined</span>{selectedReport.joined || 0}</div>
              </div>
              <div>
                <label className="block font-bold text-slate-900 mb-1">Key Updates & Issues</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                  {selectedReport.keyUpdatesIssue || 'None reported.'}
                </div>
              </div>
              {selectedReport.pendingFollowups && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Pending Follow-ups</label>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                    {selectedReport.pendingFollowups}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setSelectedReport(null)} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
