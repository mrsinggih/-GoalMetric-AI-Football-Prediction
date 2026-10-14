import React from 'react';
import { MatchFixture, PredictionResult } from '../../types';
import { X, AlertCircle, TrendingUp, Grid, Target } from 'lucide-react';

interface ScoreMatrixModalProps {
  match: MatchFixture | null;
  prediction: PredictionResult | null;
  onClose: () => void;
}

export const ScoreMatrixModal: React.FC<ScoreMatrixModalProps> = ({
  match,
  prediction,
  onClose,
}) => {
  if (!match || !prediction) return null;

  // Build 0 to 4 score grid
  const gridGoals = [0, 1, 2, 3, 4];
  const findProb = (h: number, a: number) => {
    const found = prediction.scoreMatrix.find(s => s.homeGoals === h && s.awayGoals === a);
    return found ? (found.probability * 100).toFixed(1) : '<0.5';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl rounded-2xl p-6 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              DATA SIMULASI DEMO
            </span>
            <span className="text-xs text-zinc-400 font-mono">{match.league}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {match.homeTeam.name.replace(' [DEMO]', '')} vs {match.awayTeam.name.replace(' [DEMO]', '')}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Model Matematika: <span className="text-emerald-400 font-mono">{prediction.calculationEngine}</span> (Expected Goals: Home λ = {prediction.homeLambda}, Away λ = {prediction.awayLambda})
          </p>
        </div>

        {/* Tabular Score Matrix (Poisson 0-4 grid) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Grid className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-200">
              Matriks Probabilitas Skor Eksak (0 - 4 Gol)
            </h3>
          </div>
          <div className="overflow-x-auto bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-400 mb-2 text-center">
              Kolom: Gol Away ({match.awayTeam.name.replace(' [DEMO]', '')}) → | Baris: Gol Home ({match.homeTeam.name.replace(' [DEMO]', '')}) ↓
            </div>
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="p-2 text-left">H \ A</th>
                  {gridGoals.map(a => (
                    <th key={a} className="p-2 font-bold text-sky-400">
                      {a} Away
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridGoals.map(h => (
                  <tr key={h} className="border-b border-zinc-800/50">
                    <td className="p-2 font-bold text-emerald-400 text-left">
                      {h} Home
                    </td>
                    {gridGoals.map(a => {
                      const probStr = findProb(h, a);
                      const isTop = prediction.mostLikelyScore.homeGoals === h && prediction.mostLikelyScore.awayGoals === a;
                      return (
                        <td
                          key={a}
                          className={`p-2 transition-colors ${
                            isTop
                              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 rounded'
                              : 'text-zinc-300 hover:bg-zinc-800/50'
                          }`}
                        >
                          {probStr}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Value Bet Analysis Table */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-200">
              Analisis Expected Value (+EV) vs Odds Pasar
            </h3>
          </div>

          <div className="overflow-x-auto bg-zinc-950 rounded-xl border border-zinc-800">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/60">
                  <th className="p-3">Pasar</th>
                  <th className="p-3">Model Prob</th>
                  <th className="p-3">Odds Pasar</th>
                  <th className="p-3">Implied Prob</th>
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
                    <td className="p-3">
                      <span
                        className={`font-bold ${
                          vb.edgePercentage > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {vb.edgePercentage > 0 ? `+${vb.edgePercentage}%` : `${vb.edgePercentage}%`}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {vb.hasValue ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                          +EV VALUE BET
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[10px]">Fair / No Edge</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Explanatory Footer */}
        <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-200">Catatan Metodologi:</strong> Nilai probabilitas dihitung menggunakan rumus distribusi Poisson bivariate dengan koreksi Dixon-Coles untuk mengkompensasi kecenderungan under-reporting skor imbang rendah (0-0, 1-1). Data ini murni simulasi arsitektur fondasi SaaS.
          </div>
        </div>
      </div>
    </div>
  );
};
