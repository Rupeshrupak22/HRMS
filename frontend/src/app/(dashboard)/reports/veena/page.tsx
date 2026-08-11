'use client';

import React, { useState, useEffect } from 'react';
import { FileText, UserPlus, XCircle, Calendar } from 'lucide-react';
import { veenaApi } from '@/lib/veena-api';

export default function VeenaReportPage() {
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [dropouts, setDropouts] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    veenaApi.getOnboarding().then(setOnboarding).catch(() => {});
    veenaApi.getDropouts().then(setDropouts).catch(() => {});
    veenaApi.getDailyReports().then(setDailyReports).catch(() => {});
  }, []);

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.createdAt ? r.createdAt.split('T')[0] : '';
      return created === filterDate;
    });
  };

  const filteredOnboarding = filterByDate(onboarding);
  const filteredDropouts = filterByDate(dropouts);
  const filteredDailyReports = filterDate
    ? dailyReports.filter((r) => r.date === filterDate || (r.createdAt && r.createdAt.split('T')[0] === filterDate))
    : dailyReports;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <span>Veena&apos;s Complete Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Onboarding & Hiring specialist — all sections data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-orange-500" />
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm font-semibold text-slate-700 border-none outline-none bg-transparent cursor-pointer" />
          </div>
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 cursor-pointer">
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {filterDate && (
        <div className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700">
          Showing records for: {filterDate}
        </div>
      )}

      {/* Onboarding Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <UserPlus className="w-4 h-4 text-orange-600" /> Onboarding Tracker ({filteredOnboarding.length})
        </h2>
        {filteredOnboarding.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Candidate</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Phone</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Email</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">College</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Source</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Role</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Stage</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Status</th>
              </tr></thead>
              <tbody>{filteredOnboarding.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold">{r.candidateName}</td>
                  <td className="px-3 py-2">{r.phoneNumber}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.college}</td>
                  <td className="px-3 py-2">{r.source}</td>
                  <td className="px-3 py-2">{r.roleApplied}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.currentStage === 'Joined' ? 'bg-green-100 text-green-700' : r.currentStage === 'Dropout' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.currentStage}</span></td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Joined' ? 'bg-green-100 text-green-700' : r.status === 'Dropped' || r.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{r.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Dropouts Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <XCircle className="w-4 h-4 text-red-600" /> Dropouts ({filteredDropouts.length})
        </h2>
        {filteredDropouts.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Candidate</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Role</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Source</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Dropout Date</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Stage</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Reason</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Recruiter</th>
              </tr></thead>
              <tbody>{filteredDropouts.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold">{r.candidateName}</td>
                  <td className="px-3 py-2">{r.role}</td>
                  <td className="px-3 py-2">{r.source}</td>
                  <td className="px-3 py-2">{r.dropoutDate}</td>
                  <td className="px-3 py-2">{r.dropoutStage}</td>
                  <td className="px-3 py-2">{r.dropoutReason}</td>
                  <td className="px-3 py-2">{r.recruiter}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Daily Reports Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <FileText className="w-4 h-4 text-slate-600" /> Daily Reports ({filteredDailyReports.length})
        </h2>
        {filteredDailyReports.length === 0 ? <p className="text-xs text-slate-400">No reports submitted yet</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Date</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Role</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Sourced</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Screening</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Interviews</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Selected</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Offer Sent</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Joined</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Followups</th>
              </tr></thead>
              <tbody>{filteredDailyReports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold">{r.date}</td>
                  <td className="px-3 py-2">{r.role}</td>
                  <td className="px-3 py-2">{r.candidateSourced}</td>
                  <td className="px-3 py-2">{r.screeningDone}</td>
                  <td className="px-3 py-2">{r.interviewsTaken}</td>
                  <td className="px-3 py-2">{r.selected}</td>
                  <td className="px-3 py-2">{r.offerLetterSent}</td>
                  <td className="px-3 py-2">{r.joined}</td>
                  <td className="px-3 py-2">{r.pendingFollowups}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
