/**
 * GoalMetric AI - Football Elo Rating Engine
 * Statistical benchmark and rating system adjusted for football dynamics:
 * - Home field advantage (HFA) offset
 * - Goal difference margin multiplier
 * - Newly promoted team regression to mean & default baseline
 *
 * Free from UI dependencies and non-deterministic heuristics.
 */

export interface EloTeamState {
  teamId: string;
  name: string;
  eloRating: number;
  matchesPlayed: number;
  isNewlyPromoted?: boolean;
}

export interface EloMatchPrediction {
  homeElo: number;
  awayElo: number;
  homeEloAdvantage: number; // Includes Home Field Advantage
  expectedScoreHome: number; // Win expectancy (0 to 1)
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
}

export class EloRatingEngine {
  readonly defaultBaselineElo: number = 1500;
  readonly defaultPromotedElo: number = 1420; // Newly promoted teams regress to lower baseline
  readonly homeFieldAdvantage: number = 75;   // ~75 Elo points standard home advantage
  readonly kFactor: number = 32;

  /**
   * Expected score of Team A vs Team B based on logistic difference:
   * E_A = 1 / (1 + 10^((R_B - (R_A + HFA)) / 400))
   */
  calculateExpectedScore(homeRating: number, awayRating: number): number {
    const effectiveHomeRating = homeRating + this.homeFieldAdvantage;
    const exponent = (awayRating - effectiveHomeRating) / 400;
    return 1 / (1 + Math.pow(10, exponent));
  }

  /**
   * Converts continuous win expectancy into discrete 1X2 football probabilities.
   * Uses empirical logistic calibration for football draws:
   * P(Draw) peaks when teams are evenly matched (~27-28%) and decreases as difference grows.
   */
  calculateMatchProbabilities(homeRating: number, awayRating: number): EloMatchPrediction {
    const expectedScoreHome = this.calculateExpectedScore(homeRating, awayRating);
    const ratingDiff = (homeRating + this.homeFieldAdvantage) - awayRating;

    // Empirical draw model: P(Draw) = 0.28 * exp(- (diff / 320)^2)
    const drawProbability = Math.max(0.12, Math.min(0.32, 0.28 * Math.exp(-Math.pow(ratingDiff / 320, 2))));

    // Remaining probability split according to expected score
    const nonDrawMass = 1.0 - drawProbability;
    let homeWin = expectedScoreHome * nonDrawMass;
    let awayWin = (1.0 - expectedScoreHome) * nonDrawMass;

    // Normalization to strictly sum to 1.0
    const sum = homeWin + drawProbability + awayWin;
    homeWin = Number((homeWin / sum).toFixed(4));
    const draw = Number((drawProbability / sum).toFixed(4));
    awayWin = Number((1.0 - homeWin - draw).toFixed(4));

    return {
      homeElo: Math.round(homeRating),
      awayElo: Math.round(awayRating),
      homeEloAdvantage: Math.round(ratingDiff),
      expectedScoreHome: Number(expectedScoreHome.toFixed(4)),
      probabilities: {
        homeWin: Math.max(0.01, Math.min(0.99, homeWin)),
        draw: Math.max(0.01, Math.min(0.99, draw)),
        awayWin: Math.max(0.01, Math.min(0.99, awayWin)),
      },
    };
  }

  /**
   * Updates Elo rating post-match using goal margin multiplier:
   * G = 1 + (goalDiff - 1) * 0.5 (for goalDiff > 1)
   */
  updateRatings(
    homeRating: number,
    awayRating: number,
    homeScore: number,
    awayScore: number
  ): { newHomeRating: number; newAwayRating: number; deltaElo: number } {
    const expectedHome = this.calculateExpectedScore(homeRating, awayRating);
    const actualHome = homeScore > awayScore ? 1.0 : homeScore === awayScore ? 0.5 : 0.0;

    const goalDiff = Math.abs(homeScore - awayScore);
    let marginMultiplier = 1.0;
    if (goalDiff === 2) marginMultiplier = 1.5;
    else if (goalDiff === 3) marginMultiplier = 1.75;
    else if (goalDiff >= 4) marginMultiplier = 1.75 + (goalDiff - 3) / 8;

    const delta = this.kFactor * marginMultiplier * (actualHome - expectedHome);

    return {
      newHomeRating: Math.round(homeRating + delta),
      newAwayRating: Math.round(awayRating - delta),
      deltaElo: Math.round(delta),
    };
  }

  /**
   * Initializes or regresses rating for newly promoted teams or small sample size
   */
  initializeTeamElo(isNewlyPromoted: boolean = false, priorRating?: number): number {
    if (priorRating !== undefined) {
      // Regress 20% to league mean at start of new season
      return Math.round(0.8 * priorRating + 0.2 * this.defaultBaselineElo);
    }
    return isNewlyPromoted ? this.defaultPromotedElo : this.defaultBaselineElo;
  }
}

export const eloRatingEngine = new EloRatingEngine();
