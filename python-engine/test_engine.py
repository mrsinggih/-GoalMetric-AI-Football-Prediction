"""
Unit Tests for GoalMetric Python Dixon-Coles Poisson Model
"""

import unittest
from models.poisson_dixon_coles import poisson_pmf, dixon_coles_tau, predict_match

class TestPoissonDixonColes(unittest.TestCase):
    def test_poisson_pmf_properties(self):
        # Probability of 0 events with lambda = 1.0 is e^(-1) approx 0.367879
        p0 = poisson_pmf(0, 1.0)
        self.assertAlmostEqual(p0, 0.367879, places=4)

    def test_dixon_coles_tau_adjustment(self):
        # 0-0 adjustment tau = 1 - (lambda * mu * rho)
        tau_00 = dixon_coles_tau(0, 0, 1.5, 1.2, rho=-0.11)
        self.assertGreater(tau_00, 1.0) # Tau increases probability for 0-0 draws

    def test_predict_match_probabilities_sum(self):
        result = predict_match(
            home_attack=1.2,
            home_defense=0.8,
            away_attack=1.0,
            away_defense=1.1
        )
        probs = result["probabilities"]
        total = probs["home_win"] + probs["draw"] + probs["away_win"]
        # Probabilities should sum to approximately 1.0
        self.assertAlmostEqual(total, 1.0, places=2)
        self.assertGreater(result["home_lambda"], 0.5)
        self.assertGreater(result["away_lambda"], 0.5)

if __name__ == "__main__":
    unittest.main()
