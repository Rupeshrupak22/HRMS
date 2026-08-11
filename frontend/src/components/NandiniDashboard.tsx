'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Building2, DollarSign, FileText, Send } from 'lucide-react';
import { aravindApi } from '@/lib/aravind-api';
import { nitishaApi } from '@/lib/nitisha-api';
import { veenaApi } from '@/lib/veena-api';

export function NandiniDashboard() {
  const [reportCounts, setReportCounts] = useState({ aravind: 0, nitisha: 0, veena: 0, pavitra: 0, charitha: 0 });
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function load() {
      try {
        const [ar, ni, ve] = await Promise.all([
          aravindApi.getDailyReports(),
          nitishaApi.getDailyReports(),
          veenaApi.getDailyReports(),
        ]);
        const todayAravind = ar.filter((r: any) => r.reportDate === todayDate || r.createdAt?.split('T')[0] === todayDate).length;
        const todayNitisha = ni.filter((r: any) => r.createdAt?.split('T')[0] === todayDate).length;
        const todayVeena = ve.filter((r: any) => r.date === todayDate || r.createdAt?.split('T')[0] === todayDate).length;
        setReportCounts({ aravind: todayAravind, nitisha: todayNitisha, veena: todayVeena, pavitra: 0, charitha: 0 });
      } catch {}
    }
    load();
  }, [todayDate]);

  const totalReportsToday = reportCounts.aravind + reportCounts.nitisha + reportCounts.veena + reportCounts.pavitra + reportCounts.charitha;
  const pendingReports = 5 - (reportCounts.aravind > 0 ? 1 : 0) - (reportCounts.nitisha > 0 ? 1 : 0) - (reportCounts.veena > 0 ? 1 : 0) - (reportCounts.pavitra > 0 ? 1 : 0) - (reportCounts.charitha > 0 ? 1 : 0);

  const hrTeamMembers = [
    { name: 'Charitha', role: 'HR Salary & Payroll', email: 'charitha@adyapan.com', tasks: 'August CTC Calculation & Bank CSV', reported: reportCounts.charitha > 0, link: '/reports/charitha' },
    { name: 'Aravind Madhesh Kumar', role: 'HR Resignation & Exit System', email: 'aravind@adyapan.com', tasks: 'Notice Period & No-Dues Clearances', reported: reportCounts.aravind > 0, link: '/reports/aravind' },
    { name: 'Abbu Veena', role: 'HR Onboarding & Hiring', email: 'veena@adyapan.com', tasks: 'ATS Resume Screen & Offer Letters', reported: reportCounts.veena > 0, link: '/reports/veena' },
    { name: 'Nitisha', role: 'HR Discipline & POSH', email: 'nitisha@adyapan.com', tasks: 'POSH Compliance & Conduct Warnings', reported: reportCounts.nitisha > 0, link: '/reports/nitisha' },
    { name: 'Pavitra', role: 'HR Attendance & Leave', email: 'pavitra@adyapan.com', tasks: 'Live Web Check-in & LOP Logs', reported: reportCounts.pavitra > 0, link: '/reports/pavitra' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <span>Biradar Nandini — HR Master Manager Operations Hub</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              HR MANAGER
            </span>
          </h1>
          <p className="text-xs text-orange-100 mt-1">
            Complete supervision over Charitha (Payroll), Aravind (Exit), Veena (Hiring), Nitisha (POSH), and Pavitra (Attendance)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/all-daily" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer">
            <Send className="w-4 h-4" />
            <span>Review All Daily Reports</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">HR Team Members</div>
            <div className="text-2xl font-black text-slate-900 mt-1">5 Specialists</div>
            <div className="text-[10px] text-emerald-600 mt-1 font-bold">100% Operational</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Reports Today</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{totalReportsToday} Submitted</div>
            <div className="text-[10px] text-slate-500 mt-1">From all specialists</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Pending Reports</div>
            <div className={`text-2xl font-black mt-1 ${pendingReports > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{pendingReports > 0 ? `${pendingReports} Pending` : 'All Done'}</div>
            <div className="text-[10px] text-slate-500 mt-1">Today&apos;s submissions</div>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${pendingReports > 0 ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Team Supervision Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
          <span>HR Team Supervision Roster</span>
          <span className="text-xs text-orange-600 font-bold">5 Active HR Specialists</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">HR Specialist</th>
                <th className="py-3 px-4">Role & Domain</th>
                <th className="py-3 px-4">Active Key Responsibilities</th>
                <th className="py-3 px-4">Daily Report</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {hrTeamMembers.map((member, i) => (
                <tr key={i} className="hover:bg-orange-50/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div>{member.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{member.email}</div>
                  </td>
                  <td className="py-3 px-4 text-orange-600 font-bold">{member.role}</td>
                  <td className="py-3 px-4 text-slate-700">{member.tasks}</td>
                  <td className="py-3 px-4">
                    {member.reported ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">
                        SUBMITTED TODAY
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded">
                        PENDING
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={member.link} className="text-orange-600 font-bold hover:underline cursor-pointer">
                      Review Work
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
