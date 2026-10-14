import React, { useState } from 'react';
import { MatchFixture, PredictionResult, ComboBetItem } from '../../types';
import { computeComboBetSlip } from '../services/footballDataService';
import { BadgeDemo, EmptyState } from '../components/CommonStates';
import { Layers, Plus, Trash2, TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

interface CombinationBuilderPageProps {
  matches: MatchFixture[];
  predictions: Record<string, PredictionResult>;
}

export const CombinationBuilderPage: React.FC<CombinationBuilderPageProps> = ({
  matches,
  predictions,
}) => {
  const [selectedItems, setSelectedItems] = useState<ComboBetItem[]>(() => {
    if (matches && matches.length >= 2) {
      return [
        {
          matchId: matches[0].id,
          homeTeam: matches[0].homeTeam.name.replace(' [DEMO]', ''),
          awayTeam: matches[0].awayTeam.name.replace(' [DEMO]', ''),
          league: matches[0].league,
          selectedMarket: 'Home Win',
          modelProb: 0.60,
          bookmakerOdds: matches[0].odds?.homeWin || 1.85,
          edgePercentage: 11.0,
        },
        {
          matchId: matches[1].id,
          homeTeam: matches[1].homeTeam.name.replace(' [DEMO]', ''),
          awayTeam: matches[1].awayTeam.name.replace(' [DEMO]', ''),
          league: matches[1].league,
          selectedMarket: 'Over 2.5 Goals',
          modelProb: 0.62,
          bookmakerOdds: matches[1].odds?.over25 || 1.75,
          edgePercentage: 8.5,
        },
      ];
    }
    return [];
  });

  const slip = computeComboBetSlip(selectedItems);

  const handleAddItem = (match: MatchFixture, pred: PredictionResult, market: string, modelProb: number, odds: number, edge: number) => {
    // Avoid duplicate match
    if (selectedItems.some(i => i.matchId === match.id)) return;

    const newItem: ComboBetItem = {
      matchId: match.id,
      homeTeam: match.homeTeam.name.replace(' [DEMO]', ''),
      awayTeam: match.awayTeam.name.replace(' [DEMO]', ''),
      league: match.league,
      selectedMarket: market,
      modelProb,
      bookmakerOdds: odds,
      edgePercentage: edge,
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const handleRemoveItem = (matchId: string) => {
    setSelectedItems(selectedItems.filter(i => i.matchId !== matchId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">Analisis Kombinasi & Parlay Builder</h1>
              {matches[0]?.isDemo ? <BadgeDemo size="sm" /> : (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                  LIVE API-FOOTBALL
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">
              {matches[0]?.isDemo
                ? 'Bangun slip kombinasi peluang majemuk [DEMO DATA].'
                : 'Bangun slip kombinasi peluang majemuk dari data live API-Football.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Available Matches & Bets to Pick (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Pilihan Pasar dengan Nilai Positif (+EV)</span>
            <span className="text-xs font-mono text-emerald-400 font-normal">Klik untuk tambahkan ke slip</span>
          </h2>

          <div className="space-y-3">
            {matches.map(m => {
              const pred = predictions[m.id];
              const isSelected = selectedItems.some(i => i.matchId === m.id);

              return (
                <div
                  key={m.id}
                  className={`bg-zinc-900 border rounded-2xl p-4 transition-all ${
                    isSelected ? 'border-emerald-500/40 bg-zinc-900/90' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-zinc-400 font-mono">{m.league}</span>
                    <BadgeDemo size="sm" />
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-white text-sm">
                      {m.homeTeam.name.replace(' [DEMO]', '')} vs {m.awayTeam.name.replace(' [DEMO]', '')}
                    </div>
                  </div>

                  {/* Market Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      disabled={isSelected || !m.odds}
                      onClick={() =>
                        pred && m.odds &&
                        handleAddItem(
                          m,
                          pred,
                          'Home Win',
                          pred.probabilities.homeWin,
                          m.odds.homeWin,
                          Math.round(((pred.probabilities.homeWin * m.odds.homeWin) - 1) * 100)
                        )
                      }
                      className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors disabled:opacity-40"
                    >
                      <div className="text-[10px] text-zinc-400">Home Win (1)</div>
                      <div className="font-mono text-xs font-bold text-emerald-400">
                        {m.odds?.homeWin} <span className="text-zinc-500 font-normal">({pred ? Math.round(pred.probabilities.homeWin * 100) : 0}%)</span>
                      </div>
                    </button>

                    <button
                      disabled={isSelected || !m.odds}
                      onClick={() =>
                        pred && m.odds &&
                        handleAddItem(
                          m,
                          pred,
                          'Over 2.5 Goals',
                          pred.markets.over25Goals,
                          m.odds.over25,
                          Math.round(((pred.markets.over25Goals * m.odds.over25) - 1) * 100)
                        )
                      }
                      className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors disabled:opacity-40"
                    >
                      <div className="text-[10px] text-zinc-400">Over 2.5 Goals</div>
                      <div className="font-mono text-xs font-bold text-sky-400">
                        {m.odds?.over25} <span className="text-zinc-500 font-normal">({pred ? Math.round(pred.markets.over25Goals * 100) : 0}%)</span>
                      </div>
                    </button>

                    <button
                      disabled={isSelected || !m.odds}
                      onClick={() =>
                        pred && m.odds &&
                        handleAddItem(
                          m,
                          pred,
                          'BTTS (Yes)',
                          pred.markets.bothTeamsToScore,
                          m.odds.bttsYes,
                          Math.round(((pred.markets.bothTeamsToScore * m.odds.bttsYes) - 1) * 100)
                        )
                      }
                      className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors disabled:opacity-40"
                    >
                      <div className="text-[10px] text-zinc-400">BTTS (Yes)</div>
                      <div className="font-mono text-xs font-bold text-purple-400">
                        {m.odds?.bttsYes} <span className="text-zinc-500 font-normal">({pred ? Math.round(pred.markets.bothTeamsToScore * 100) : 0}%)</span>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Calculated Combination Slip (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sticky top-24 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Slip Analisis Kombinasi</h3>
              </div>
              <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-mono text-zinc-300">
                {selectedItems.length} Pilihan
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <EmptyState
                title="Slip Masih Kosong"
                description="Pilih minimal 2 pasar dari daftar pertandingan di sebelah kiri untuk menganalisis probabilitas kombinasi."
              />
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div
                      key={item.matchId}
                      className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-white text-xs">
                          {item.homeTeam.replace(' [DEMO]', '')} vs {item.awayTeam.replace(' [DEMO]', '')}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono">
                          {item.selectedMarket} @ {item.bookmakerOdds}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Probabilitas Model: {Math.round(item.modelProb * 100)}%
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.matchId)}
                        className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors"
                        title="Hapus dari slip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Computation Results */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-400">Peluang Gabungan Majemuk:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {Math.round(slip.combinedModelProbability * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-400">Total Odds Bandar:</span>
                    <span className="text-white font-bold text-sm">{slip.combinedDecimalOdds}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="text-zinc-400">Edge Gabungan (+EV):</span>
                    <span className={`font-bold text-sm ${slip.totalEdgePercentage > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {slip.totalEdgePercentage > 0 ? `+${slip.totalEdgePercentage}%` : `${slip.totalEdgePercentage}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300 pt-2 border-t border-zinc-800">
                    <span className="text-zinc-400">Rekomendasi Kelly Konservatif:</span>
                    <span className="text-sky-400 font-bold">
                      {slip.recommendedKellyStakePct}% Bankroll
                    </span>
                  </div>
                </div>

                {/* Notice */}
                <div className="bg-amber-950/30 border border-amber-600/30 p-3 rounded-xl text-[11px] text-amber-300/90 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    Simulasi kombinasi ini dihitung dengan asumsi independensi probabilitas Poisson antar pertandingan. Semua data bersifat demo.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
