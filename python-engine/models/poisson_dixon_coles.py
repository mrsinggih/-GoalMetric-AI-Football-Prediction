"""
GoalMetric AI - Python Statistical Prediction Engine
Model: Dixon and Coles (1997) Bivariate Poisson with Low-Score Correction
"""

import math
from typing import Dict, Any, List, Tuple

DEFAULT_LEAGUE_AVG_HOME = 1.48
DEFAULT_LEAGUE_AVG_AWAY = 1.18

def poisson_pmf(k: int, lamb: float) -> float:
    """Standard Poisson Probability Mass Function"""
    if lamb <= 0:
        return 1.0 if k == 0 else 0.0
    return (math.pow(lamb, k) * math.exp(-lamb)) / math.factorial(k)

def dixon_coles_tau(x: int, y: int, lamb: float, mu: float, rho: float = -0.11) -> float:
    """
    Dixon-Coles adjustment factor for scorelines (0,0), (0,1), (1,0), (1,1).
    rho is the parameter measuring dependence between scores.
    """
    if x == 0 and y == 0:
        return 1.0 - (lamb * mu * rho)
    elif x == 0 and y == 1:
        return 1.0 + (lamb * rho)
    elif x == 1 and y == 0:
        return 1.0 + (mu * rho)
    elif x == 1 and y == 1:
        return 1.0 - rho
    return 1.0

def predict_match(
    home_attack: float,
    home_defense: float,
    away_attack: float,
    away_defense: float,
    max_goals: int = 6,
    rho: float = -0.11
) -> Dict[str, Any]:
    """
    Calculates expected goals and full probability distribution
    """
    home_lambda = max(0.25, min(5.5, home_attack * away_defense * DEFAULT_LEAGUE_AVG_HOME))
    away_lambda = max(0.25, min(5.5, away_attack * home_defense * DEFAULT_LEAGUE_AVG_AWAY))

    matrix: List[Dict[str, Any]] = []
    prob_home_win = 0.0
    prob_draw = 0.0
    prob_away_win = 0.0
    prob_over_25 = 0.0
    prob_under_25 = 0.0
    prob_btts = 0.0
    total_prob = 0.0

    for h in range(max_goals + 1):
        for a in range(max_goals + 1):
            p = poisson_pmf(h, home_lambda) * poisson_pmf(a, away_lambda)
            tau = dixon_coles_tau(h, a, home_lambda, away_lambda, rho)
            cell_prob = max(0.0, p * tau)

            matrix.append({"home_goals": h, "away_goals": a, "probability": cell_prob})
            total_prob += cell_prob

            if h > a:
                prob_home_win += cell_prob
            elif h == a:
                prob_draw += cell_prob
            else:
                prob_away_win += cell_prob

            if h + a > 2.5:
                prob_over_25 += cell_prob
            else:
                prob_under_25 += cell_prob

            if h > 0 and a > 0:
                prob_btts += cell_prob

    # Normalize
    if total_prob > 0:
        prob_home_win /= total_prob
        prob_draw /= total_prob
        prob_away_win /= total_prob
        prob_over_25 /= total_prob
        prob_under_25 /= total_prob
        prob_btts /= total_prob
        for cell in matrix:
            cell["probability"] = round(cell["probability"] / total_prob, 4)

    matrix.sort(key=lambda x: x["probability"], reverse=True)
    most_likely = matrix[0] if matrix else {"home_goals": 1, "away_goals": 1, "probability": 0.12}

    return {
        "home_lambda": round(home_lambda, 2),
        "away_lambda": round(away_lambda, 2),
        "probabilities": {
            "home_win": round(prob_home_win, 3),
            "draw": round(prob_draw, 3),
            "away_win": round(prob_away_win, 3),
        },
        "most_likely_score": most_likely,
        "markets": {
            "over_25_goals": round(prob_over_25, 3),
            "under_25_goals": round(prob_under_25, 3),
            "both_teams_to_score": round(prob_btts, 3),
        },
        "top_scorelines": matrix[:10],
    }
