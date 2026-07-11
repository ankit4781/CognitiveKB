import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Files, MessageSquare, HardDrive, Hash, ArrowRight, Clock, Plus, HelpCircle, Eye, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { DocPreviewModal } from '../components/DocPreviewModal';

interface StatsResponse {
  totalDocuments: number;
  totalQuestions: number;
  totalSize: number;
  totalWords: number;
  typeDistribution: {
    pdf: number;
    txt: number;
    md: number;
  };
  recentUploads: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadTimestamp: string;
    pageCount: number;
    wordCount: number;
  }>;
  recentConversations: Array<{
    id: string;
    question: string;
    timestamp: string;
    documentName: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err.response?.data?.message || 'Could not load statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document? All associated chat history will be orphaned.')) {
      return;
    }
    try {
      await api.delete(`/documents/${id}`);
      fetchStats();
    } catch (err) {
      console.error('Delete file error:', err);
      alert('Failed to delete document.');
    }
  };

  if (loading) {
    return (
      <div className="flex-grow p-8 overflow-y-auto space-y-8 bg-slate-950">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl shimmer"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-80 bg-slate-900 border border-slate-800 rounded-2xl shimmer"></div>
          <div className="h-80 bg-slate-900 border border-slate-800 rounded-2xl shimmer"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-grow flex items-center justify-center p-8 bg-slate-950">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center max-w-md">
          <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-200 mb-2">Error Loading Dashboard</h3>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-sm font-semibold rounded-xl text-white transition-all cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Calculate file breakdown percentages
  const totalFormats = stats.typeDistribution.pdf + stats.typeDistribution.txt + stats.typeDistribution.md || 1;
  const pdfPercent = Math.round((stats.typeDistribution.pdf / totalFormats) * 100);
  const txtPercent = Math.round((stats.typeDistribution.txt / totalFormats) * 100);
  const mdPercent = Math.round((stats.typeDistribution.md / totalFormats) * 100);

  return (
    <div className="flex-grow p-8 overflow-y-auto space-y-8 bg-slate-950">
      {/* Top Welcome Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Workspace Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review activity indices and manage uploaded files.</p>
        </div>
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-sm font-bold text-white rounded-xl shadow-lg shadow-brand-600/15 hover:shadow-brand-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Document
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Documents</span>
            <h3 className="text-3xl font-bold text-slate-100">{stats.totalDocuments}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Files className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Questions Asked</span>
            <h3 className="text-3xl font-bold text-slate-100">{stats.totalQuestions}</h3>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Storage Occupied</span>
            <h3 className="text-3xl font-bold text-slate-100">{formatSize(stats.totalSize)}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Analyzed Words</span>
            <h3 className="text-3xl font-bold text-slate-100">{stats.totalWords.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Hash className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Uploads Table */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-200">Recent Uploads</h3>
              <button
                onClick={() => navigate('/documents')}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
              >
                View Directory <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats.recentUploads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Files className="w-10 h-10 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">No documents found. Upload your first document to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-slate-800">
                      <th className="pb-3 font-semibold">Name</th>
                      <th className="pb-3 font-semibold">Format</th>
                      <th className="pb-3 font-semibold">Size</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {stats.recentUploads.map((file) => (
                      <tr key={file.id} className="text-slate-300 hover:bg-slate-800/10">
                        <td className="py-3 font-medium truncate max-w-[200px]">{file.name}</td>
                        <td className="py-3 text-xs uppercase text-slate-500">{file.type}</td>
                        <td className="py-3 text-xs text-slate-400">{formatSize(file.size)}</td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPreviewId(file.id)}
                              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Breakdown Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-200">Format Breakdown</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Breakdown of documents parsed inside the database by standard extensions.
            </p>

            <div className="space-y-4 pt-2">
              {/* PDF Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">PDF Files ({stats.typeDistribution.pdf})</span>
                  <span className="text-slate-300">{stats.totalDocuments ? pdfPercent : 0}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800/50">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${stats.totalDocuments ? pdfPercent : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* TXT Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">TXT Files ({stats.typeDistribution.txt})</span>
                  <span className="text-slate-300">{stats.totalDocuments ? txtPercent : 0}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800/50">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${stats.totalDocuments ? txtPercent : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* MD Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Markdown Files ({stats.typeDistribution.md})</span>
                  <span className="text-slate-300">{stats.totalDocuments ? mdPercent : 0}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800/50">
                  <div
                    className="bg-brand-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${stats.totalDocuments ? mdPercent : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom helper info */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2 text-[11px] text-slate-500 leading-normal">
            <Clock className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>Uploads automatically index and split word vectors for optimized AI queries.</span>
          </div>
        </div>
      </div>

      {/* Recent Chat Log activity list */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-200">Recent Conversation Activity</h3>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
          >
            Open Assistant <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageSquare className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">No questions asked yet. Start a chat inside the AI Assistant!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentConversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => navigate('/chat')}
                className="flex items-start justify-between p-4 bg-slate-900/30 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/60 rounded-xl transition-all cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-brand-400 px-2 py-0.5 bg-brand-500/10 rounded-md border border-brand-500/10">
                    {chat.documentName}
                  </span>
                  <p className="text-sm font-medium text-slate-200">{chat.question}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap pl-4">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(chat.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewId && <DocPreviewModal documentId={previewId} onClose={() => setPreviewId(null)} />}
    </div>
  );
};
