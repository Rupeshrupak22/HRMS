'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Briefcase, Hash, Shield, Pencil, Bell, Clock, CheckCircle2, Save, X, Phone, MapPin, Building2, Calendar, Heart } from 'lucide-react';

export default function MyProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const getStoredProfile = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`profile_${user?.email}`);
      if (saved) return JSON.parse(saved);
    }
    return null;
  };

  const defaultProfile = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    employeeCode: user?.employeeCode || '',
    role: user?.role || '',
    specialization: user?.specialization?.replace(/_/g, ' ') || 'General',
    phone: '+91 98765 43210',
    personalEmail: '',
    dateOfBirth: '1995-06-15',
    gender: 'Female',
    address: 'Bangalore, Karnataka',
    emergencyContact: '',
    emergencyPhone: '',
    bloodGroup: 'O+',
    department: 'HR',
    designation: user?.specialization?.replace(/_/g, ' ') || 'HR Executive',
    reportingTo: 'Biradar Nandini (HR Manager)',
    workLocation: 'Adyapan HQ',
    workMode: 'In-Office',
    employmentType: 'Full Time',
    joiningDate: '2024-03-15',
  };

  const [profile, setProfile] = useState(() => getStoredProfile() || defaultProfile);

  const handleSave = () => {
    localStorage.setItem(`profile_${user?.email}`, JSON.stringify(profile));
    setIsEditing(false);
  };

  const notifications = [
    { id: 1, title: 'Daily Report Submitted', time: 'Today', read: true },
    { id: 2, title: 'New candidate added to pipeline', time: 'Yesterday', read: false },
    { id: 3, title: 'Dropout reported - follow up required', time: '2 days ago', read: true },
    { id: 4, title: 'Weekly report approved by manager', time: '3 days ago', read: false },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl saffron-gradient flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {profile.firstName?.[0] || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-xs text-slate-500">{profile.email}</p>
              <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                {profile.specialization}
              </span>
            </div>
          </div>
          <button
            onClick={() => { if (isEditing) handleSave(); else setIsEditing(true); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${isEditing ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
          >
            {isEditing ? <><Save className="w-3.5 h-3.5" /> Save Changes</> : <><Pencil className="w-3.5 h-3.5" /> Edit Profile</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'firstName', label: 'First Name' },
                { key: 'lastName', label: 'Last Name' },
                { key: 'email', label: 'Email' },
                { key: 'employeeCode', label: 'Employee Code' },
                { key: 'phone', label: 'Phone' },
                { key: 'personalEmail', label: 'Personal Email' },
                { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                { key: 'gender', label: 'Gender' },
                { key: 'bloodGroup', label: 'Blood Group' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{field.label}</label>
                  {isEditing ? (
                    <input type={field.type || 'text'} value={(profile as any)[field.key]}
                      onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-orange-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  ) : (
                    <div className="text-sm font-semibold text-slate-800 py-1.5 border-b border-slate-100">{(profile as any)[field.key] || '—'}</div>
                  )}
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Address</label>
                {isEditing ? (
                  <input type="text" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-orange-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                ) : (
                  <div className="text-sm font-semibold text-slate-800 py-1.5 border-b border-slate-100">{profile.address || '—'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-orange-500" /> Emergency Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'emergencyContact', label: 'Contact Name', placeholder: 'Enter name' },
                { key: 'emergencyPhone', label: 'Contact Phone', placeholder: 'Enter phone' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{field.label}</label>
                  {isEditing ? (
                    <input type="text" value={(profile as any)[field.key]} placeholder={field.placeholder}
                      onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-orange-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  ) : (
                    <div className="text-sm font-semibold text-slate-800 py-1.5 border-b border-slate-100">{(profile as any)[field.key] || '—'}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Work Information */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-500" /> Work Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'department', label: 'Department' },
                { key: 'designation', label: 'Designation' },
                { key: 'reportingTo', label: 'Reporting To' },
                { key: 'workLocation', label: 'Work Location' },
                { key: 'workMode', label: 'Work Mode' },
                { key: 'employmentType', label: 'Employment Type' },
                { key: 'joiningDate', label: 'Joining Date', type: 'date' },
                { key: 'role', label: 'Role' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">{field.label}</label>
                  {isEditing ? (
                    <input type={field.type || 'text'} value={(profile as any)[field.key]}
                      onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-orange-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  ) : (
                    <div className="text-sm font-semibold text-slate-800 py-1.5 border-b border-slate-100">{(profile as any)[field.key]?.replace(/_/g, ' ') || '—'}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Notifications & Activity */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" /> Notifications
            </h2>
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className={`p-3 rounded-xl border text-xs ${n.read ? 'bg-slate-50 border-slate-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-start gap-2">
                    {n.read ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <Bell className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className={`font-semibold ${n.read ? 'text-slate-600' : 'text-slate-800'}`}>{n.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {n.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Activity Summary</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs py-2.5 border-b border-slate-100">
                <span className="text-slate-500">Reports Submitted</span>
                <span className="font-bold text-slate-800">Today</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2.5 border-b border-slate-100">
                <span className="text-slate-500">Last Login</span>
                <span className="font-bold text-slate-800">Just now</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2.5 border-b border-slate-100">
                <span className="text-slate-500">Account Status</span>
                <span className="font-bold text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2.5">
                <span className="text-slate-500">Member Since</span>
                <span className="font-bold text-slate-800">{profile.joiningDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
