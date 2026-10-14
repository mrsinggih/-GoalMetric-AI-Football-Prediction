import React, { useState } from 'react';
import { BadgeDemo } from '../components/CommonStates';
import { Lock, Mail, User, Shield, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onLoginSuccess: (role: 'guest' | 'user' | 'admin') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Harap lengkapi email dan kata sandi.');
      return;
    }

    if (mode === 'register' && !agreeTerms) {
      setErrorMsg('Anda harus menyetujui syarat & ketentuan layanan simulasi.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      // Log in as standard pro user
      onLoginSuccess('user');
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
          <Lock className="w-6 h-6 text-zinc-950 font-bold" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          {mode === 'login' ? 'Masuk ke GoalMetric AI' : 'Buat Akun Baru'}
        </h1>
        <p className="text-xs text-zinc-400">
          Akses analitik probabilistik, mesin Dixon-Coles Poisson, dan sinyal +EV.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Toggle Mode */}
        <div className="flex p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Daftar (Register)
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-600/40 rounded-xl text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-zinc-400 font-medium mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Nama Anda"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="analyst@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-0.5 accent-emerald-500 rounded"
              />
              <label htmlFor="terms" className="text-[11px] text-zinc-400 leading-tight">
                Saya menyetujui bahwa analitik ini merupakan simulasi matematis demo dan bukan saran perjudian finansial.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Masuk ke Dashboard' : 'Buat Akun & Masuk'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Persona Switcher (Convenient testing for beginners) */}
        <div className="pt-4 border-t border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-mono">Uji Coba Langsung Persona Cepat:</span>
            <BadgeDemo size="sm" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onLoginSuccess('guest')}
              className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-center transition-colors"
            >
              <div className="font-bold text-zinc-300 text-xs">Guest</div>
              <div className="text-[10px] text-zinc-500">Tier Gratis</div>
            </button>

            <button
              onClick={() => onLoginSuccess('user')}
              className="p-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/60 text-center transition-colors"
            >
              <div className="font-bold text-sky-400 text-xs">Analyst</div>
              <div className="text-[10px] text-sky-300/70">Tier Pro</div>
            </button>

            <button
              onClick={() => onLoginSuccess('admin')}
              className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 text-center transition-colors"
            >
              <div className="font-bold text-purple-400 text-xs">Architect</div>
              <div className="text-[10px] text-purple-300/70">Tier Admin</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
