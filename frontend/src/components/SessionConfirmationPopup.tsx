'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function SessionConfirmationPopup() {
  const { sessionConfirmation, loginWithForce, cancelSessionConfirmation } = useAuth();

  if (!sessionConfirmation) return null;

  const handleLoginHere = async () => {
    try {
      await loginWithForce(sessionConfirmation.identifier, sessionConfirmation.password);
    } catch (err: any) {
      alert(err.message || 'Login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-slate-200">
        {/* Warning Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Active Session Detected</h3>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          There is an active session on another device. Do you want to end it and login here?
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={cancelSessionConfirmation}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleLoginHere}
            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all"
          >
            Login Here
          </button>
        </div>
      </div>
    </div>
  );
}
