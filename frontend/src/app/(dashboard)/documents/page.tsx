'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { FolderOpen, UploadCloud, CheckCircle, FileText, Eye, Pencil, Trash2, X } from 'lucide-react';
import { ActionBar } from '@/components/ActionBar';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);

  const loadDocuments = async () => {
    try {
      const data = await apiRequest('/documents/my-documents');
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setDocuments([]);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUploadSimulated = async () => {
    try {
      const presigned = await apiRequest('/documents/presigned-url', {
        method: 'POST',
        body: JSON.stringify({ fileName: 'Educational_Degree.pdf', category: 'CERTIFICATE' }),
      });

      await apiRequest('/documents/record', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Educational Degree Certificate',
          category: 'CERTIFICATE',
          fileUrl: presigned.simulatedUrl,
        }),
      });

      alert('Document uploaded & presigned S3 URL generated!');
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  const handleDeleteDoc = (id: string) => {
    if (window.confirm('Delete this document?')) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const exportDocs = () => {
    const headers = ['ID', 'Title', 'Category', 'Verified', 'Size (KB)'];
    const rows = documents.map((d) => [d.id, d.title, d.category, d.isVerified ? 'Yes' : 'No', (d.fileSize / 1024).toFixed(0)]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `documents-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-2xl saffron-gradient text-white shadow-md">
        <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Document Vault &amp; S3 Storage
        </h1>
        <p className="text-[11px] text-orange-100 mt-0.5">
          Secure employee document management with AWS S3 signed URLs
        </p>
      </div>

      {/* Action Bar */}
      <ActionBar
        onRefresh={loadDocuments}
        onExport={exportDocs}
        onAdd={handleUploadSimulated}
        addLabel="Upload Document"
      />

      <div className="p-5 rounded-xl bg-white border border-slate-100 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Stored &amp; Verified Documents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documents.map((d) => (
            <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="font-bold text-slate-900">{d.title}</div>
                  <div className="text-[10px] text-slate-500">Category: {d.category} | {(d.fileSize / 1024).toFixed(0)} KB</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {d.isVerified && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                <button onClick={() => handleDeleteDoc(d.id)} title="Delete" className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
