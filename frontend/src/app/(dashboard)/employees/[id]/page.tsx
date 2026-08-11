'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import {
  Building2,
  GraduationCap,
  Laptop,
  Mail,
  Phone,
  Briefcase,
  Edit3,
  Shield,
  Award,
} from 'lucide-react';

export default function EmployeeProfilePage() {
  const params = useParams();
  const [emp, setEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest(`/employees/${params.id}`);
        setEmp(data);
      } catch {
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

  if (loading || !emp) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
        <div className="h-32 saffron-gradient" />
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-12">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg saffron-gradient flex items-center justify-center text-3xl font-black text-white">
              {emp.firstName[0]}{emp.lastName[0]}
            </div>

            {/* Info */}
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
                  <Shield className="w-3.5 h-3.5 text-orange-500" /> {emp.employeeCode}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-500" /> {emp.department?.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-orange-500" /> {emp.designation?.title}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-500" /> {emp.user?.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-orange-500" /> {emp.mobileNumber}
                </span>
              </div>
            </div>

            {/* CTC & Edit */}
            <div className="flex items-center gap-3">
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Annual CTC</span>
                <span className="font-black text-orange-600 text-lg">
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

      {/* Content */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <OverviewTab emp={emp} />
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function OverviewTab({ emp }: { emp: any }) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Experience" value="4+ Years" color="blue" />
        <StatCard label="Leave Balance" value={`${emp.leaveBalances?.reduce((a: number, l: any) => a + (l.totalDays - l.usedDays), 0)} Days`} color="emerald" />
        <StatCard label="Goals" value={`${emp.goals?.length || 0} Active`} color="purple" />
        <StatCard label="Assets" value={`${emp.assetAssignments?.length || 0} Assigned`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employment Summary */}
        <div className="space-y-4">
          <SectionTitle icon={Briefcase} title="Employment Summary" />
          <InfoTable rows={[
            { label: 'Reporting Manager', value: emp.reportingManager },
            { label: 'Joining Date', value: emp.joiningDate },
            { label: 'Work Location', value: emp.workLocation },
            { label: 'Employment Type', value: emp.employmentType },
            { label: 'Confirmation Date', value: emp.confirmationDate },
          ]} />
        </div>

        {/* Skills & Certifications */}
        <div className="space-y-4">
          <SectionTitle icon={Award} title="Skills & Certifications" />
          <div className="flex flex-wrap gap-2">
            {emp.skills?.map((skill: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-[11px] font-semibold border border-orange-100">
                {skill}
              </span>
            ))}
          </div>
          <div className="space-y-2">
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

      {/* Assets */}
      <div className="space-y-4">
        <SectionTitle icon={Laptop} title="Assigned Assets & Hardware" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {emp.assetAssignments?.map((a: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Laptop className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{a.asset.name}</div>
                  <div className="text-[10px] text-slate-500">Tag: {a.asset.assetTag}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">In Use</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ─── Reusable helpers ─── */

function SectionTitle({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
      <Icon className="w-4 h-4 text-orange-500" />
      {title}
    </h3>
  );
}

function InfoTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
      {rows.map((item, i) => (
        <div key={i} className="flex justify-between items-center px-4 py-3 text-xs">
          <span className="text-slate-500">{item.label}</span>
          <span className="font-semibold text-slate-900">{item.value || '-'}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-50 to-indigo-50 border-blue-100 text-blue-600 text-blue-900',
    emerald: 'from-emerald-50 to-green-50 border-emerald-100 text-emerald-600 text-emerald-900',
    purple: 'from-purple-50 to-violet-50 border-purple-100 text-purple-600 text-purple-900',
    amber: 'from-amber-50 to-orange-50 border-amber-100 text-amber-600 text-amber-900',
    orange: 'from-orange-50 to-amber-50 border-orange-100 text-orange-600 text-orange-900',
  };
  const c = colors[color] || colors.blue;
  const parts = c.split(' ');
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${parts[0]} ${parts[1]} border ${parts[2]}`}>
      <div className={`text-[10px] ${parts[3]} font-bold uppercase`}>{label}</div>
      <div className={`text-lg font-black ${parts[4]} mt-1`}>{value}</div>
    </div>
  );
}
