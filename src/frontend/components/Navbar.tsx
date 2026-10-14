import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  Layers,
  SlidersHorizontal,
  TrendingUp,
  CreditCard,
  User,
  Shield,
  Menu,
  X,
  Sparkles,
  Terminal,
  BookOpen,
  CheckCircle2,
  LogIn,
  Home,
  ChevronDown,
  Database,
} from 'lucide-react';
import { UserSession } from '../../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: UserSession;
  onSwitchRole: (role: 'guest' | 'user' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchRole,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const navLinks = [
    { id: 'landing', label: 'Beranda', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'fixtures', label: 'Jadwal', icon: Calendar },
    { id: 'predictions', label: 'Prediction Center', icon: SlidersHorizontal },
    { id: 'h2h', label: 'H2H', icon: Activity },
    { id: 'combo', label: 'Kombinasi (+EV)', icon: TrendingUp },
    { id: 'pricing', label: 'Pricing', icon: Sparkles },
  ];

  const devLinks = [
    { id: 'provider_sync', label: 'Sinkronisasi Provider', icon: Database },
    { id: 'architecture', label: 'Peta Arsitektur', icon: Layers },
    { id: 'explorer', label: 'API Gateway Tester', icon: Terminal },
    { id: 'roadmap', label: 'Roadmap & Risiko', icon: BookOpen },
    { id: 'testsuite', label: 'Verifikasi Tes (32/32)', icon: CheckCircle2 },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    setDevToolsOpen(false);
  };

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Identity */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleNavClick('landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Activity className="w-5 h-5 text-zinc-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-sans">
                  GoalMetric<span className="text-emerald-400">.AI</span>
                </span>
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  v1.0 SaaS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Probabilistic Football SaaS & Analytics
              </p>
            </div>
          </div>

          {/* Desktop Primary Nav Links */}
          <nav className="hidden xl:flex items-center space-x-1" aria-label="Navigasi Utama">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {/* Dev & Architecture Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDevToolsOpen(!devToolsOpen)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  devLinks.some(d => d.id === activeTab)
                    ? 'bg-zinc-800 text-sky-400 border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Arsitektur & Dev</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {devToolsOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-zinc-900 border border-zinc-700 p-2 shadow-2xl z-50 space-y-1">
                  {devLinks.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
                          activeTab === item.id
                            ? 'bg-zinc-800 text-emerald-400 font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Icons: Profile, Billing, Admin, Persona */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1 border-r border-zinc-800 pr-3">
              <button
                onClick={() => handleNavClick('profile')}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  activeTab === 'profile' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-white'
                }`}
                title="Profil Pengguna"
              >
                <User className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleNavClick('billing')}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  activeTab === 'billing' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-white'
                }`}
                title="Langganan & Billing"
              >
                <CreditCard className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleNavClick('admin')}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  activeTab === 'admin' ? 'bg-purple-900/60 text-purple-300' : 'text-zinc-400 hover:text-white'
                }`}
                title="Konsol Admin"
              >
                <Shield className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleNavClick('auth')}
                className={`p-2 rounded-lg text-xs transition-colors ${
                  activeTab === 'auth' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Login / Registrasi"
              >
                <LogIn className="w-4 h-4" />
              </button>
            </div>

            {/* Persona Switcher Quick Widget */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex items-center gap-1 text-[11px] font-mono">
              <button
                onClick={() => onSwitchRole('guest')}
                className={`px-2 py-0.5 rounded transition-all ${
                  currentUser?.userId === 'usr_guest_demo'
                    ? 'bg-zinc-700 text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Guest (Free Tier)"
              >
                Guest
              </button>
              <button
                onClick={() => onSwitchRole('user')}
                className={`px-2 py-0.5 rounded transition-all ${
                  currentUser?.subscriptionTier === 'pro'
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Analyst (Pro Tier)"
              >
                Pro
              </button>
              <button
                onClick={() => onSwitchRole('admin')}
                className={`px-2 py-0.5 rounded transition-all ${
                  currentUser?.role === 'admin'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Architect (Admin Tier)"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-zinc-900 space-y-2 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-zinc-800/80">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2 ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-900/80 text-zinc-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 px-1">
                Akun & Administrasi
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavClick('profile')}
                  className="p-2 rounded-xl bg-zinc-900 text-xs text-zinc-300 text-left flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profil</span>
                </button>
                <button
                  onClick={() => handleNavClick('billing')}
                  className="p-2 rounded-xl bg-zinc-900 text-xs text-zinc-300 text-left flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Billing</span>
                </button>
                <button
                  onClick={() => handleNavClick('admin')}
                  className="p-2 rounded-xl bg-purple-950/40 text-xs text-purple-300 text-left flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => handleNavClick('auth')}
                  className="p-2 rounded-xl bg-zinc-900 text-xs text-zinc-300 text-left flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login / Daftar</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 px-1">
                Alat Pengembang & Arsitektur
              </span>
              <div className="grid grid-cols-2 gap-2">
                {devLinks.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="p-2 rounded-xl bg-zinc-900/60 text-[11px] text-zinc-400 text-left truncate"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
