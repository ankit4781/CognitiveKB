import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Sparkles } from 'lucide-react';
import api from '../utils/api';

interface DocPreviewModalProps {
  documentId: string;
  onClose: () => void;
}

interface DocumentDetail {
  id: string;
  name: string;
  type: string;
  textContent: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
  };
}

export const DocPreviewModal: React.FC<DocPreviewModalProps> = ({ documentId, onClose }) => {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/documents/${documentId}`);
        setDoc(response.data);
      } catch (err: any) {
        console.error('Failed to preview document:', err);
        setError(err.response?.data?.message || 'Could not load document preview.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocDetail();
  }, [documentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-100 truncate pr-4">
              {loading ? 'Loading preview...' : doc?.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
          {loading && (
            <div className="space-y-4">
              <div className="h-4 bg-slate-800 rounded-md w-3/4 shimmer"></div>
              <div className="h-4 bg-slate-800 rounded-md w-full shimmer"></div>
              <div className="h-4 bg-slate-800 rounded-md w-5/6 shimmer"></div>
              <div className="h-4 bg-slate-800 rounded-md w-2/3 shimmer"></div>
              <div className="h-4 bg-slate-800 rounded-md w-4/5 shimmer"></div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-rose-400 gap-3">
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          {!loading && !error && doc && (
            <div className="space-y-6">
              {/* Metadata Badges */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 text-xs text-slate-400 rounded-lg">
                  <span className="font-bold uppercase text-brand-400">{doc.type}</span> Format
                </div>
                {doc.metadata?.pageCount !== undefined && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 text-xs text-slate-400 rounded-lg">
                    <span className="font-semibold text-slate-200">{doc.metadata.pageCount}</span> Pages
                  </div>
                )}
                {doc.metadata?.wordCount !== undefined && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800 text-xs text-slate-400 rounded-lg">
                    <span className="font-semibold text-slate-200">{doc.metadata.wordCount.toLocaleString()}</span> Words
                  </div>
                )}
              </div>

              {/* Text Preview */}
              <div className="p-5 bg-slate-950/30 border border-slate-800/80 rounded-xl max-h-[50vh] overflow-y-auto">
                <pre className="text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap select-text selection:bg-brand-500 selection:text-white">
                  {doc.textContent}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 flex items-center justify-between px-6 border-t border-slate-800 bg-slate-950/20 shrink-0">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse-subtle" />
            Content fully indexed for AI-Powered query lookup
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-all cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
