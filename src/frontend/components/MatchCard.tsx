import React from 'react';
import { MatchFixture, PredictionResult } from '../../types';
import { TrendingUp, Target, Shield, Percent, ChevronRight } from 'lucide-react';

interface MatchCardProps {
  match: MatchFixture;
  prediction?: PredictionResult;
  loadingPrediction?: boolean;
  onOpenDetails: (match: MatchFixture, prediction?: PredictionResult) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  prediction,
  loadingPrediction,
  onOpenDetails,
}) => {
  const homeProb = prediction ? Math.round(prediction.probabilities.homeWin * 100) : 0;
  const drawProb = prediction ? Math.round(prediction.probabilities.draw * 100) : 0;
  const awayProb = prediction ? Math.round(prediction.probabilities.awayWin * 100) : 0;

  // Check if any positive EV bet is found
  const positiveEvBets = prediction?.valueBets.filter(b => b.hasValue) || [];

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all shadow-md relative overflow-hidden flex flex-col justify-between">
      {/* Top Bar: League & Demo Tag */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 font-mono tracking-wider">
              {match.league}
            </span>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase">
              DEMO DATA
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {new Date(match.kickoffTime).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Teams Display */}
        <div className="grid grid-cols-5 items-center py-2 mb-3 gap-2">
          {/* Home Team */}
          <div className="col-span-2 text-left">
            <h3 className="font-bold text-white text-base leading-tight">
              {match.homeTeam.name.replace(' [DEMO]', '')}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
              <span className="font-mono text-emerald-400 text-[11px]">xG: {match.homeTeam.expectedGoalsFor}</span>
              <span className="text-zinc-600">|</span>
              <span className="font-mono text-zinc-400 text-[11px]">Att: {match.homeTeam.homeAttackStrength}</span>
            </div>
          </div>

          {/* VS / Expected Goals indicator */}
          <div className="col-span-1 text-center flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-zinc-300">
              VS
            </div>
            {prediction && (
              <span className="text-[10px] font-mono text-zinc-400 mt-1">
                λ {prediction.homeLambda} - {prediction.awayLambda}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="col-span-2 text-right">
            <h3 className="font-bold text-white text-base leading-tight">
              {match.awayTeam.name.replace(' [DEMO]', '')}
            </h3>
            <div className="flex items-center justify-end gap-2 mt-1 text-xs text-zinc-400">
              <span className="font-mono text-zinc-400 text-[11px]">Att: {match.awayTeam.awayAttackStrength}</span>
              <span className="text-zinc-600">|</span>
              <span className="font-mono text-emerald-400 text-[11px]">xG: {match.awayTeam.expectedGoalsFor}</span>
            </div>
          </div>
        </div>

        {/* 1X2 Probabilities Bar */}
        {prediction && (
          <div className="mb-4">
            <div className="flex justify-between text-xs font-mono mb-1 text-zinc-300">
              <span className="text-emerald-400 font-semibold">1: {homeProb}%</span>
              <span className="text-amber-300 font-semibold">X: {drawProb}%</span>
              <span className="text-sky-400 font-semibold">2: {awayProb}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden flex">
              <div
                style={{ width: `${homeProb}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Home Win: ${homeProb}%`}
              />
              <div
                style={{ width: `${drawProb}%` }}
                className="bg-amber-400 h-full transition-all"
                title={`Draw: ${drawProb}%`}
              />
              <div
                style={{ width: `${awayProb}%` }}
                className="bg-sky-500 h-full transition-all"
                title={`Away Win: ${awayProb}%`}
              />
            </div>
          </div>
        )}

        {/* Markets Summary: Over 2.5 & BTTS */}
        {prediction && (
          <div className="grid grid-cols-2 gap-2 mb-3 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-zinc-500" /> Over 2.5:
              </span>
              <span className="font-mono font-semibold text-zinc-200">
                {Math.round(prediction.markets.over25Goals * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-zinc-500" /> BTTS (Yes):
              </span>
              <span className="font-mono font-semibold text-zinc-200">
                {Math.round(prediction.markets.bothTeamsToScore * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Value Bet Alert Banner if +EV found */}
        {positiveEvBets.length > 0 && (
          <div className="mb-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" /> Peluang +EV Terdeteksi:
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
                +{positiveEvBets[0].edgePercentage}% Edge
              </span>
            </div>
            <p className="text-zinc-300 text-[11px]">
              Pasar <strong>{positiveEvBets[0].market}</strong> (Odds: {positiveEvBets[0].bookmakerOdds}) memiliki keunggulan atas model Poisson.
            </p>
          </div>
        )}

        {/* Top Most Likely Score */}
        {prediction && (
          <div className="text-xs text-zinc-400 flex items-center justify-between mb-3 px-1">
            <span>Skor Paling Mungkin:</span>
            <span className="font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
              {prediction.mostLikelyScore.homeGoals} - {prediction.mostLikelyScore.awayGoals} ({Math.round(prediction.mostLikelyScore.probability * 100)}%)
            </span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
        <div className="text-[11px] font-mono text-zinc-500">
          Engine: {prediction?.calculationEngine.includes('PYTHON') ? 'Python (Dixon-Coles)' : 'TS Poisson'}
        </div>
        <button
          onClick={() => onOpenDetails(match, prediction)}
          disabled={loadingPrediction}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors py-1 px-2 rounded-lg hover:bg-emerald-950/30"
        >
          <span>Detail Matriks</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
