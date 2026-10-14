import React, { useState } from 'react';
import { Terminal, Play, Send, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface EndpointOption {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  requiresAdmin?: boolean;
}

export const ApiExplorerView: React.FC = () => {
  const endpoints: EndpointOption[] = [
    {
      name: 'System Health & Engine Status',
      method: 'GET',
      path: '/api/v1/health',
      description: 'Memeriksa status gateway backend, status koneksi database Supabase, dan microservice Python.',
    },
    {
      name: 'Ambil Jadwal Pertandingan [DEMO]',
      method: 'GET',
      path: '/api/v1/matches',
      description: 'Mengambil daftar fixture sepak bola yang disertai statistik kekuatan serang/bertahan dan label demo.',
    },
    {
      name: 'Prediksi Dixon-Coles Fixture 001',
      method: 'GET',
      path: '/api/v1/predictions/match/demo-match-001',
      description: 'Menghitung Expected Goals (xG), probabilitas 1X2, Over/Under, dan deteksi Value Bet (+EV) untuk Arsenal vs Man City.',
    },
    {
      name: 'Paket Langganan SaaS (Pricing Tiers)',
      method: 'GET',
      path: '/api/v1/billing/plans',
      description: 'Melihat paket Starter (Free), Pro Analyst, dan Elite Syndicate beserta kuota penggunaan harian.',
    },
    {
      name: 'Profil Sesi Autentikasi Pengguna',
      method: 'GET',
      path: '/api/v1/auth/me',
      description: 'Memeriksa token bearer yang sedang aktif dan kuota prediksi harian yang tersisa.',
    },
    {
      name: 'Admin Telemetry & Audit Status',
      method: 'GET',
      path: '/api/v1/admin/stats',
      description: 'Endpoint terlindungi RBAC. Hanya dapat diakses bila persona aktif disetel ke Admin (Elite).',
      requiresAdmin: true,
    },
  ];

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointOption>(endpoints[0]);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const handleExecute = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    const start = performance.now();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = apiClient.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(selectedEndpoint.path, {
        method: selectedEndpoint.method,
        headers,
      });

      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setResponseStatus(res.status);

      const data = await res.json();
      setResponseData(data);
    } catch (err: any) {
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setResponseStatus(500);
      setResponseData({ error: 'Network Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              API Gateway Console & Route Tester
              <span className="text-[10px] font-mono text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded">
                REST v1
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Uji respons real-time dari backend Express. Perhatikan bagaimana route <code className="text-sky-300">/admin/stats</code> menolak akses jika persona saat ini bukan Admin.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoints Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Pilih Endpoint untuk Diuji:
          </h3>

          {endpoints.map((ep, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedEndpoint(ep)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                selectedEndpoint.path === ep.path
                  ? 'bg-zinc-800 border-sky-500/60 text-white shadow-md'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {ep.method}
                  </span>
                  <span className="text-xs font-mono font-semibold text-zinc-200">
                    {ep.path}
                  </span>
                </div>
                {ep.requiresAdmin && (
                  <span className="bg-purple-900/60 text-purple-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-purple-700/50 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> RBAC Admin
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{ep.description}</p>
            </button>
          ))}

          {/* Action Trigger */}
          <button
            onClick={handleExecute}
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-sky-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Mengirim HTTP Request...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim {selectedEndpoint.method} {selectedEndpoint.path}</span>
              </>
            )}
          </button>
        </div>

        {/* Response Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col min-h-[460px]">
            {/* Console Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs font-mono mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-zinc-400 ml-2">Output Respons HTTP</span>
              </div>

              {responseStatus !== null && (
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : responseStatus === 403 || responseStatus === 401
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    STATUS {responseStatus}
                  </span>
                  {latencyMs !== null && (
                    <span className="text-zinc-500">{latencyMs} ms</span>
                  )}
                </div>
              )}
            </div>

            {/* Payload Display */}
            {responseData ? (
              <pre className="flex-1 bg-zinc-900/90 text-emerald-300 font-mono text-xs p-4 rounded-xl overflow-x-auto border border-zinc-800/80 leading-relaxed">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                <Terminal className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs">
                  Pilih endpoint di sebelah kiri lalu klik tombol kirim untuk melihat respons JSON live dari backend.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
