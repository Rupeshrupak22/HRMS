'use client';

import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, ShieldAlert, Users, Calendar, Eye, X } from 'lucide-react';
import { nitishaApi } from '@/lib/nitisha-api';
import { apiRequest } from '@/lib/api';

export default function NitishaReportPage() {
  const [performances, setPerformances] = useState<any[]>([]);
  const [discipline, setDiscipline] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    nitishaApi.getPerformances().then(setPerformances).catch(() => {});
    nitishaApi.getDiscipline().then(setDiscipline).catch(() => {});
    nitishaApi.getRelations().then(setRelations).catch(() => {});
    
    apiRequest('/reports/daily').then((res) => {
      const arr = Array.isArray(res) ? res : [];
      const filtered = arr.filter((r: any) => 
        r.userEmail === 'nitisha@adyapan.com' || 
        r.specialization === 'DISCIPLINE_POSH' || 
        (r.employeeName || '').toLowerCase().includes('nitisha')
      );
      setDailyReports(filtered);
    }).catch(() => {
      nitishaApi.getDailyReports().then((res) => {
        const arr = Array.isArray(res) ? res : [];
        setDailyReports(arr.filter((r: any) => 
          r.userEmail === 'nitisha@adyapan.com' || 
          r.specialization === 'DISCIPLINE_POSH' || 
          (r.employeeName || '').toLowerCase().includes('nitisha')
        ));
      }).catch(() => setDailyReports([]));
    });
  }, []);

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.date || (r.createdAt ? r.createdAt.split('T')[0] : '');
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
                <th className="px-3 py-2 text-left font-bold text-slate-600">Issue / Key Updates</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">PIP</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Engagement</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Low / Med / High</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Discipline</th>
                <th className="px-3 py-2 text-right font-bold text-slate-600">Preview</th>
              </tr></thead>
              <tbody>{filteredDailyReports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-3 py-2 font-bold text-slate-800">{r.employeeName || 'Nitisha'}</td>
                  <td className="px-3 py-2 text-slate-700 max-w-[200px] truncate">{r.employeeIssue || r.keyUpdates || 'Discipline review'}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.pipCase === 'Yes' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{r.pipCase || 'No'}</span></td>
                  <td className="px-3 py-2">{r.employeeEngagement || 'N/A'}</td>
                  <td className="px-3 py-2 text-slate-600">{r.performanceLow || 0} / {r.performanceMedium || 0} / {r.performanceHigh || 0}</td>
                  <td className="px-3 py-2">{r.disciplineCases || 0}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setSelectedReport(r)} className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer ml-auto">
                      <Eye className="w-3 h-3 text-slate-600" /> Full Preview
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Full Report Preview Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between saffron-gradient text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black">Nitisha Daily Report Preview</h3>
                  <p className="text-[10px] text-orange-100">{selectedReport.employeeName} — {selectedReport.createdAt?.split('T')[0] || selectedReport.date}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-900 mb-1">Employee Issue / Key Performance Updates</label>
                <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {selectedReport.employeeIssue || selectedReport.keyUpdates || selectedReport.tasksCompleted || 'No issues reported.'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div><span className="font-bold text-slate-500">PIP Case:</span> <strong className="text-slate-800 ml-1">{selectedReport.pipCase || 'No'}</strong></div>
                <div><span className="font-bold text-slate-500">Engagement:</span> <strong className="text-slate-800 ml-1">{selectedReport.employeeEngagement || 'N/A'}</strong></div>
                <div><span className="font-bold text-slate-500">Discipline Cases:</span> <strong className="text-slate-800 ml-1">{selectedReport.disciplineCases || 0}</strong></div>
                <div><span className="font-bold text-slate-500">Perf Breakdown:</span> <strong className="text-slate-800 ml-1">L:{selectedReport.performanceLow || 0} / M:{selectedReport.performanceMedium || 0} / H:{selectedReport.performanceHigh || 0}</strong></div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedReport(null)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
