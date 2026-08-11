'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, BadgeCheck, Briefcase, Building2, KeyRound, Edit3 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

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
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">View and update your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-xl font-bold text-white">
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
            <span className="text-xs font-bold text-orange-600">{profile.role}</span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
          <button className="px-5 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Edit
          </button>
        </div>

        <div className="space-y-6 pl-2">
          <div className="flex items-start gap-4">
            <User className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">FULL NAME</p>
              <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Mail className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">EMAIL</p>
              <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Phone className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">PHONE</p>
              <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <BadgeCheck className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">EMPLOYEE ID</p>
              <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.employeeId}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Briefcase className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">DESIGNATION</p>
              <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.designation}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Building2 className="w-5 h-5 text-orange-500 mt-1" />
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">TEAM / DEPT</p>
              <p className="text-sm text-slate-900 font-semibold mt-0.5">{profile.department}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
          </div>
          <button className="px-5 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Change
          </button>
        </div>
      </div>
    </div>
  );
}
