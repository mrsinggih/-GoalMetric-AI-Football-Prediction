import React, { useState } from 'react';
import { MatchFixture, PredictionResult } from '../../types';
import { BadgeDemo, LoadingState } from '../components/CommonStates';
import { ArrowLeft, Target, Shield, TrendingUp, Grid, Activity, Award, HelpCircle, Sparkles } from 'lucide-react';

interface MatchDetailPageProps {
  match: MatchFixture;
  prediction?: PredictionResult;
  loadingPrediction?: boolean;
  onBack: () => void;
  onOpenH2H: (homeTeam: string, awayTeam: string) => void;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({
  match,
  prediction,
  loadingPrediction,
  onBack,
  onOpenH2H,
}) => {
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<'ALL' | 'OVER' | 'UNDER'>('ALL');

  if (loadingPrediction || !prediction) {
    return <LoadingState message={`Menghitung parameter Dixon-Coles Poisson untuk ${match.homeTeam.name}...`} />;
  }

  const gridGoals = [0, 1, 2, 3, 4, 5];
  const findCellProb = (h: number, a: number) => {
    const found = prediction.scoreMatrix.find(s => s.homeGoals === h && s.awayGoals === a);
    return found ? (found.probability * 100).toFixed(1) : '<0.2';
  };

  const homeProb = Math.round(prediction.probabilities.homeWin * 100);
  const drawProb = Math.round(prediction.probabilities.draw * 100);
  const awayProb = Math.round(prediction.probabilities.awayWin * 100);

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Jadwal</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenH2H(match.homeTeam.name, match.awayTeam.name)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors py-1.5 px-3 rounded-lg bg-sky-950/60 border border-sky-800/60"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Lihat Head-to-Head (H2H)</span>
          </button>
          <BadgeDemo size="md" />
        </div>
      </div>

      {/* Match Showcase Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-400">{match.league}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-mono text-zinc-400">{match.season}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-mono text-zinc-500">{match.venue}</span>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
            Status: {match.status} [DEMO]
          </span>
        </div>

        {/* Center Teams Matchup */}
        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-6 py-4">
          {/* Home Team */}
          <div className="md:col-span-3 text-center md:text-left space-y-2">
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
              Tuan Rumah (Home)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {match.homeTeam.name.replace(' [DEMO]', '')}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-mono text-zinc-300">
              <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                xG Rata-rata: <strong className="text-emerald-400">{match.homeTeam.expectedGoalsFor}</strong>
              </span>
              <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                Serang: <strong className="text-white">{match.homeTeam.homeAttackStrength}x</strong>
              </span>
              <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                Tahan: <strong className="text-white">{match.homeTeam.homeDefenseStrength}x</strong>
              </span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 text-[11px] text-zinc-400 pt-1 font-mono">
              <span>Form:</span>
              {match.homeTeam.recentForm.map((f, i) => (
                <span
                  key={i}
                  className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center text-white ${
                    f === 'W' ? 'bg-emerald-600' : f === 'D' ? 'bg-amber-600' : 'bg-rose-600'
                  }`}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* VS / Expected Goals */}
          <div className="md:col-span-1 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/90 border border-zinc-700 flex items-center justify-center font-extrabold text-sm text-zinc-300 shadow-inner">
              VS
            </div>
            <div className="mt-2 text-center">
              <div className="text-[10px] font-mono text-zinc-400">Expected Goals (λ)</div>
              <div className="text-sm font-bold font-mono text-emerald-400">
                {prediction.homeLambda} - {prediction.awayLambda}
              </div>
            </div>
          </div>

          {/* Away Team */}
          <div className="md:col-span-3 text-center md:text-right space-y-2">
            <span className="text-[11px] font-mono text-sky-400 font-bold uppercase tracking-wider block">
              Tamu (Away)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {match.awayTeam.name.replace(' [DEMO]', '')}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 text-xs font-mono text-zinc-300">
              <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                xG Rata-rata: <strong className="text-sky-400">{match.awayTeam.expectedGoalsFor}</strong>
              </span>
              <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                Serang: <strong className="text-white">{match.awayTeam.awayAttackStrength}x</strong>
              </span>
              <span className="bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                Tahan: <strong className="text-white">{match.awayTeam.awayDefenseStrength}x</strong>
              </span>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-1 text-[11px] text-zinc-400 pt-1 font-mono">
              <span>Form:</span>
              {match.awayTeam.recentForm.map((f, i) => (
                <span
                  key={i}
                  className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center text-white ${
                    f === 'W' ? 'bg-emerald-600' : f === 'D' ? 'bg-amber-600' : 'bg-rose-600'
                  }`}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Probability 1X2 Bar */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80">
          <div className="flex justify-between text-xs font-mono mb-2 text-zinc-300">
            <span className="text-emerald-400 font-bold">P(Home Win): {homeProb}%</span>
            <span className="text-amber-300 font-bold">P(Draw): {drawProb}%</span>
            <span className="text-sky-400 font-bold">P(Away Win): {awayProb}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex">
            <div style={{ width: `${homeProb}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${drawProb}%` }} className="bg-amber-400 h-full" />
            <div style={{ width: `${awayProb}%` }} className="bg-sky-500 h-full" />
          </div>
        </div>
      </div>

      {/* Main Grid: Markets Breakdown + 2D Poisson Heat Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Probabilities & Markets Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Peluang Pasar Kunci (Key Markets)</span>
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Over 2.5 Goals:</span>
                <span className="font-bold text-white text-sm">
                  {Math.round(prediction.markets.over25Goals * 100)}%
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Under 2.5 Goals:</span>
                <span className="font-bold text-white text-sm">
                  {Math.round(prediction.markets.under25Goals * 100)}%
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Both Teams To Score (BTTS Yes):</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {Math.round(prediction.markets.bothTeamsToScore * 100)}%
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Home Clean Sheet (Tuan Rumah Nirbobol):</span>
                <span className="font-bold text-zinc-300 text-sm">
                  {Math.round(prediction.markets.homeCleanSheet * 100)}%
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Away Clean Sheet (Tamu Nirbobol):</span>
                <span className="font-bold text-zinc-300 text-sm">
                  {Math.round(prediction.markets.awayCleanSheet * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Top 5 Likely Scorelines */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Top 5 Skor Paling Mungkin</span>
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {prediction.scoreMatrix.slice(0, 5).map((score, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between font-mono text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-400">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {score.homeGoals} - {score.awayGoals}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400 text-sm">
                    {(score.probability * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: 2D Score Heat Matrix & Value Bet Scanner (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Matriks 2D Heatmap */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-emerald-400" />
                <span>Matriks Distribusi Skor Poisson (0-5 Gol)</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">Dixon-Coles Model</span>
            </div>

            <div className="overflow-x-auto bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="p-2 text-left">H \ A</th>
                    {gridGoals.map(a => (
                      <th key={a} className="p-2 text-sky-400 font-bold">
                        {a} A
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridGoals.map(h => (
                    <tr key={h} className="border-b border-zinc-800/40">
                      <td className="p-2 text-emerald-400 font-bold text-left">
                        {h} H
                      </td>
                      {gridGoals.map(a => {
                        const prob = findCellProb(h, a);
                        const isTop =
                          prediction.mostLikelyScore.homeGoals === h &&
                          prediction.mostLikelyScore.awayGoals === a;
                        return (
                          <td
                            key={a}
                            className={`p-2 transition-all ${
                              isTop
                                ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/50 rounded'
                                : 'text-zinc-300 hover:bg-zinc-800/50'
                            }`}
                          >
                            {prob}%
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Value Bets Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Analisis Nilai Taruhan vs Odds Bandar (+EV)</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Edge &gt; 5%</span>
            </div>

            <div className="overflow-x-auto bg-zinc-950 rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60 text-[10px] uppercase">
                    <th className="p-3">Pasar</th>
                    <th className="p-3">Model</th>
                    <th className="p-3">Odds</th>
                    <th className="p-3">Implied</th>
                    <th className="p-3">Edge (+EV)</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {prediction.valueBets.map((vb, idx) => (
                    <tr key={idx} className={vb.hasValue ? 'bg-emerald-950/20' : ''}>
                      <td className="p-3 font-semibold text-white">{vb.market}</td>
                      <td className="p-3 text-emerald-400 font-bold">
                        {Math.round(vb.modelProbability * 100)}%
                      </td>
                      <td className="p-3 text-zinc-200 font-bold">{vb.bookmakerOdds}</td>
                      <td className="p-3 text-zinc-400">
                        {Math.round(vb.impliedProbability * 100)}%
                      </td>
                      <td className="p-3 font-bold">
                        <span className={vb.edgePercentage > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {vb.edgePercentage > 0 ? `+${vb.edgePercentage}%` : `${vb.edgePercentage}%`}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {vb.hasValue ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                            +EV VALUE
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[10px]">Fair</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
