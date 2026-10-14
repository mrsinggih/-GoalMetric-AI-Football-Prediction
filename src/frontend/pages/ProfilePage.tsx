import React, { useState } from 'react';
import { UserSession } from '../../types';
import { BadgeDemo } from '../components/CommonStates';
import { User, Key, Bell, Shield, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';

interface ProfilePageProps {
  currentUser?: UserSession;
  onNavigateBilling: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onNavigateBilling,
}) => {
  const [apiKey, setApiKey] = useState(
    currentUser?.subscriptionTier === 'elite'
      ? 'gm_live_99a8b7c6d5e4f3a2b1c0'
      : 'Tersedia pada paket Elite Syndicate'
  );
  const [copied, setCopied] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [telegramAlerts, setTelegramAlerts] = useState(false);

  const handleCopy = () => {
    if (currentUser?.subscriptionTier === 'elite') {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-inner">
            {currentUser?.email ? currentUser.email[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {currentUser?.email?.split('@')[0] || 'User Profile'}
              </h1>
              <BadgeDemo size="sm" />
            </div>
            <p className="text-xs text-zinc-400 font-mono">{currentUser?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300">
            Role: <strong className="text-emerald-400 capitalize">{currentUser?.role}</strong>
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 font-mono text-xs text-emerald-300 uppercase font-bold">
            Tier: {currentUser?.subscriptionTier}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Quota & Plan Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Status Langganan & Kuota</span>
          </h2>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Paket Langganan:</span>
              <span className="font-bold text-white uppercase">{currentUser?.subscriptionTier}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Prediksi Tersisa Hari Ini:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {currentUser?.predictionsRemainingToday} Kuota
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Status Akun:</span>
              <span className="text-emerald-400 font-bold">AKTIF</span>
            </div>
          </div>

          <button
            onClick={onNavigateBilling}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Kelola Paket di Halaman Billing</span>
          </button>
        </div>

        {/* API Key Management */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            <span>Kunci REST API Pengembang</span>
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Gunakan API key ini untuk mengakses endpoint prediksi kuantitatif langsung dari aplikasi atau modul Python Anda.
          </p>

          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between font-mono text-xs">
            <span className="truncate text-zinc-300 pr-2">{apiKey}</span>
            <button
              onClick={handleCopy}
              disabled={currentUser?.subscriptionTier !== 'elite'}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors disabled:opacity-30"
              title="Salin API Key"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {currentUser?.subscriptionTier !== 'elite' && (
            <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl text-[11px] text-purple-300 flex items-center justify-between">
              <span>Tingkatkan ke Elite untuk membuka akses REST API langsung.</span>
              <button
                onClick={onNavigateBilling}
                className="font-bold underline ml-2 hover:text-white"
              >
                Upgrade
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Pengaturan Notifikasi & Notifikasi +EV</span>
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer">
            <div>
              <div className="font-semibold text-white">Notifikasi Sinyal Value Bet (+EV) Harian</div>
              <div className="text-zinc-500 text-[11px]">Kirimkan email harian saat model mendeteksi peluang edge &gt; 5%.</div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={e => setEmailAlerts(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 cursor-pointer">
            <div>
              <div className="font-semibold text-white">Webhook / Telegram Bot Feed</div>
              <div className="text-zinc-500 text-[11px]">Integrasi bot otomatis untuk sindikat kuantitatif.</div>
            </div>
            <input
              type="checkbox"
              checked={telegramAlerts}
              onChange={e => setTelegramAlerts(e.target.checked)}
              className="accent-emerald-500 w-4 h-4 rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
