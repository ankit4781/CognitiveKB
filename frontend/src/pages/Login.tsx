import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin
        ? { email, password }
        : { username, email, password };

      const response = await axios.post(endpoint, payload);
      const { token, user } = response.data;
      
      login(token, user);
      navigate('/');
    } catch (err: any) {
      console.error('Auth failure:', err);
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>

      {/* Auth Card */}
      <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-2xl flex flex-col z-10 animate-fade-in">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-400 border border-brand-500/20 mb-3 shadow-lg">
            <Brain className="w-9 h-9 animate-pulse-subtle" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-brand-400 bg-clip-text text-transparent">
            CognitiveKB
          </h2>
          <p className="text-xs text-slate-500 mt-1">Your AI-Powered Knowledge Base</p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl mb-6 border border-slate-800/80">
          <button
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isLogin ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isLogin ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 pl-1">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="john_doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full custom-input pl-11 text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full custom-input pl-11 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full custom-input pl-11 text-sm"
              />
            </div>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs leading-relaxed animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-sm font-bold text-white rounded-xl shadow-lg shadow-brand-600/20 hover:shadow-brand-600/35 transition-all cursor-pointer"
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Footer */}
        <p className="text-[10px] text-slate-600 text-center mt-6 uppercase tracking-wider font-semibold">
          Secured with JWT & SHA-256 Hashing
        </p>
      </div>
    </div>
  );
};
