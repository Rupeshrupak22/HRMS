'use client';

import React from 'react';
import { Upload, CheckCircle2, XCircle } from 'lucide-react';

interface UploadProgressModalProps {
  isOpen: boolean;
  progress: number; // 0 to 100
  status: 'uploading' | 'success' | 'error';
  title?: string;
  message?: string;
  onClose?: () => void;
}

export default function UploadProgressModal({
  isOpen,
  progress,
  status,
  title = 'Uploading...',
  message,
  onClose,
}: UploadProgressModalProps) {
  if (!isOpen) return null;

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8 flex flex-col items-center gap-5 border border-slate-100">
        {/* Circular Progress */}
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="10"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={status === 'error' ? '#ef4444' : status === 'success' ? '#22c55e' : '#f97316'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - clampedProgress / 100)}`}
              className="transition-all duration-500 ease-out"
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {status === 'uploading' && (
              <>
                <span className="text-2xl font-black text-slate-800">{Math.round(clampedProgress)}%</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Uploading</span>
              </>
            )}
            {status === 'success' && (
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-12 h-12 text-red-500" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-800">
            {status === 'success' ? 'Upload Complete!' : status === 'error' ? 'Upload Failed' : title}
          </h3>
          {message && (
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              status === 'error' ? 'bg-red-500' : status === 'success' ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-orange-600'
            }`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        {/* Close button (only shown on success/error) */}
        {(status === 'success' || status === 'error') && onClose && (
          <button
            onClick={onClose}
            className="mt-2 px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
