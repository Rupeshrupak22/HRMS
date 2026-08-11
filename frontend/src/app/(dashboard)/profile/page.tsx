'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, BadgeCheck, Briefcase, Building2, KeyRound } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const profile = {
    name: user?.name || 'Abbu Veena',
    email: user?.email || 'veena@adyapan.com',
    phone: user?.phone || '6300745565',
    employeeId: user?.employeeCode || 'ADP0417',
    designation: user?.designation || 'HR Talent Acquisition',
    department: user?.department || 'HR',
    role: user?.role || 'HR Manager',
    avatar: user?.profilePhoto || null,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <p className="text-sm text-slate-500">View and update your personal information</p>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xl font-bold text-slate-600">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center">
              <BadgeCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.designation}</p>
            <span className="text-xs font-semibold text-orange-600">{profile.role}</span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
          <button className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Edit
          </button>
        </div>

        <div className="space-y-5">
          <InfoRow icon={User} label="FULL NAME" value={profile.name} />
          <InfoRow icon={Mail} label="EMAIL" value={profile.email} />
          <InfoRow icon={Phone} label="PHONE" value={profile.phone} />
          <InfoRow icon={BadgeCheck} label="EMPLOYEE ID" value={profile.employeeId} />
          <InfoRow icon={Briefcase} label="DESIGNATION" value={profile.designation} />
          <InfoRow icon={Building2} label="TEAM / DEPT" value={profile.department} />
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">Change Password</h3>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Change
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <Icon className="w-4.5 h-4.5 text-slate-400" />
      <div>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
