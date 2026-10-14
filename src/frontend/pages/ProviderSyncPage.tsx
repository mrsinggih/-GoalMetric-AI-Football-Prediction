import React, { useState, useEffect } from 'react';
import { BadgeDemo, LoadingState } from '../components/CommonStates';
import { Database, RefreshCw, ShieldCheck, Key, AlertTriangle, CheckCircle2, Clock, Server, ArrowRight } from 'lucide-react';

export const ProviderSyncPage: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>('39');
  const [selectedSeason, setSelectedSeason] = useState<string>('2025');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/sync/status');
      const data = await res.json();
      setSyncStatus(data);
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await fetch('/api/v1/sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: selectedLeague,
          season: selectedSeason,
        }),
      });
      const data = await res.json();
      setSyncResult(data.result);
      await fetchStatus();
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: `Koneksi gagal: ${err.message}`,
        isDemoFallback: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !syncStatus) {
    return <LoadingState message="Memeriksa status koneksi data provider sepak bola..." />;
  }

  const isConfigured = Boolean(syncStatus?.data?.isConfigured);
  const metrics = syncStatus?.data?.rateLimitMetrics;
  const logs = syncStatus?.data?.latestLogs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Integrasi Provider & Sinkronisasi Data</h1>
            <BadgeDemo size="sm" />
          </div>
          <p className="text-xs text-zinc-400">
            Adapter resmi API-Football (v3.football.api-sports.io) dengan normalisasi data, rate-limiting, deduplikasi, dan isolasi secret server-side.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center gap-1.5 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Segarkan Status</span>
        </button>
      </div>

      {/* Provider Connectivity Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Connection Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Status Koneksi Provider</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isConfigured ? 'TERHUBUNG (LIVE)' : 'BELUM TERHUBUNG'}
            </span>
          </div>

          <div className="font-bold text-base text-white">
            {syncStatus?.data?.providerName || 'API-Football v3'}
          </div>

          <p className="text-xs text-zinc-400">
            {isConfigured
              ? 'API key terdeteksi di server environment. Sinkronisasi data live aktif.'
              : 'Kunci belum dikonfigurasi. Sistem secara transparan menggunakan dataset [DEMO DATA] tanpa memalsukan data aktual.'}
          </p>
        </div>

        {/* Rate Limiting Token Bucket */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Rate Limiting (Sliding Window)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="font-mono text-2xl font-bold text-white">
            {metrics?.requestsInLastMinute || 0} / {metrics?.maxPerMinute || 10}{' '}
            <span className="text-xs text-zinc-500 font-normal">req/menit</span>
          </div>

          <div className="text-xs text-zinc-400 flex justify-between">
            <span>Total Panggilan Hari Ini:</span>
            <span className="font-mono font-bold text-emerald-400">
              {metrics?.totalRequestsToday || 0} request
            </span>
          </div>
        </div>

        {/* In-Memory Deduplicated Fixtures */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Deduplikasi & Cache</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>

          <div className="font-mono text-2xl font-bold text-sky-400">
            {syncStatus?.data?.totalDeduplicatedFixtures || 0}{' '}
            <span className="text-xs text-zinc-500 font-normal">jadwal ter-indeks</span>
          </div>

          <div className="text-xs text-zinc-400 flex justify-between">
            <span>Entry Cache Memori:</span>
            <span className="font-mono font-bold text-zinc-200">
              {syncStatus?.data?.cacheStats?.size || 0} objek
            </span>
          </div>
        </div>
      </div>

      {/* Guide: How to securely configure the API key via Secrets without code leaks */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">
            Panduan Aman Mengisi Kunci API via Panel Secrets (Anti-Bocor)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
            <span className="font-mono text-emerald-400 font-bold text-[11px] block">
              1. Buka Pengaturan Secrets
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Di panel interface AI Studio, klik menu <strong>Secrets</strong> di bilah navigasi.
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
            <span className="font-mono text-emerald-400 font-bold text-[11px] block">
              2. Tambahkan Variabel
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Beri nama secret persis <code className="text-emerald-300 font-mono">FOOTBALL_DATA_API_KEY</code> dan masukkan kunci langganan API-Football Anda.
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1.5">
            <span className="font-mono text-emerald-400 font-bold text-[11px] block">
              3. Jangan Tulis Kunci di Chat
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Sistem akan membaca kunci dari <code className="text-zinc-300 font-mono">process.env</code> server-side tanpa pernah membocorkannya ke bundle browser.
            </p>
          </div>
        </div>
      </div>

      {/* Trigger Sync Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-400" />
          <span>Jalankan Sinkronisasi Terkontrol (On-Demand Sync)</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-auto flex-1">
            <label className="block text-zinc-400 text-xs mb-1">Pilih Liga</label>
            <select
              value={selectedLeague}
              onChange={e => setSelectedLeague(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="39">Premier League (ID: 39)</option>
              <option value="140">La Liga Spanyol (ID: 140)</option>
              <option value="135">Serie A Italia (ID: 135)</option>
              <option value="78">Bundesliga Jerman (ID: 78)</option>
            </select>
          </div>

          <div className="w-full sm:w-36">
            <label className="block text-zinc-400 text-xs mb-1">Musim (Season)</label>
            <input
              type="text"
              value={selectedSeason}
              onChange={e => setSelectedSeason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="w-full sm:w-auto self-end pt-5 sm:pt-0">
            <button
              onClick={handleRunSync}
              disabled={syncing}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {syncing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Sinkronisasi Sedang Berjalan...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Jalankan Sinkronisasi Liga</span>
                </>
              )}
            </button>
          </div>
        </div>

        {syncResult && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed ${
              syncResult.success
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-600/40 text-amber-200'
            }`}
          >
            <div className="font-bold mb-1 flex items-center gap-1.5">
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>Hasil Eksekusi Sinkronisasi:</span>
            </div>
            <p className="text-zinc-300">{syncResult.message}</p>
          </div>
        )}
      </div>

      {/* Sync Audit Logs Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-bold text-white">Log Audit Sinkronisasi Provider</h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">{logs.length} riwayat</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
            Belum ada aktivitas sinkronisasi yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                  <th className="p-4">Waktu</th>
                  <th className="p-4">Endpoint</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Item</th>
                  <th className="p-4 text-center">Latensi</th>
                  <th className="p-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 whitespace-nowrap text-zinc-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-4 text-white font-semibold">{log.endpoint}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : log.status === 'CACHED'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : log.status === 'RATE_LIMITED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : log.status === 'STALE_FALLBACK'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-center text-zinc-300">{log.itemsCount}</td>
                    <td className="p-4 text-center text-zinc-400">{log.latencyMs} ms</td>
                    <td className="p-4 text-zinc-400 max-w-xs truncate font-sans text-[11px]">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
