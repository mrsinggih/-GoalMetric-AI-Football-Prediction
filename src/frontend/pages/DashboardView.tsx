import React, { useState } from 'react';
import { MatchFixture, PredictionResult } from '../../types';
import { MatchCard } from '../components/MatchCard';
import { ScoreMatrixModal } from '../components/ScoreMatrixModal';
import { Activity, TrendingUp, ShieldAlert, Cpu, Sparkles, Filter } from 'lucide-react';

interface DashboardViewProps {
  matches: MatchFixture[];
  predictions: Record<string, PredictionResult>;
  loading: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  matches,
  predictions,
  loading,
}) => {
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [activeModalMatch, setActiveModalMatch] = useState<MatchFixture | null>(null);
  const [activeModalPrediction, setActiveModalPrediction] = useState<PredictionResult | null>(null);

  const leagues = ['ALL', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga'];

  const filteredMatches = selectedLeague === 'ALL'
    ? matches
    : matches.filter(m => m.league.includes(selectedLeague));

  const totalValueBets = Object.values(predictions).reduce(
    (acc, p) => acc + (p.valueBets?.filter(v => v.hasValue).length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{matches.length}</div>
            <div className="text-xs text-zinc-400">
              {matches[0]?.isDemo ? 'Jadwal Pertandingan [DEMO]' : 'Jadwal Pertandingan Live (API)'}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">Dixon-Coles</div>
            <div className="text-xs text-zinc-400">Model Bivariat Poisson v1</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {totalValueBets} Pasar
            </div>
            <div className="text-xs text-zinc-400">Peluang +EV Ditemukan</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">Supabase + TS</div>
            <div className="text-xs text-zinc-400">Fondasi Bersih & Modular</div>
          </div>
        </div>
      </div>

      {/* League Filter & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Analisis Pertandingan Aktif</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              matches[0]?.isDemo
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {matches[0]?.isDemo ? 'SIMULASI DEMO' : 'LIVE DATA API-FOOTBALL'}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Probabilitas dihitung secara independen dari kekuatan serang/bertahan dan Expected Goals (xG).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-zinc-500 mr-1" />
          {leagues.map(league => (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedLeague === league
                  ? 'bg-emerald-500 text-zinc-950 font-bold'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {league}
            </button>
          ))}
        </div>
      </div>

      {/* Match Cards Grid */}
      {loading ? (
        <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full mb-3" />
          <p className="text-sm text-zinc-400">Memuat jadwal dan menghitung probabilitas Poisson...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictions[match.id]}
              loadingPrediction={!predictions[match.id]}
              onOpenDetails={(m, p) => {
                setActiveModalMatch(m);
                setActiveModalPrediction(p || null);
              }}
            />
          ))}
        </div>
      )}

      {/* Modal View for Detailed 2D Score Grid */}
      <ScoreMatrixModal
        match={activeModalMatch}
        prediction={activeModalPrediction}
        onClose={() => {
          setActiveModalMatch(null);
          setActiveModalPrediction(null);
        }}
      />
    </div>
  );
};
