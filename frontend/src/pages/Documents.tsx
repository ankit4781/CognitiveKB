import React, { useState, useEffect } from 'react';
import { UploadZone } from '../components/UploadZone';
import { Search, Filter, Trash2, Eye, FileText, Calendar, HardDrive, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { DocPreviewModal } from '../components/DocPreviewModal';

interface DocumentInfo {
  _id: string;
  name: string;
  type: string;
  size: number;
  uploadTimestamp: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
  };
}

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents', {
        params: {
          search: search || undefined,
          type: filterType || undefined
        }
      });
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to retrieve documents list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, filterType]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document? This action is permanent and will remove all contextual memory.')) {
      return;
    }
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-grow p-8 overflow-y-auto bg-slate-950 space-y-8">
      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Document Repository
        </h1>
        <p className="text-slate-400 text-sm mt-1">Upload and manage files to build your assistant's knowledge base.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-200">Upload Knowledge</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add new documents. Once uploaded, documents are parsed and made available instantly for AI question answering.
            </p>
            <UploadZone onUploadSuccess={fetchDocuments} />
          </div>
        </div>

        {/* Directory List Column */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search documents by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full custom-input pl-10 text-sm py-2"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative shrink-0">
              <Filter className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="custom-input pl-10 pr-8 text-sm py-2 appearance-none bg-slate-900 border-slate-800 cursor-pointer"
              >
                <option value="">All Formats</option>
                <option value="pdf">PDF files</option>
                <option value="txt">TXT files</option>
                <option value="md">Markdown (MD)</option>
              </select>
            </div>
          </div>

          {/* Table / Grid list */}
          <div className="glass-panel rounded-2xl flex-1 overflow-hidden flex flex-col min-h-[400px]">
            {loading ? (
              <div className="flex-1 p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-900 border border-slate-800/80 rounded-xl shimmer"></div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                <FileText className="w-12 h-12 text-slate-700 mb-3" />
                <h4 className="text-sm font-bold text-slate-400">No Documents Found</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  {search || filterType
                    ? 'No documents match your query filters. Try adjusting them.'
                    : 'Get started by dragging files into the upload box on the left!'}
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-grow max-h-[60vh]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-slate-800 bg-slate-950/20 sticky top-0 backdrop-blur-md">
                      <th className="p-4 font-semibold">Name</th>
                      <th className="p-4 font-semibold">Size</th>
                      <th className="p-4 font-semibold">Indexed On</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {documents.map((doc) => (
                      <tr key={doc._id} className="text-slate-300 hover:bg-slate-800/10">
                        <td className="p-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-slate-950/80 border border-slate-800 text-brand-400 rounded-lg">
                              <span className="text-[10px] font-bold uppercase">{doc.type}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-200 truncate max-w-[240px]" title={doc.name}>
                                {doc.name}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                {doc.metadata?.wordCount !== undefined && (
                                  <span>{doc.metadata.wordCount.toLocaleString()} words</span>
                                )}
                                {doc.metadata?.pageCount !== undefined && doc.type === 'pdf' && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                    <span>{doc.metadata.pageCount} pages</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-slate-400 font-mono">{formatSize(doc.size)}</td>
                        <td className="p-4 text-xs text-slate-400">
                          {new Date(doc.uploadTimestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPreviewId(doc._id)}
                              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                              title="Preview Extracted Content"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc._id)}
                              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewId && <DocPreviewModal documentId={previewId} onClose={() => setPreviewId(null)} />}
    </div>
  );
};
