import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Send, FileText, Sparkles, MessageSquare, Search, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

interface DocumentInfo {
  _id: string;
  name: string;
  type: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  documentName?: string;
  isDemoMode?: boolean;
}

interface HistoryItem {
  id: string;
  documentId: string | null;
  documentName: string;
  question: string;
  answer: string;
  timestamp: string;
}

// Custom Lightweight Markdown Renderer for clean parsing and absolute safety
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  let inList = false;
  const renderedElements: React.ReactNode[] = [];

  const parseInlineFormatting = (content: string) => {
    // Simple bold (**text**) & inline code (`code`) parser
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={index} className="px-1.5 py-0.5 bg-slate-950/80 text-brand-300 font-mono text-xs rounded border border-slate-800">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('### ')) {
      renderedElements.push(
        <h4 key={index} className="text-base font-bold text-slate-200 mt-4 mb-2 first:mt-0">
          {parseInlineFormatting(trimmed.substring(4))}
        </h4>
      );
      inList = false;
      return;
    }
    if (trimmed.startsWith('## ')) {
      renderedElements.push(
        <h3 key={index} className="text-lg font-bold text-brand-400 mt-5 mb-2.5 first:mt-0">
          {parseInlineFormatting(trimmed.substring(3))}
        </h3>
      );
      inList = false;
      return;
    }
    if (trimmed.startsWith('# ')) {
      renderedElements.push(
        <h2 key={index} className="text-xl font-black text-slate-100 mt-6 mb-3 first:mt-0">
          {parseInlineFormatting(trimmed.substring(2))}
        </h2>
      );
      inList = false;
      return;
    }

    // Horizontal Rule
    if (trimmed === '---') {
      renderedElements.push(<hr key={index} className="border-slate-800 my-4" />);
      inList = false;
      return;
    }

    // Unordered Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      renderedElements.push(
        <li key={index} className="ml-5 list-disc text-sm text-slate-300 leading-relaxed mb-1.5">
          {parseInlineFormatting(trimmed.substring(2))}
        </li>
      );
      inList = true;
      return;
    }

    // Empty Lines
    if (trimmed === '') {
      inList = false;
      return;
    }

    // Normal Paragraphs
    renderedElements.push(
      <p key={index} className="text-sm text-slate-300 leading-relaxed mb-3.5">
        {parseInlineFormatting(line)}
      </p>
    );
    inList = false;
  });

  return <div className="space-y-0.5 selection:bg-brand-500 selection:text-white">{renderedElements}</div>;
};

export const Chat: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const docsResponse = await api.get('/documents');
        setDocuments(docsResponse.data);
      } catch (err) {
        console.error('Failed to load document indices:', err);
      }
    };
    bootstrap();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await api.get('/history', {
        params: { search: historySearch || undefined },
      });
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [historySearch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: question.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await api.post('/ask', {
        documentId: selectedDocId || undefined,
        question: userMessage.text,
      });

      const { answer, isDemoMode, documentName } = response.data.conversation;
      const systemMessage: Message = {
        id: response.data.conversation.id,
        sender: 'assistant',
        text: answer,
        timestamp: new Date(response.data.conversation.timestamp),
        documentName,
        isDemoMode: response.data.isDemoMode,
      };

      setMessages((prev) => [...prev, systemMessage]);
      fetchHistory(); // Refresh history panel
    } catch (error: any) {
      console.error('Chat processing failure:', error);
      const errorMessage: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: `### ❌ Question Processing Error\n\n${error.response?.data?.message || 'Failed to generate answer. Please check backend connection.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const loadPastConversation = (item: HistoryItem) => {
    const historicalMessages: Message[] = [
      {
        id: `${item.id}-user`,
        sender: 'user',
        text: item.question,
        timestamp: new Date(item.timestamp),
      },
      {
        id: item.id,
        sender: 'assistant',
        text: item.answer,
        timestamp: new Date(item.timestamp),
        documentName: item.documentName,
      },
    ];
    setMessages(historicalMessages);
  };

  return (
    <div className="flex-grow h-full flex bg-slate-950 overflow-hidden">
      {/* Left Sidebar Pane: Previous Logs */}
      <div className="w-80 h-full border-r border-slate-800 bg-slate-900/30 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-200 text-sm mb-3">Conversation Logs</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search past chats..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full custom-input pl-9.5 text-xs py-1.5"
            />
          </div>
        </div>

        {/* History Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-900 border border-slate-800/80 rounded-xl shimmer"></div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4">
              <Clock className="w-8 h-8 text-slate-800 mb-2" />
              <p className="text-[11px] text-slate-500">No chat history matches search.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => loadPastConversation(item)}
                className="p-3 bg-slate-900/40 border border-slate-850 hover:border-slate-800 hover:bg-slate-900/85 rounded-xl cursor-pointer transition-all space-y-1.5 select-none"
              >
                <div className="flex justify-between items-center text-[9px] font-bold text-brand-400">
                  <span className="truncate max-w-[120px]">{item.documentName}</span>
                  <span className="text-slate-500">
                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-300 line-clamp-2 leading-relaxed">
                  {item.question}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        {/* Top Control Bar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/20 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400 animate-pulse-subtle" />
            <h2 className="font-bold text-slate-100 text-sm">AI Knowledge Assistant</h2>
          </div>

          {/* Context Selector */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="custom-input py-1 px-3 text-xs bg-slate-900 border-slate-850 cursor-pointer max-w-[180px] sm:max-w-xs"
            >
              <option value="">Query Library (All Documents)</option>
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {documents.length === 0 ? (
            <div className="h-full flex items-center justify-center p-6 text-center">
              <div className="glass-panel p-8 rounded-2xl border border-slate-850 max-w-sm space-y-4">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Knowledge Base Available</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  You need to upload at least one document to start questioning the AI model.
                </p>
                <button
                  onClick={() => navigate('/documents')}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer"
                >
                  Upload Files
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-2xl text-brand-400">
                <MessageSquare className="w-8 h-8 animate-pulse-subtle" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Start Cognitive Query</h3>
              <p className="text-xs text-slate-500 max-w-xs leading-normal">
                Choose a document from the context selector or search your entire repository, and ask a question.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Context Badge */}
                  {msg.sender === 'assistant' && msg.documentName && (
                    <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wider mb-1.5 px-2 py-0.5 bg-brand-500/10 rounded-md border border-brand-500/10">
                      Context: {msg.documentName}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 text-slate-200 border ${
                      msg.sender === 'user'
                        ? 'bg-brand-600/15 border-brand-500/25 rounded-tr-none text-right'
                        : 'bg-slate-900/55 border-slate-850 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <MarkdownRenderer text={msg.text} />
                    )}
                  </div>

                  {/* Timestamp / Demo Indicators */}
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[10px] text-slate-600">
                      {new Date(msg.timestamp).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.isDemoMode && (
                      <span className="text-[9px] font-bold text-amber-500 uppercase px-1.5 bg-amber-500/5 rounded border border-amber-500/10">
                        Demo Mode
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex flex-col items-start">
                  <div className="bg-slate-900/55 border border-slate-850 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        {documents.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/10 shrink-0">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading}
                placeholder={
                  selectedDocId
                    ? "Ask a question about the selected document..."
                    : "Ask a question across all documents..."
                }
                className="flex-1 custom-input py-3.5 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-md shadow-brand-600/10"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
