'use client';

import React, { useState, useEffect } from 'react';
import { FileText, ShieldAlert, UserX, LogOut, CreditCard, MessageSquareWarning, ClipboardList, Calendar } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';

export default function AravindReportPage() {
  const [retention, setRetention] = useState<any[]>([]);
  const [resignation, setResignation] = useState<any[]>([]);
  const [exit, setExit] = useState<any[]>([]);
  const [fnf, setFnf] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    aravindApi.getRetention().then(setRetention).catch(() => {});
    aravindApi.getResignation().then(setResignation).catch(() => {});
    aravindApi.getExitClearance().then(setExit).catch(() => {});
    aravindApi.getFnF().then(setFnf).catch(() => {});
    aravindApi.getComplaints().then(setComplaints).catch(() => {});
    aravindApi.getExitInterview().then(setInterviews).catch(() => {});
    aravindApi.getDailyReports().then(setDailyReports).catch(() => {});
  }, []);

  const filterByDate = (records: any[]) => {
    if (!filterDate) return records;
    return records.filter((r) => {
      const created = r.createdAt ? r.createdAt.split('T')[0] : '';
      return created === filterDate;
    });
  };

  const filteredRetention = filterByDate(retention);
  const filteredResignation = filterByDate(resignation);
  const filteredExit = filterByDate(exit);
  const filteredFnf = filterByDate(fnf);
  const filteredComplaints = filterByDate(complaints);
  const filteredInterviews = filterByDate(interviews);
  const filteredDailyReports = filterDate
    ? dailyReports.filter((r) => r.reportDate === filterDate || (r.createdAt && r.createdAt.split('T')[0] === filterDate))
    : dailyReports;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            <span>Aravind&apos;s Complete Report</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exit & Resignation specialist — all sections data
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

      {/* Retention Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" /> Retention ({filteredRetention.length})
        </h2>
        {filteredRetention.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Department</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Reason</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Outcome</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Status</th>
              </tr></thead>
              <tbody>{filteredRetention.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.department}</td>
                  <td className="px-3 py-2">{r.reason}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.retentionOutcome === 'Retained' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.retentionOutcome}</span></td>
                  <td className="px-3 py-2">{r.status}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Resignation Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <UserX className="w-4 h-4 text-red-600" /> Resignation ({filteredResignation.length})
        </h2>
        {filteredResignation.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Department</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Date</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Notice Period</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Overall</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">LWD</th>
              </tr></thead>
              <tbody>{filteredResignation.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.department}</td>
                  <td className="px-3 py-2">{r.dateOfResignation}</td>
                  <td className="px-3 py-2">{r.noticePeriod}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.overall === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.overall}</span></td>
                  <td className="px-3 py-2">{r.lwd}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Exit Clearance Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <LogOut className="w-4 h-4 text-blue-600" /> Exit Clearance ({filteredExit.length})
        </h2>
        {filteredExit.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Manager</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">IT</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Admin</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Finance</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">HR</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Overall</th>
              </tr></thead>
              <tbody>{filteredExit.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.managerClearance}</td>
                  <td className="px-3 py-2">{r.itClearance}</td>
                  <td className="px-3 py-2">{r.adminClearance}</td>
                  <td className="px-3 py-2">{r.financeClearance}</td>
                  <td className="px-3 py-2">{r.hrClearance}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.overallClearance === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.overallClearance}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* F&F Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <CreditCard className="w-4 h-4 text-emerald-600" /> F&F Settlements ({filteredFnf.length})
        </h2>
        {filteredFnf.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Amount</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Payment Status</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Payment Date</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Pending</th>
              </tr></thead>
              <tbody>{filteredFnf.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2 font-semibold">{r.fnfAmount}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.paymentStatus === 'Processed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{r.paymentStatus}</span></td>
                  <td className="px-3 py-2">{r.paymentDate}</td>
                  <td className="px-3 py-2">{r.pending}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Complaints Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <MessageSquareWarning className="w-4 h-4 text-purple-600" /> Employee Complaints ({filteredComplaints.length})
        </h2>
        {filteredComplaints.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Category</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Summary</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Status</th>
              </tr></thead>
              <tbody>{filteredComplaints.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">{r.category}</span></td>
                  <td className="px-3 py-2 max-w-[200px] truncate">{r.complaintSummary}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'Resolved' || r.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{r.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {/* Exit Interview Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
          <ClipboardList className="w-4 h-4 text-sky-600" /> Exit Interviews ({filteredInterviews.length})
        </h2>
        {filteredInterviews.length === 0 ? <p className="text-xs text-slate-400">No records</p> : (
          <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Emp ID</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Name</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Reason</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Interview Date</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Rehire</th>
              </tr></thead>
              <tbody>{filteredInterviews.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{r.employeeId}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.reason}</td>
                  <td className="px-3 py-2">{r.interviewDate}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.rehireEligibility === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.rehireEligibility}</span></td>
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
                <th className="px-3 py-2 text-left font-bold text-slate-600">Resignations</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Retention</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Retained</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Exit Done</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">F&F Done</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">F&F Pending</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Key Actions</th>
              </tr></thead>
              <tbody>{filteredDailyReports.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-semibold">{r.reportDate}</td>
                  <td className="px-3 py-2">{r.resignationReceived}</td>
                  <td className="px-3 py-2">{r.retentionCases}</td>
                  <td className="px-3 py-2">{r.employeeRetained}</td>
                  <td className="px-3 py-2">{r.exitClearanceCompleted}</td>
                  <td className="px-3 py-2">{r.fnfCompleted}</td>
                  <td className="px-3 py-2">{r.fnfPending}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate">{r.keyActions}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
