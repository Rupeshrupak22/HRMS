'use client';

import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, ShieldAlert, Users, Calendar } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';

export default function NitishaReportPage() {
  const [performances, setPerformances] = useState<any[]>([]);
  const [discipline, setDiscipline] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    nitishaApi.getPerformances().then(setPerformances).catch(() => {});
    nitishaApi.getDiscipline().then(setDiscipline).catch(() => {});
    nitishaApi.getRelations().then(setRelations).catch(() => {});
    nitishaApi.getDailyReports().then(setDailyReports).catch(() => {});
  }, []);

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.createdAt ? r.createdAt.split('T')[0] : '';
      return created === filterDate;
    });
  };

  const filteredPerformances = filterByDate(performances);
  const filteredDiscipline = filterByDate(discipline);
  const filteredRelations = filterByDate(relations);
  const filteredDailyReports = filterByDate(dailyReports);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <span>Nitisha&apos;s Complete Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Discipline & POSH specialist — all sections data
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

      {/* Employee Performance Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <TrendingUp className="w-4 h-4 text-amber-600" /> Employee Performance ({filteredPerformances.length})
        </h2>
        {filteredPerformances.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Department</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">KPI</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Daily</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Weekly</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Monthly</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">PIP</th>
              </tr></thead>
              <tbody>{filteredPerformances.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2">{r.employeeName}</td>
                  <td className="px-3 py-2">{r.department}</td>
                  <td className="px-3 py-2">{r.kpi}</td>
                  <td className="px-3 py-2">{r.dailyPerformance}</td>
                  <td className="px-3 py-2">{r.weeklyPerformance}</td>
                  <td className="px-3 py-2">{r.monthlyPerformance}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.pipCase === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{r.pipCase}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Discipline Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <ShieldAlert className="w-4 h-4 text-purple-600" /> Discipline Cases ({filteredDiscipline.length})
        </h2>
        {filteredDiscipline.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Case Type</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Description</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Status</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Action</th>
              </tr></thead>
              <tbody>{filteredDiscipline.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">{r.caseType}</span></td>
                  <td className="px-3 py-2 max-w-[200px] truncate">{r.description}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{r.status}</span></td>
                  <td className="px-3 py-2">{r.actionTaken}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Relations Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <Users className="w-4 h-4 text-emerald-600" /> Employee Relations ({filteredRelations.length})
        </h2>
        {filteredRelations.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Joining Date</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">RNR</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Activities</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Feedback</th>
              </tr></thead>
              <tbody>{filteredRelations.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2">{r.employeeName}</td>
                  <td className="px-3 py-2">{r.joiningDate}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.rnrCertification === 'Provided' ? 'bg-green-100 text-green-700' : r.rnrCertification === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.rnrCertification}</span></td>
                  <td className="px-3 py-2 max-w-[150px] truncate">{r.employeeActivities}</td>
                  <td className="px-3 py-2 max-w-[150px] truncate">{r.employeeFeedback}</td>
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
                <th className="px-3 py-2 text-left font-bold text-slate-600">Employee</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Issue</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">PIP</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Engagement</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Low</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Med</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">High</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Discipline</th>
              </tr></thead>
              <tbody>{filteredDailyReports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeName}</td>
                  <td className="px-3 py-2">{r.employeeIssue}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.pipCase === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{r.pipCase}</span></td>
                  <td className="px-3 py-2">{r.employeeEngagement}</td>
                  <td className="px-3 py-2">{r.performanceLow}</td>
                  <td className="px-3 py-2">{r.performanceMedium}</td>
                  <td className="px-3 py-2">{r.performanceHigh}</td>
                  <td className="px-3 py-2">{r.disciplineCases}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
