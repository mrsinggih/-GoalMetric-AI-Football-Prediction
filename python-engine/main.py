"""
GoalMetric AI - Python Statistical Microservice API
FastAPI service exposing Dixon-Coles Poisson model and statistical analytics.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import time
from models.poisson_dixon_coles import predict_match

app = FastAPI(
    title="GoalMetric AI Statistical Microservice",
    description="High-performance Dixon-Coles Poisson prediction engine for football analytics",
    version="1.0.0"
)

class TeamInput(BaseModel):
    name: str
    attack_strength: float = Field(default=1.0, ge=0.1, le=5.0)
    defense_strength: float = Field(default=1.0, ge=0.1, le=5.0)
    xg_for: Optional[float] = 1.3
    xg_against: Optional[float] = 1.3

class OddsInput(BaseModel):
    home_win: Optional[float] = None
    draw: Optional[float] = None
    away_win: Optional[float] = None
    over25: Optional[float] = None
    under25: Optional[float] = None
    btts_yes: Optional[float] = None

class PredictionRequest(BaseModel):
    match_id: str
    home_team: TeamInput
    away_team: TeamInput
    odds: Optional[OddsInput] = None

@app.get("/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "service": "GoalMetric AI Python Engine",
        "model": "Dixon-Coles Bivariate Poisson (1997)",
        "timestamp": time.time(),
    }

@app.post("/predict")
def calculate_prediction(req: PredictionRequest) -> Dict[str, Any]:
    try:
        raw_result = predict_match(
            home_attack=req.home_team.attack_strength,
            home_defense=req.home_team.defense_strength,
            away_attack=req.away_team.attack_strength,
            away_defense=req.away_team.defense_strength,
        )

        value_bets: List[Dict[str, Any]] = []
        if req.odds:
            check_list = [
                ("Home Win", raw_result["probabilities"]["home_win"], req.odds.home_win),
                ("Draw", raw_result["probabilities"]["draw"], req.odds.draw),
                ("Away Win", raw_result["probabilities"]["away_win"], req.odds.away_win),
                ("Over 2.5 Goals", raw_result["markets"]["over_25_goals"], req.odds.over25),
                ("Under 2.5 Goals", raw_result["markets"]["under_25_goals"], req.odds.under25),
                ("Both Teams To Score (Yes)", raw_result["markets"]["both_teams_to_score"], req.odds.btts_yes),
            ]
            for market_name, model_prob, book_odds in check_list:
                if book_odds and book_odds > 1.0:
                    edge = (model_prob * book_odds) - 1.0
                    value_bets.append({
                        "market": market_name,
                        "modelProbability": model_prob,
                        "bookmakerOdds": book_odds,
                        "impliedProbability": round(1.0 / book_odds, 3),
                        "edgePercentage": round(edge * 100, 1),
                        "hasValue": edge > 0.05,
                    })

        return {
            "matchId": req.match_id,
            "homeTeamName": req.home_team.name,
            "awayTeamName": req.away_team.name,
            "calculationEngine": "PYTHON_DIXON_COLES_V1",
            "homeLambda": raw_result["home_lambda"],
            "awayLambda": raw_result["away_lambda"],
            "probabilities": {
                "homeWin": raw_result["probabilities"]["home_win"],
                "draw": raw_result["probabilities"]["draw"],
                "awayWin": raw_result["probabilities"]["away_win"],
            },
            "mostLikelyScore": {
                "homeGoals": raw_result["most_likely_score"]["home_goals"],
                "awayGoals": raw_result["most_likely_score"]["away_goals"],
                "probability": raw_result["most_likely_score"]["probability"],
            },
            "scoreMatrix": [
                {
                    "homeGoals": s["home_goals"],
                    "awayGoals": s["away_goals"],
                    "probability": s["probability"]
                }
                for s in raw_result["top_scorelines"]
            ],
            "markets": {
                "over25Goals": raw_result["markets"]["over_25_goals"],
                "under25Goals": raw_result["markets"]["under_25_goals"],
                "bothTeamsToScore": raw_result["markets"]["both_teams_to_score"],
                "homeCleanSheet": round(1.0 - raw_result["probabilities"]["away_win"], 3),
                "awayCleanSheet": round(1.0 - raw_result["probabilities"]["home_win"], 3),
            },
            "valueBets": value_bets,
            "confidenceRating": "HIGH" if max(raw_result["probabilities"].values()) > 0.55 else "MEDIUM",
            "isDemo": True,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
