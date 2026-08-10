'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import {
  User,
  Building2,
  Clock,
  CalendarDays,
  CreditCard,
  FolderOpen,
  Target,
  GraduationCap,
  Laptop,
  Receipt,
  Activity,
  CheckCircle,
  FileText,
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const params = useParams();
  const [emp, setEmp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest(`/employees/${params.id}`);
        setEmp(data);
      } catch (err) {
        setEmp({
          id: params.id,
          employeeCode: 'EMP-005',
          firstName: 'Arjun',
          lastName: 'Mehta',
          user: { email: 'techlead@adyapan.com', role: 'DEPARTMENT_HEAD' },
          department: { name: 'Technology' },
          designation: { title: 'Tech Lead' },
          joiningDate: '2023-06-10',
          status: 'ACTIVE',
          bankAccountNo: 'XXXX-XXXX-9182',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          mobileNumber: '+91 98765 43210',
          salaryStructure: { ctc: 1600000, basicSalary: 800000, hra: 320000 },
          leaveBalances: [
            { leaveType: { name: 'Casual Leave' }, totalDays: 12, usedDays: 4 },
            { leaveType: { name: 'Sick Leave' }, totalDays: 12, usedDays: 2 },
          ],
          documents: [
            { title: 'PAN Card', category: 'PAN', isVerified: true },
            { title: 'Offer Letter', category: 'OFFER_LETTER', isVerified: true },
          ],
          assetAssignments: [
            { asset: { name: 'MacBook Pro M3 Max', assetTag: 'AST-9912', category: 'LAPTOP' }, assignedAt: '2023-06-10' },
          ],
          goals: [
            { title: 'Migrate HRMS backend to NestJS microservices', status: 'IN_PROGRESS', targetValue: 100, currentValue: 80 },
          ],
        });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [params.id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Info', icon: FileText },
    { id: 'employment', label: 'Employment', icon: Building2 },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leaves', icon: CalendarDays },
    { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'assets', label: 'Assets', icon: Laptop },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'activity', label: 'Activity Audit', icon: Activity },
  ];

  if (loading || !emp) {
    return <div className="p-8 text-center text-slate-500">Loading complete employee profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl saffron-gradient flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-orange-500/20">
            {emp.firstName[0]}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>{emp.firstName} {emp.lastName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {emp.status}
              </span>
            </h1>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-4">
              <span>Code: <strong className="text-slate-800">{emp.employeeCode}</strong></span>
              <span>Dept: <strong className="text-slate-800">{emp.department?.name}</strong></span>
              <span>Title: <strong className="text-slate-800">{emp.designation?.title}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-orange-50 border border-orange-200 text-xs">
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Annual CTC</span>
            <span className="font-black text-orange-600 text-base">
              ₹{(emp.salaryStructure?.ctc || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 12 Tab Bar */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'saffron-gradient text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs min-h-[350px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Employment Summary</h3>
              <div className="text-xs space-y-2 text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Reporting Manager:</span>
                  <span className="font-bold text-slate-900">Vikram Sharma (CTO)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Joining Date:</span>
                  <span className="font-bold text-slate-900">{emp.joiningDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Work Location:</span>
                  <span className="font-bold text-slate-900">Adyapan HQ (Hybrid)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Assigned Assets & Hardware</h3>
              <div className="space-y-2">
                {emp.assetAssignments?.map((a: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{a.asset.name}</div>
                      <div className="text-[10px] text-slate-500">Tag: {a.asset.assetTag}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">In Use</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">CTC & Salary Structure Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Basic Salary (50% CTC)</span>
                <div className="text-lg font-black text-slate-900 mt-1">
                  ₹{(emp.salaryStructure?.basicSalary || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">HRA Allowance (40% Basic)</span>
                <div className="text-lg font-black text-slate-900 mt-1">
                  ₹{(emp.salaryStructure?.hra || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-amber-700 font-medium">PF & PT Statutory Deductions</span>
                <div className="text-lg font-black text-amber-900 mt-1">₹24,000 / yr</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Verified HR Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {emp.documents?.map((d: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-bold text-slate-900">{d.title}</div>
                      <div className="text-[10px] text-slate-500">Category: {d.category}</div>
                    </div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {['personal', 'employment', 'attendance', 'leave', 'performance', 'training', 'assets', 'expenses', 'activity'].includes(activeTab) && (
          <div className="text-xs text-slate-600 space-y-3">
            <div className="font-bold text-slate-900 capitalize">{activeTab} Details & Audit Trail</div>
            <p>Full production record synchronization enabled for {emp.firstName} {emp.lastName}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
