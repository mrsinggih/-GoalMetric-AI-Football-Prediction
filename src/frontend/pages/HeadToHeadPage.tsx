import React, { useState, useEffect } from 'react';
import { HeadToHeadRecord, MatchFixture } from '../../types';
import { fetchHeadToHead } from '../services/footballDataService';
import { BadgeDemo, LoadingState } from '../components/CommonStates';
import { Activity, ShieldCheck, Target, Calendar, ArrowRight } from 'lucide-react';

interface HeadToHeadPageProps {
  matches: MatchFixture[];
  initialHomeTeam?: string;
  initialAwayTeam?: string;
}

export const HeadToHeadPage: React.FC<HeadToHeadPageProps> = ({
  matches,
  initialHomeTeam,
  initialAwayTeam,
}) => {
  const [selectedHome, setSelectedHome] = useState(initialHomeTeam || matches[0]?.homeTeam.name || 'Arsenal [DEMO]');
  const [selectedAway, setSelectedAway] = useState(initialAwayTeam || matches[0]?.awayTeam.name || 'Manchester City [DEMO]');
  const [h2hData, setH2hData] = useState<HeadToHeadRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadH2h() {
      setLoading(true);
      try {
        const data = await fetchHeadToHead(selectedHome, selectedAway);
        setH2hData(data);
      } catch (err) {
        console.error('Error fetching H2H:', err);
      } finally {
        setLoading(false);
      }
    }
    loadH2h();
  }, [selectedHome, selectedAway]);

  return (
    <div className="space-y-6">
      {/* Header & Matchup Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">Analisis Head-to-Head (H2H)</h1>
              {matches[0]?.isDemo ? <BadgeDemo size="sm" /> : (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                  LIVE API-FOOTBALL
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {matches[0]?.isDemo
                ? 'Perbandingan historis, rekor pertemuan, rata-rata xG, dan tren gol antar kedua tim [DEMO DATA].'
                : 'Perbandingan historis, rekor pertemuan, rata-rata xG, dan tren gol antar kedua tim dari API-Football.'}
            </p>
          </div>

          {/* Quick Selector Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedHome}
              onChange={e => setSelectedHome(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
            >
              {matches.map(m => (
                <option key={m.id + '-h'} value={m.homeTeam.name}>
                  {m.homeTeam.name.replace(' [DEMO]', '')}
                </option>
              ))}
            </select>
            <span className="text-xs font-mono text-zinc-500">VS</span>
            <select
              value={selectedAway}
              onChange={e => setSelectedAway(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-sky-400 font-bold focus:outline-none focus:border-sky-500"
            >
              {matches.map(m => (
                <option key={m.id + '-a'} value={m.awayTeam.name}>
                  {m.awayTeam.name.replace(' [DEMO]', '')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading || !h2hData ? (
        <LoadingState message="Menghitung statistik komparasi Head-to-Head..." />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <span className="text-xs font-mono text-zinc-400 block mb-1">Total Pertemuan</span>
              <span className="text-2xl font-bold text-white font-mono">{h2hData.totalMatches} Laga</span>
              <span className="text-[10px] text-zinc-500 block mt-1">Kompetisi Resmi</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <span className="text-xs font-mono text-emerald-400 block mb-1">Kemenangan Home</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">{h2hData.homeWins}</span>
              <span className="text-[10px] text-zinc-500 block mt-1">{Math.round((h2hData.homeWins / h2hData.totalMatches) * 100)}% Win Rate</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <span className="text-xs font-mono text-amber-300 block mb-1">Hasil Imbang</span>
              <span className="text-2xl font-bold text-amber-300 font-mono">{h2hData.draws}</span>
              <span className="text-[10px] text-zinc-500 block mt-1">{Math.round((h2hData.draws / h2hData.totalMatches) * 100)}% Draw Rate</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
              <span className="text-xs font-mono text-sky-400 block mb-1">Kemenangan Away</span>
              <span className="text-2xl font-bold text-sky-400 font-mono">{h2hData.awayWins}</span>
              <span className="text-[10px] text-zinc-500 block mt-1">{Math.round((h2hData.awayWins / h2hData.totalMatches) * 100)}% Win Rate</span>
            </div>
          </div>

          {/* Goals & Market Trends */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-mono">Rata-rata Gol / Pertemuan</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">{h2hData.avgTotalGoals} Gol</div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-mono">Frekuensi Over 2.5</div>
                <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">{Math.round(h2hData.over25Rate * 100)}% Laga</div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-mono">Kedua Tim Cetak Gol (BTTS)</div>
                <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">{Math.round(h2hData.bttsRate * 100)}% Laga</div>
              </div>
            </div>
          </div>

          {/* Past Encounters Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Riwayat 5 Pertemuan Terakhir</h3>
              <BadgeDemo size="sm" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Kompetisi</th>
                    <th className="p-4 text-center">Skor Akhir</th>
                    <th className="p-4 text-center">Expected Goals (xG)</th>
                    <th className="p-4 text-right">Hasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {h2hData.pastEncounters.map(enc => (
                    <tr key={enc.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4 whitespace-nowrap text-zinc-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{enc.date}</span>
                      </td>
                      <td className="p-4 font-sans text-zinc-300">{enc.competition}</td>
                      <td className="p-4 text-center font-bold text-white text-sm">
                        {enc.homeScore} - {enc.awayScore}
                      </td>
                      <td className="p-4 text-center text-zinc-400 text-xs">
                        xG {enc.homeXg} - {enc.awayXg}
                      </td>
                      <td className="p-4 text-right">
                        {enc.homeScore > enc.awayScore ? (
                          <span className="text-emerald-400 font-bold">Home Win</span>
                        ) : enc.homeScore === enc.awayScore ? (
                          <span className="text-amber-400 font-bold">Draw</span>
                        ) : (
                          <span className="text-sky-400 font-bold">Away Win</span>
                        )}
                      </td>
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
