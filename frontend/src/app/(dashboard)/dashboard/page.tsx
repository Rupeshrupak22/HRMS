'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import {
  Users,
  UserCheck,
  CalendarDays,
  Briefcase,
  Clock,
  Sparkles,
  Award,
  DollarSign,
  Receipt,
  FileText,
  Laptop,
  AlertTriangle,
  ShieldAlert,
  LogOut,
  UserPlus,
  CheckCircle2,
  FileCheck,
  Send,
  Download,
  XCircle,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiRequest('/reports/dashboard-metrics');
        setMetrics(data);
      } catch (err) {
        setMetrics({
          totalEmployees: 115,
          todayPresent: 102,
          todayLate: 4,
          pendingLeaves: 3,
          openJobs: 5,
        });
      }
    }
    loadData();
  }, []);

  const SAFFRON_COLORS = ['#f97316', '#d97706', '#0284c7', '#059669', '#8b5cf6', '#dc2626'];
  const userEmail = (user?.email || '').toLowerCase();

  // ====================================================
  // 1. CHARITHA — SALARY & PAYROLL SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'charitha@adyapan.com' || user?.specialization === 'SALARY_PAYROLL') {
    const deptSalaryData = [
      { name: 'Technology', grossCtc: 5400000 },
      { name: 'Academic', grossCtc: 3200000 },
      { name: 'Sales', grossCtc: 1800000 },
      { name: 'Operations', grossCtc: 1200000 },
      { name: 'HR & Admin', grossCtc: 900000 },
    ];

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span>Charitha — HR Salary & Payroll Disbursement Center</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                PAYROLL SPECIALIST
              </span>
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              Monthly CTC breakdown, PF/ESI/TDS tax deductions, HDFC bank disbursal statements & payslips
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/payroll" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export HDFC Bank Register</span>
            </a>
            <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Gross Monthly Payroll CTC</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹1.18 Cr</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">115 Salaried Staff</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">PF & Statutory Tax Deductions</div>
              <div className="text-2xl font-black text-amber-600 mt-1">₹18.0 Lakh</div>
              <div className="text-[10px] text-slate-500 mt-1">PF, PT, TDS Withheld</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Net Salary Disbursement</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">₹1.00 Cr</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">Direct HDFC Credit Ready</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">PDF Payslips Issued</div>
              <div className="text-2xl font-black text-blue-600 mt-1">115 / 115</div>
              <div className="text-[10px] text-slate-500 mt-1">August Payslips Batch Done</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Charitha Unique Charts & Salary Register Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Department Gross Salary Breakdown</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptSalaryData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip formatter={(value: any) => `₹${(Number(value) / 100000).toFixed(1)} L`} />
                  <Bar dataKey="grossCtc" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">August Salary Credit Processing Register</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Gross Salary</th>
                    <th className="py-2.5 px-3">PF/TDS Deductions</th>
                    <th className="py-2.5 px-3">Net Credit</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">Siddharth Verma (TECH)</td>
                    <td className="py-2.5 px-3">₹1,33,333</td>
                    <td className="py-2.5 px-3 text-amber-600">₹20,000</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">₹1,13,333</td>
                    <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">DISBURSED</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-slate-900">Arjun Mehta (TECH)</td>
                    <td className="py-2.5 px-3">₹1,77,777</td>
                    <td className="py-2.5 px-3 text-amber-600">₹26,666</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">₹1,51,111</td>
                    <td className="py-2.5 px-3 text-right"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">DISBURSED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 2. ARAVIND — RESIGNATION & EXIT SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'aravind@adyapan.com' || user?.specialization === 'RESIGNATION_EXIT') {
    const exitReasonData = [
      { name: 'Higher Studies', value: 40 },
      { name: 'Better Career Growth', value: 40 },
      { name: 'Relocation', value: 20 },
    ];

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span>Aravind — HR Resignations & Exit Clearances System</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                EXIT SPECIALIST
              </span>
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              Notice period tracking, exit interview reviews, department no-dues & Full & Final (F&F) settlement calculation
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/exit-management" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md">
              Process Exit Form
            </a>
            <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Active Resignation Notices</div>
              <div className="text-2xl font-black text-amber-600 mt-1">2 Staff</div>
              <div className="text-[10px] text-slate-500 mt-1">Notice Period: 60 Days</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <LogOut className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Exit Interviews Done</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">1 / 2 Completed</div>
              <div className="text-[10px] text-slate-500 mt-1">Feedback Recorded</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">No-Dues Sign-offs Pending</div>
              <div className="text-2xl font-black text-blue-600 mt-1">1 Pending</div>
              <div className="text-[10px] text-slate-500 mt-1">IT Laptop Return Sign-off</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Laptop className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Calculated F&F Balance</div>
              <div className="text-2xl font-black text-slate-900 mt-1">₹1,45,000</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">Encashable EL Included</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Aravind Unique Charts & Resignation Clearance Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Exit Reason Analytics</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={exitReasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                    {exitReasonData.map((e, idx) => (
                      <Cell key={idx} fill={SAFFRON_COLORS[idx % SAFFRON_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Resignation Clearance & F&F Queue</h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Ishan Abhinav (Sales Intern)</div>
                  <div className="text-[10px] text-slate-500">Resigned: 15 July 2026 | Last Day: 15 Aug 2026</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded">NO DUES PENDING</span>
                  <button className="px-3 py-1 bg-orange-600 text-white rounded text-[11px] font-bold">Issue Clearance</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 3. ABBU VEENA — ONBOARDING & HIRING SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'veena@adyapan.com' || user?.specialization === 'ONBOARDING_HIRING') {
    const funnelData = [
      { stage: 'Applied', candidates: 45 },
      { stage: 'AI Screened', candidates: 18 },
      { stage: 'Interview', candidates: 8 },
      { stage: 'Offered', candidates: 3 },
      { stage: 'Joined', candidates: 2 },
    ];

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span>Abbu Veena — Onboarding, ATS Hiring & Candidate Pipeline</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                ONBOARDING SPECIALIST
              </span>
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              Candidate ATS screening, AI resume matching, offer letter PDFs & day-1 joining document checklists
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/recruitment" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md">
              Open ATS Jobs Board
            </a>
            <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Active Job Vacancies</div>
              <div className="text-2xl font-black text-violet-600 mt-1">5 Open Jobs</div>
              <div className="text-[10px] text-slate-500 mt-1">45 Applications Received</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">AI Candidate Match Score</div>
              <div className="text-2xl font-black text-orange-600 mt-1">88.5% Avg</div>
              <div className="text-[10px] text-slate-500 mt-1">Rohan Deshmukh (Shortlisted)</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Offer Letters Issued</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">3 Offers</div>
              <div className="text-[10px] text-slate-500 mt-1">Joining 1st Sept 2026</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Joining Document Verification</div>
              <div className="text-2xl font-black text-blue-600 mt-1">100% Checked</div>
              <div className="text-[10px] text-slate-500 mt-1">PAN, Aadhaar & Marksheets</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Veena Unique Funnel & Candidate Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recruitment Funnel Progress</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis dataKey="stage" type="category" stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="candidates" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Candidate Onboarding Queue</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Rohan Deshmukh (Full Stack Dev)</div>
                  <div className="text-[10px] text-slate-500">Skills: React, Node.js, TS | Match: 88.5%</div>
                </div>
                <button className="px-3 py-1 bg-orange-600 text-white rounded font-bold text-[11px]">Generate Offer PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 4. NITISHA — DISCIPLINE, POSH & COMPLIANCE DASHBOARD
  // ====================================================
  if (userEmail === 'nitisha@adyapan.com' || user?.specialization === 'DISCIPLINE_POSH') {
    const complianceData = [
      { category: 'Code of Conduct', count: 2 },
      { category: 'Attendance Violation', count: 4 },
      { category: 'POSH Policy Inquiry', count: 0 },
    ];

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span>Nitisha — HR Discipline, POSH & Policy Compliance Office</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                DISCIPLINE & POSH SPECIALIST
              </span>
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              Disciplinary notices, POSH policy awareness, employee conduct warnings & grievance resolution hearings
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/employees" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md">
              Employee Conduct Directory
            </a>
            <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Active Misconduct Cases</div>
              <div className="text-2xl font-black text-amber-600 mt-1">1 Open Inquiry</div>
              <div className="text-[10px] text-slate-500 mt-1">Hearing Scheduled</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">POSH Complaints</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">0 Open Cases</div>
              <div className="text-[10px] text-emerald-600 mt-1 font-bold">100% Policy Compliant</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Disciplinary Warnings Issued</div>
              <div className="text-2xl font-black text-slate-900 mt-1">2 Warning Notices</div>
              <div className="text-[10px] text-slate-500 mt-1">Written Record Saved</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Grievance Hearings Resolved</div>
              <div className="text-2xl font-black text-blue-600 mt-1">4 Cases Closed</div>
              <div className="text-[10px] text-slate-500 mt-1">Mediated Sign-offs</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Nitisha Unique Charts & Disciplinary Cases Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Policy Violation Categories</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData}>
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Conduct Inquiry & Warning Log</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Unauthorized Absence Case #2026-88</div>
                  <div className="text-[10px] text-slate-500">Status: Inquiry Hearing Scheduled for 14th Aug</div>
                </div>
                <button className="px-3 py-1 bg-amber-600 text-white rounded font-bold text-[11px]">Issue Written Notice</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 5. PAVITRA — ATTENDANCE & LEAVE SPECIALIST DASHBOARD
  // ====================================================
  if (userEmail === 'pavitra@adyapan.com' || user?.specialization === 'ATTENDANCE_LEAVE') {
    const attendanceTrendData = [
      { day: 'Mon', present: 104, late: 3, absent: 3 },
      { day: 'Tue', present: 106, late: 2, absent: 2 },
      { day: 'Wed', present: 102, late: 4, absent: 4 },
      { day: 'Thu', present: 105, late: 2, absent: 3 },
      { day: 'Fri', present: 100, late: 6, absent: 4 },
    ];

    return (
      <div className="space-y-6">
        <div className="p-6 rounded-3xl saffron-gradient text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <span>Pavitra — HR Attendance Logs & Leave Approvals Desk</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                ATTENDANCE & LEAVE SPECIALIST
              </span>
            </h1>
            <p className="text-xs text-orange-100 mt-1">
              Live web check in/out logs, shift rosters, leave approvals & Loss of Pay (LOP) calculations
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/leaves" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md">
              Manage Leave Applications
            </a>
            <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-black/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> Submit Daily Report
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Today's Office Present</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">102 / 110</div>
              <div className="text-[10px] text-amber-600 font-bold mt-1">4 Late Check-ins Exceeded</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Pending Leave Applications</div>
              <div className="text-2xl font-black text-amber-600 mt-1">3 Applications</div>
              <div className="text-[10px] text-slate-500 mt-1">Casual & Sick Leaves</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Loss of Pay (LOP) Days</div>
              <div className="text-2xl font-black text-red-600 mt-1">2 LOPs</div>
              <div className="text-[10px] text-slate-500 mt-1">Unexcused Absence Logs</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-semibold">Approved Overtime Hours</div>
              <div className="text-2xl font-black text-blue-600 mt-1">24.5 Hours</div>
              <div className="text-[10px] text-slate-500 mt-1">August Shift Roster</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Pavitra Unique Charts & Attendance Approval Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Weekly Shift Attendance & Late Ratios</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceTrendData}>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="present" fill="#059669" name="Present" />
                  <Bar dataKey="late" fill="#d97706" name="Late" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Pavitra's Pending Leave Approval Queue</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Siddharth Verma — Casual Leave (2 Days)</div>
                  <div className="text-[10px] text-slate-500">Reason: Family Function | Dates: 18-19 Aug</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 bg-emerald-600 text-white rounded font-bold text-[11px]">Approve</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded font-bold text-[11px]">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // 6. BIRADAR NANDINI — HR MANAGER MASTER OPERATIONS HUB
  // ====================================================
  const hrTeamMembers = [
    { name: 'Charitha', role: 'HR Salary & Payroll', email: 'charitha@adyapan.com', status: 'ACTIVE', tasks: 'August CTC Calculation & Bank CSV' },
    { name: 'Aravind Madhesh Kumar', role: 'HR Resignation & Exit System', email: 'aravind@adyapan.com', status: 'ACTIVE', tasks: 'Notice Period & No-Dues Clearances' },
    { name: 'Abbu Veena', role: 'HR Onboarding & Hiring', email: 'veena@adyapan.com', status: 'ACTIVE', tasks: 'ATS Resume Screen & Offer Letters' },
    { name: 'Nitisha', role: 'HR Discipline & POSH', email: 'nitisha@adyapan.com', status: 'ACTIVE', tasks: 'POSH Compliance & Conduct Warnings' },
    { name: 'Pavitra', role: 'HR Attendance & Leave', email: 'pavitra@adyapan.com', status: 'ACTIVE', tasks: 'Live Web Check-in & LOP Logs' },
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
          <a href="/daily-reports" className="px-4 py-2 rounded-xl bg-white text-orange-600 font-extrabold text-xs shadow-md flex items-center gap-1.5">
            <Send className="w-4 h-4" />
            <span>Review All Daily Reports</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">HR Team Members</div>
            <div className="text-2xl font-black text-slate-900 mt-1">6 HR Specialists</div>
            <div className="text-[10px] text-emerald-600 mt-1 font-bold">100% Operational</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Total Company Staff</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{metrics?.totalEmployees || 115} Staff</div>
            <div className="text-[10px] text-slate-500 mt-1">110 Active | 5 Probation</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Monthly HR Ops Spend</div>
            <div className="text-2xl font-black text-amber-600 mt-1">₹4.2 Lakh</div>
            <div className="text-[10px] text-slate-500 mt-1">Software & Training</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Daily Work Reports</div>
            <div className="text-2xl font-black text-violet-600 mt-1">3 Pending</div>
            <div className="text-[10px] text-slate-500 mt-1">Requires Nandini Sign-off</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Biradar Nandini Unique Supervision Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
          <span>Biradar Nandini's HR Team Supervision Roster</span>
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
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">
                      SUBMITTED TODAY
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a href="/daily-reports" className="text-orange-600 font-bold hover:underline">
                      Review Work
                    </a>
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
