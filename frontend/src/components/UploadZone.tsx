import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';

interface UploadZoneProps {
  onUploadSuccess: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndUpload = async (file: File) => {
    setMessage(null);
    const allowedExtensions = ['pdf', 'txt', 'md'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setMessage({
        text: 'Unsupported file type. Only PDF, TXT, and MD files are supported.',
        type: 'error',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({
        text: 'File size exceeds the 10MB limit.',
        type: 'error',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({
        text: response.data.message || 'File uploaded successfully!',
        type: 'success',
      });
      onUploadSuccess();
      // Auto clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('File upload failure:', error);
      setMessage({
        text: error.response?.data?.message || 'Failed to upload document.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all ${
          dragActive
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
        } ${loading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.md"
          onChange={handleChange}
        />

        <div className="p-4 bg-slate-950/60 rounded-full border border-slate-800 text-slate-400 group-hover:text-brand-400 mb-4 transition-colors">
          <UploadCloud className="w-8 h-8" />
        </div>

        <p className="text-sm font-semibold text-slate-200">
          Drag & drop your file here, or{' '}
          <button
            onClick={onButtonClick}
            type="button"
            className="text-brand-400 hover:text-brand-300 font-semibold underline cursor-pointer"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-slate-500 mt-1.5">Supports PDF, TXT, and Markdown (Max 10MB)</p>

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 rounded-2xl">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-300 font-medium mt-3">Uploading and parsing contents...</span>
          </div>
        )}
      </div>

      {/* Feedbacks */}
      {message && (
        <div
          className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span className="font-medium leading-relaxed">{message.text}</span>
        </div>
      )}
    </div>
  );
};
