'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Edit3,
  Shield,
  Award,
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const params = useParams();
  const [emp, setEmp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest(`/employees/${params.id}`);
        setEmp(data);
        if (data.profilePhoto) setProfilePhoto(data.profilePhoto);
      } catch (err) {
        setEmp({
          id: params.id,
          employeeCode: 'EMP-012',
          firstName: 'Veena',
          lastName: 'Sharma',
          user: { email: 'veena.sharma@adyapan.com', role: 'EMPLOYEE' },
          department: { name: 'Human Resources' },
          designation: { title: 'HR Manager' },
          joiningDate: '2022-03-15',
          status: 'ACTIVE',
          gender: 'Female',
          dateOfBirth: '1992-07-20',
          bloodGroup: 'B+',
          maritalStatus: 'Married',
          mobileNumber: '+91 99887 65432',
          emergencyContact: '+91 98765 11223',
          permanentAddress: '45, Sector 12, Noida, UP - 201301',
          currentAddress: '302, Green Valley Apartments, Gurgaon, HR - 122001',
          bankAccountNo: 'XXXX-XXXX-7654',
          ifscCode: 'ICICI0003456',
          bankName: 'ICICI Bank',
          panNumber: 'ABCPV1234K',
          aadharNumber: 'XXXX-XXXX-5678',
          reportingManager: 'Rajesh Kumar (VP - HR)',
          workLocation: 'Adyapan HQ (On-site)',
          employmentType: 'Full Time',
          probationEndDate: '2022-09-15',
          confirmationDate: '2022-09-16',
          salaryStructure: { ctc: 1800000, basicSalary: 900000, hra: 360000, special: 240000, pf: 108000 },
          leaveBalances: [
            { leaveType: { name: 'Casual Leave' }, totalDays: 12, usedDays: 3 },
            { leaveType: { name: 'Sick Leave' }, totalDays: 12, usedDays: 1 },
            { leaveType: { name: 'Earned Leave' }, totalDays: 15, usedDays: 5 },
          ],
          documents: [
            { title: 'PAN Card', category: 'PAN', isVerified: true },
            { title: 'Aadhar Card', category: 'AADHAR', isVerified: true },
            { title: 'Offer Letter', category: 'OFFER_LETTER', isVerified: true },
            { title: 'Degree Certificate', category: 'EDUCATION', isVerified: true },
          ],
          assetAssignments: [
            { asset: { name: 'Dell Latitude 5540', assetTag: 'AST-1087', category: 'LAPTOP' }, assignedAt: '2022-03-15' },
            { asset: { name: 'HP LaserJet Pro', assetTag: 'AST-2034', category: 'PRINTER' }, assignedAt: '2022-04-01' },
          ],
          goals: [
            { title: 'Implement new onboarding workflow', status: 'COMPLETED', targetValue: 100, currentValue: 100 },
            { title: 'Reduce employee attrition by 15%', status: 'IN_PROGRESS', targetValue: 100, currentValue: 65 },
          ],
          skills: ['Talent Acquisition', 'Employee Relations', 'HRIS', 'Compliance', 'Performance Management'],
          certifications: [
            { name: 'SHRM-CP', issuer: 'SHRM', year: 2021 },
            { name: 'Certified HR Professional', issuer: 'HRCI', year: 2020 },
          ],
        });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [params.id]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        // TODO: Upload to server via API
      };
      reader.readAsDataURL(file);
    }
  };

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
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── PROFILE HEADER WITH COVER ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        {/* Cover gradient */}
        <div className="h-36 saffron-gradient relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-12 w-24 h-24 rounded-full bg-white/20" />
            <div className="absolute bottom-2 left-20 w-16 h-16 rounded-full bg-white/15" />
            <div className="absolute top-8 left-1/2 w-32 h-32 rounded-full bg-white/10" />
          </div>
        </div>

        {/* Profile content */}
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-12 relative">
            {/* Avatar with photo upload */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-orange-100 to-orange-50">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={`${emp.firstName} ${emp.lastName}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full saffron-gradient flex items-center justify-center text-3xl font-black text-white">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                )}
              </div>
              {/* Camera overlay for photo upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer"
                aria-label="Upload profile photo"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Name & details */}
            <div className="flex-1 pt-2 md:pt-0 md:pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900">
                  {emp.firstName} {emp.lastName}
                </h1>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {emp.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-orange-500" />
                  {emp.employeeCode}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-500" />
                  {emp.department?.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                  {emp.designation?.title}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-500" />
                  {emp.user?.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  {emp.mobileNumber}
                </span>
              </div>
            </div>

            {/* CTC & Quick actions */}
            <div className="flex items-center gap-3 md:self-center">
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">Annual CTC</span>
                <span className="font-black text-orange-600 text-lg leading-tight">
                  ₹{(emp.salaryStructure?.ctc || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <button className="p-2.5 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-slate-500 hover:text-orange-600 cursor-pointer" aria-label="Edit profile">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'saffron-gradient text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-500 hover:text-orange-600 hover:bg-orange-50/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Quick stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="text-[10px] text-blue-600 font-bold uppercase">Experience</div>
                <div className="text-lg font-black text-blue-900 mt-1">4+ Years</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                <div className="text-[10px] text-emerald-600 font-bold uppercase">Leave Balance</div>
                <div className="text-lg font-black text-emerald-900 mt-1">
                  {emp.leaveBalances?.reduce((acc: number, l: any) => acc + (l.totalDays - l.usedDays), 0)} Days
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                <div className="text-[10px] text-purple-600 font-bold uppercase">Goals</div>
                <div className="text-lg font-black text-purple-900 mt-1">{emp.goals?.length || 0} Active</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                <div className="text-[10px] text-amber-600 font-bold uppercase">Assets</div>
                <div className="text-lg font-black text-amber-900 mt-1">{emp.assetAssignments?.length || 0} Assigned</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Employment Summary */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                  Employment Summary
                </h3>
                <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
                  {[
                    { label: 'Reporting Manager', value: emp.reportingManager || 'Rajesh Kumar (VP - HR)' },
                    { label: 'Joining Date', value: emp.joiningDate },
                    { label: 'Work Location', value: emp.workLocation || 'Adyapan HQ (On-site)' },
                    { label: 'Employment Type', value: emp.employmentType || 'Full Time' },
                    { label: 'Confirmation Date', value: emp.confirmationDate || '2022-09-16' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-3 text-xs">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills & Certifications */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-500" />
                  Skills & Certifications
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {emp.skills?.map((skill: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-[11px] font-semibold border border-orange-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2 mt-3">
                    {emp.certifications?.map((cert: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{cert.name}</div>
                          <div className="text-[10px] text-slate-500">{cert.issuer} • {cert.year}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Assets Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-orange-500" />
                Assigned Assets & Hardware
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {emp.assetAssignments?.map((a: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <Laptop className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{a.asset.name}</div>
                        <div className="text-[10px] text-slate-500">Tag: {a.asset.assetTag}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                      In Use
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL INFO TAB */}
        {activeTab === 'personal' && (
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
                {[
                  { label: 'Date of Birth', value: emp.dateOfBirth || '-' },
                  { label: 'Gender', value: emp.gender || '-' },
                  { label: 'Blood Group', value: emp.bloodGroup || '-' },
                  { label: 'Marital Status', value: emp.maritalStatus || '-' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-3 text-xs">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase mb-1">
                    <MapPin className="w-3 h-3" /> Current Address
                  </div>
                  <div className="text-xs text-slate-900">{emp.currentAddress || '-'}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase mb-1">
                    <MapPin className="w-3 h-3" /> Permanent Address
                  </div>
                  <div className="text-xs text-slate-900">{emp.permanentAddress || '-'}</div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-4">
              <Phone className="w-4 h-4 text-orange-500" />
              Contact & Identity
            </h3>
            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
              {[
                { label: 'Mobile Number', value: emp.mobileNumber || '-' },
                { label: 'Emergency Contact', value: emp.emergencyContact || '-' },
                { label: 'PAN Number', value: emp.panNumber || '-' },
                { label: 'Aadhar Number', value: emp.aadharNumber || '-' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-3 text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYROLL TAB */}
        {activeTab === 'payroll' && (
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-500" />
              Salary Structure & Compensation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                <span className="text-[10px] text-orange-600 font-bold uppercase">Basic Salary</span>
                <div className="text-lg font-black text-orange-900 mt-1">
                  ₹{(emp.salaryStructure?.basicSalary || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-500">50% of CTC</span>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <span className="text-[10px] text-blue-600 font-bold uppercase">HRA</span>
                <div className="text-lg font-black text-blue-900 mt-1">
                  ₹{(emp.salaryStructure?.hra || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-500">40% of Basic</span>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                <span className="text-[10px] text-emerald-600 font-bold uppercase">Special Allowance</span>
                <div className="text-lg font-black text-emerald-900 mt-1">
                  ₹{(emp.salaryStructure?.special || 240000).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-500">Variable</span>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                <span className="text-[10px] text-purple-600 font-bold uppercase">PF Contribution</span>
                <div className="text-lg font-black text-purple-900 mt-1">
                  ₹{(emp.salaryStructure?.pf || 108000).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-500">12% of Basic</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-4">
              <Building2 className="w-4 h-4 text-orange-500" />
              Bank Details
            </h3>
            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
              {[
                { label: 'Bank Name', value: emp.bankName || '-' },
                { label: 'Account Number', value: emp.bankAccountNo || '-' },
                { label: 'IFSC Code', value: emp.ifscCode || '-' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-3 text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEAVE TAB */}
        {activeTab === 'leave' && (
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-orange-500" />
              Leave Balances
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {emp.leaveBalances?.map((leave: any, i: number) => {
                const remaining = leave.totalDays - leave.usedDays;
                const percent = (remaining / leave.totalDays) * 100;
                return (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 space-y-3">
                    <div className="text-xs font-bold text-slate-900">{leave.leaveType.name}</div>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-2xl font-black text-slate-900">{remaining}</span>
                        <span className="text-xs text-slate-500 ml-1">/ {leave.totalDays} days</span>
                      </div>
                      <span className="text-[10px] text-orange-600 font-bold">{leave.usedDays} used</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full saffron-gradient transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-orange-500" />
              Verified Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {emp.documents?.map((d: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{d.title}</div>
                      <div className="text-[10px] text-slate-500">{d.category}</div>
                    </div>
                  </div>
                  {d.isVerified && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Verified</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              Goals & Performance
            </h3>
            <div className="space-y-3">
              {emp.goals?.map((goal: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-900">{goal.title}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      goal.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {goal.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.status === 'COMPLETED' ? 'bg-emerald-500' : 'saffron-gradient'
                        }`}
                        style={{ width: `${goal.currentValue}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{goal.currentValue}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMPLOYMENT TAB */}
        {activeTab === 'employment' && (
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-500" />
              Employment Details
            </h3>
            <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
              {[
                { label: 'Employee Code', value: emp.employeeCode },
                { label: 'Department', value: emp.department?.name },
                { label: 'Designation', value: emp.designation?.title },
                { label: 'Reporting Manager', value: emp.reportingManager || 'Rajesh Kumar (VP - HR)' },
                { label: 'Joining Date', value: emp.joiningDate },
                { label: 'Employment Type', value: emp.employmentType || 'Full Time' },
                { label: 'Probation End Date', value: emp.probationEndDate || '-' },
                { label: 'Confirmation Date', value: emp.confirmationDate || '-' },
                { label: 'Work Location', value: emp.workLocation || 'Adyapan HQ (On-site)' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-3 text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GENERIC TABS - Attendance, Training, Assets, Expenses, Activity */}
        {['attendance', 'training', 'assets', 'expenses', 'activity'].includes(activeTab) && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              {activeTab === 'activity' ? 'Activity Audit' : activeTab} Details
            </h3>
            <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <p className="text-xs text-slate-600">
                Full {activeTab} records for <strong>{emp.firstName} {emp.lastName}</strong> will be synced from production.
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Module integration in progress</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
