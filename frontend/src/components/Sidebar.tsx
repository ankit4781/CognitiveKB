import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Files, MessageSquare, LogOut, Brain, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'Documents', icon: Files },
    { to: '/chat', label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Brand Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400 border border-brand-500/20">
            <Brain className="w-6 h-6 animate-pulse-subtle" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-400 bg-clip-text text-transparent">
            CognitiveKB
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-400 border border-brand-500/25 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Section & Logout */}
      <div className="p-4 border-t border-slate-800 flex flex-col gap-4">
        {/* Profile Card */}
        {user && (
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-semibold text-lg uppercase shadow-inner">
              {user.username.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-200 truncate">{user.username}</span>
              <span className="text-xs text-slate-500 truncate">{user.email}</span>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          Logout
        </button>
      </div>
    </aside>
  );
};
