import React, { useState, useEffect } from 'react';
import { UserSession, AdminUserRow } from '../../types';
import { DEMO_ADMIN_USERS } from '../services/footballDataService';
import { apiClient } from '../services/apiClient';
import { BadgeDemo, LoadingState, ErrorState } from '../components/CommonStates';
import { Shield, ShieldAlert, Users, Server, Database, Activity, RefreshCw, Cpu, CheckCircle } from 'lucide-react';

interface AdminPageProps {
  currentUser?: UserSession;
  onElevateAdmin: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  onElevateAdmin,
}) => {
  const [users, setUsers] = useState<AdminUserRow[]>(DEMO_ADMIN_USERS);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [cacheFlushed, setCacheFlushed] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    async function loadStats() {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorMsg('');
      try {
        const stats = await apiClient.getAdminStats();
        setAdminStats(stats);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memuat statistik admin');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [isAdmin, currentUser]);

  const handleFlushCache = () => {
    setCacheFlushed(true);
    setTimeout(() => setCacheFlushed(false), 2500);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-zinc-900 border border-purple-800/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Akses Admin Dibatasi (RBAC Protected)</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Halaman ini dilindungi oleh middleware <code className="text-purple-300 font-mono">requireAdmin</code> di Express backend. Persona Anda saat ini adalah <strong className="text-white capitalize">{currentUser?.role || 'Guest'}</strong> ({currentUser?.subscriptionTier || 'Free'}).
          </p>
          <div className="pt-2">
            <button
              onClick={onElevateAdmin}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-purple-950/50 inline-flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Beralih ke Akun Technical Lead (Admin Persona)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Memvalidasi sesi RBAC dan mengambil telemetri platform..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Konsol Administrasi & Telemetri</h1>
            <span className="bg-purple-950 text-purple-300 border border-purple-700/60 font-mono text-[10px] px-2 py-0.5 rounded font-bold">
              SUPERADMIN RBAC
            </span>
            <BadgeDemo size="sm" />
          </div>
          <p className="text-xs text-zinc-400">
            Monitoring kesehatan node server, repositori cache prediksi, dan manajemen pengguna SaaS [DEMO DATA].
          </p>
        </div>

        <button
          onClick={handleFlushCache}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center gap-1.5 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cacheFlushed ? 'text-emerald-400 animate-spin' : ''}`} />
          <span>{cacheFlushed ? 'Cache Berhasil Dibersihkan!' : 'Bersihkan Cache Prediksi'}</span>
        </button>
      </div>

      {errorMsg ? (
        <ErrorState message={errorMsg} />
      ) : (
        <>
          {/* Telemetry Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-mono">Server Uptime</span>
                <div className="text-lg font-bold text-white font-mono">
                  {adminStats?.system?.serverUptimeSeconds || 120}s
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-mono">RAM Heap Usage</span>
                <div className="text-lg font-bold text-sky-400 font-mono">
                  {adminStats?.system?.memoryUsageMb || 34} MB
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-mono">Prediksi di Cache</span>
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  {adminStats?.dataAccess?.cachedPredictionsCount || 4} Fixture
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 font-mono">Total Pengguna</span>
                <div className="text-lg font-bold text-white font-mono">
                  {adminStats?.quotaTelemetry?.activeSubscribersCount || 142}
                </div>
              </div>
            </div>
          </div>

          {/* User Management Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Daftar Pengguna Platform (User Management)</span>
              </h3>
              <BadgeDemo size="sm" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                    <th className="p-4">Pengguna</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Tier Langganan</th>
                    <th className="p-4 text-center">Penggunaan Hari Ini</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Bergabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-zinc-500">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 uppercase font-bold text-emerald-400">{u.tier}</td>
                      <td className="p-4 text-center text-zinc-200">
                        {u.predictionsUsedToday} kuota
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-zinc-500">{u.joinedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
