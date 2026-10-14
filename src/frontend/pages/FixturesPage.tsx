import React, { useState } from 'react';
import { MatchFixture, PredictionResult } from '../../types';
import { BadgeDemo, EmptyState, LoadingState } from '../components/CommonStates';
import { Search, Filter, Calendar, ChevronRight, TrendingUp, Shield, Target } from 'lucide-react';

interface FixturesPageProps {
  matches: MatchFixture[];
  predictions: Record<string, PredictionResult>;
  loading: boolean;
  onSelectMatch: (match: MatchFixture) => void;
}

export const FixturesPage: React.FC<FixturesPageProps> = ({
  matches,
  predictions,
  loading,
  onSelectMatch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const leagues = ['ALL', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga'];

  if (loading) {
    return <LoadingState message="Memuat daftar jadwal pertandingan & odds pasar..." />;
  }

  const filteredMatches = matches.filter(m => {
    const matchesSearch =
      m.homeTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.awayTeam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === 'ALL' || m.league.includes(selectedLeague);
    const matchesStatus = selectedStatus === 'ALL' || m.status === selectedStatus;
    return matchesSearch && matchesLeague && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Jadwal Pertandingan (Fixtures)</h1>
            {matches[0]?.isDemo ? <BadgeDemo size="sm" /> : (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                LIVE API-FOOTBALL
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            {matches[0]?.isDemo
              ? 'Daftar lengkap jadwal liga utama dengan metrik kekuatan serang, bertahan, dan odds pasar [DEMO DATA].'
              : 'Daftar lengkap jadwal liga utama yang disinkronkan secara real-time dari API-Football.'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari tim (e.g. Arsenal, Madrid)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* League and Status Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
          <select
            value={selectedLeague}
            onChange={e => setSelectedLeague(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            {leagues.map(l => (
              <option key={l} value={l}>
                {l === 'ALL' ? 'Semua Liga' : l}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="SCHEDULED">Terjadwal</option>
            <option value="LIVE">Sedang Berlangsung</option>
            <option value="FINISHED">Selesai</option>
          </select>
        </div>
      </div>

      {/* Fixtures Table / List */}
      {filteredMatches.length === 0 ? (
        <EmptyState
          title="Tidak Ada Jadwal yang Cocok"
          description="Coba ubah kata kunci pencarian atau reset filter liga untuk menemukan jadwal pertandingan lain."
          actionText="Reset Filter"
          onAction={() => {
            setSearchTerm('');
            setSelectedLeague('ALL');
            setSelectedStatus('ALL');
          }}
        />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="p-4">Tanggal & Liga</th>
                  <th className="p-4">Pertandingan (Home vs Away)</th>
                  <th className="p-4 text-center">Odds Pasar (1 - X - 2)</th>
                  <th className="p-4 text-center">Peluang Model Poisson</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {filteredMatches.map(match => {
                  const pred = predictions[match.id];
                  const hasEv = pred?.valueBets?.some(b => b.hasValue);

                  return (
                    <tr
                      key={match.id}
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectMatch(match)}
                    >
                      {/* Date & League */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-xs">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {new Date(match.kickoffTime).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1 font-mono">
                          <span>{match.league}</span>
                          <BadgeDemo size="sm" />
                        </div>
                      </td>

                      {/* Teams & xG */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="space-y-1 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                              <span>{match.homeTeam.name.replace(' [DEMO]', '')}</span>
                              <span className="text-[10px] text-zinc-400 font-mono font-normal">
                                (xG: {match.homeTeam.expectedGoalsFor})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                              <span>{match.awayTeam.name.replace(' [DEMO]', '')}</span>
                              <span className="text-[10px] text-zinc-400 font-mono font-normal">
                                (xG: {match.awayTeam.expectedGoalsFor})
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Odds */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {match.odds ? (
                          <div className="inline-flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 font-mono text-xs">
                            <span className="text-emerald-400 font-bold">{match.odds.homeWin}</span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-amber-300 font-bold">{match.odds.draw}</span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-sky-400 font-bold">{match.odds.awayWin}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-500 font-mono">-</span>
                        )}
                      </td>

                      {/* Model Probabilities */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {pred ? (
                          <div className="inline-flex flex-col items-center">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold">
                              <span className="text-emerald-400">
                                {Math.round(pred.probabilities.homeWin * 100)}%
                              </span>
                              <span className="text-zinc-500">-</span>
                              <span className="text-amber-300">
                                {Math.round(pred.probabilities.draw * 100)}%
                              </span>
                              <span className="text-zinc-500">-</span>
                              <span className="text-sky-400">
                                {Math.round(pred.probabilities.awayWin * 100)}%
                              </span>
                            </div>
                            {hasEv && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-emerald-400 mt-1 font-bold">
                                <TrendingUp className="w-3 h-3" /> +EV Ditemukan
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-500 font-mono">Menghitung...</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMatch(match);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 hover:text-zinc-950 text-zinc-300 font-semibold transition-all inline-flex items-center gap-1 group-hover:bg-emerald-500 group-hover:text-zinc-950"
                        >
                          <span>Detail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
