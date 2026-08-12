'use client';

import React, { useState, useEffect } from 'react';
import { FileText, UserPlus, UserX, Calendar, Eye, X } from 'lucide-react';
import { veenaApi } from '@/lib/veena-api';
import { apiRequest } from '@/lib/api';

export default function VeenaReportPage() {
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [dropouts, setDropouts] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

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
      const created = r.date || (r.createdAt ? r.createdAt.split('T')[0] : '');
      return created === filterDate;
    });
  };

  const filteredOnboarding = filterByDate(onboarding);
  const filteredDropouts = filterByDate(dropouts);
  const filteredDailyReports = filterByDate(dailyReports);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <span>Abbu Veena&apos;s Complete Report</span>
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
          <UserPlus className="w-4 h-4 text-blue-600" /> Onboarding Pipeline ({filteredOnboarding.length})
        </h2>
        {filteredOnboarding.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Department</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Designation</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Phone</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Joining Date</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Status</th>
              </tr></thead>
              <tbody>{filteredOnboarding.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2 font-bold">{r.name}</td>
                  <td className="px-3 py-2">{r.department}</td>
                  <td className="px-3 py-2">{r.designation}</td>
                  <td className="px-3 py-2">{r.mobileNumber}</td>
                  <td className="px-3 py-2">{r.dateOfJoining}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{r.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Dropout Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <UserX className="w-4 h-4 text-red-600" /> Dropout Records ({filteredDropouts.length})
        </h2>
        {filteredDropouts.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Department</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Reason</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Stage</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Date</th>
              </tr></thead>
              <tbody>{filteredDropouts.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-bold">{r.name}</td>
                  <td className="px-3 py-2">{r.department}</td>
                  <td className="px-3 py-2">{r.reason}</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">{r.dropoutStage}</span></td>
                  <td className="px-3 py-2">{r.dropoutDate}</td>
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
                <th className="px-3 py-2 text-right font-bold text-slate-600">Preview</th>
              </tr></thead>
              <tbody>{filteredDailyReports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-orange-50/30">
                  <td className="px-3 py-2 font-semibold">{r.date}</td>
                  <td className="px-3 py-2 font-bold">{r.role}</td>
                  <td className="px-3 py-2">{r.candidateSourced}</td>
                  <td className="px-3 py-2">{r.screeningDone}</td>
                  <td className="px-3 py-2">{r.interviewsTaken}</td>
                  <td className="px-3 py-2">{r.selected}</td>
                  <td className="px-3 py-2">{r.offerLetterSent}</td>
                  <td className="px-3 py-2">{r.joined}</td>
                  <td className="px-3 py-2">{r.pendingFollowups}</td>
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
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 text-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between saffron-gradient text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black">Abbu Veena Daily Report Preview</h3>
                  <p className="text-[10px] text-orange-100">{selectedReport.role} — {selectedReport.date}</p>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block">Sourced</span><strong className="text-sm text-slate-800">{selectedReport.candidateSourced || 0}</strong></div>
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block">Screened</span><strong className="text-sm text-slate-800">{selectedReport.screeningDone || 0}</strong></div>
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block">Interviews</span><strong className="text-sm text-slate-800">{selectedReport.interviewsTaken || 0}</strong></div>
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block">Selected</span><strong className="text-sm text-slate-800">{selectedReport.selected || 0}</strong></div>
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block">Offers Sent</span><strong className="text-sm text-slate-800">{selectedReport.offerLetterSent || 0}</strong></div>
                <div><span className="text-[10px] text-slate-400 font-bold uppercase block">Joined</span><strong className="text-sm text-slate-800">{selectedReport.joined || 0}</strong></div>
              </div>
              {selectedReport.pendingFollowups && (
                <div>
                  <label className="block font-bold text-slate-900 mb-1">Pending Followups & Notes</label>
                  <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {selectedReport.pendingFollowups}
                  </div>
                </div>
              )}
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
