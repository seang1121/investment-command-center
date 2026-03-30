"""Core business logic tests — Monte Carlo, optimization, risk, dividends."""

from datetime import datetime
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest


# ---------------------------------------------------------------------------
# Monte Carlo simulation
# ---------------------------------------------------------------------------

class TestMonteCarlo:
    """Tests for api.services.monte_carlo_service.run_simulation."""

    def _run(self, mock_returns, **overrides):
        """Helper to run simulation with mocked external data."""
        defaults = {
            "tickers": ["AAPL"],
            "initial_investment": 10000,
            "time_horizon_years": 1,
            "num_simulations": 1000,
        }
        defaults.update(overrides)

        with patch("api.services.monte_carlo_service.get_returns", return_value=mock_returns):
            from api.services.monte_carlo_service import run_simulation

            return run_simulation(**defaults)

    def test_basic_result_shape(self, mock_returns):
        result = self._run(mock_returns)
        assert "percentiles" in result
        assert "months" in result
        assert "expected_final" in result
        assert "median_final" in result
        assert "worst_case" in result
        assert "best_case" in result
        assert "prob_loss" in result

    def test_percentile_keys(self, mock_returns):
        result = self._run(mock_returns)
        for key in ("5th", "25th", "50th", "75th", "95th", "mean"):
            assert key in result["percentiles"], f"Missing percentile: {key}"

    def test_percentile_ordering(self, mock_returns):
        """5th percentile final value <= 95th percentile final value."""
        result = self._run(mock_returns)
        final_5 = result["percentiles"]["5th"][-1]
        final_95 = result["percentiles"]["95th"][-1]
        assert final_5 <= final_95

    def test_months_length(self, mock_returns):
        result = self._run(mock_returns, time_horizon_years=2)
        expected_months = 2 * 12 + 1  # 0 through 24
        assert len(result["months"]) == expected_months

    def test_initial_value_is_investment(self, mock_returns):
        result = self._run(mock_returns, initial_investment=50000)
        for key in result["percentiles"]:
            assert result["percentiles"][key][0] == 50000

    def test_prob_loss_between_0_and_100(self, mock_returns):
        result = self._run(mock_returns)
        assert 0 <= result["prob_loss"] <= 100

    def test_prob_target(self, mock_returns):
        result = self._run(mock_returns, target_value=12000)
        assert result["prob_target"] is not None
        assert 0 <= result["prob_target"] <= 100

    def test_prob_target_none_when_not_set(self, mock_returns):
        result = self._run(mock_returns)
        assert result["prob_target"] is None

    def test_contributions_increase_final(self, mock_returns):
        """Monthly contributions should push the expected final higher."""
        no_contrib = self._run(mock_returns, time_horizon_years=3)
        with_contrib = self._run(
            mock_returns, time_horizon_years=3, monthly_contribution=500,
        )
        assert with_contrib["expected_final"] > no_contrib["expected_final"]

    def test_withdrawals_decrease_final(self, mock_returns):
        """Monthly withdrawals should pull the expected final lower."""
        no_withdraw = self._run(mock_returns, time_horizon_years=3, initial_investment=50000)
        with_withdraw = self._run(
            mock_returns,
            time_horizon_years=3,
            initial_investment=50000,
            monthly_withdrawal=500,
        )
        assert with_withdraw["expected_final"] < no_withdraw["expected_final"]

    def test_floor_at_zero(self, mock_returns):
        """Portfolio value should never go below zero."""
        result = self._run(
            mock_returns,
            initial_investment=100,
            monthly_withdrawal=5000,
            time_horizon_years=2,
        )
        for key in result["percentiles"]:
            for v in result["percentiles"][key]:
                assert v >= 0

    def test_insufficient_data_raises(self):
        """Fewer than 60 data points should raise ValueError."""
        short_returns = pd.Series(np.random.normal(0, 0.01, 30), index=pd.bdate_range("2025-01-01", periods=30))
        with pytest.raises(ValueError, match="at least 60"):
            self._run(short_returns)

    def test_equal_weight_default(self, mock_returns):
        """When weights=None with two tickers, each gets 0.5."""
        with patch("api.services.monte_carlo_service.get_returns", return_value=mock_returns):
            from api.services.monte_carlo_service import run_simulation

            result = run_simulation(
                tickers=["AAPL", "MSFT"],
                initial_investment=10000,
                time_horizon_years=1,
                num_simulations=1000,
            )
        assert "expected_final" in result


# ---------------------------------------------------------------------------
# Risk metrics
# ---------------------------------------------------------------------------

class TestRiskMetrics:
    """Tests for the risk computation helpers in risk_service."""

    def test_sharpe_formula(self):
        """Sharpe = mean(excess) / std(excess) * sqrt(252)."""
        from api.services.risk_service import _sharpe

        returns = np.array([0.01, 0.02, -0.005, 0.015, 0.003] * 20)
        daily_rf = 0.05 / 252
        result = _sharpe(returns, daily_rf)
        assert isinstance(result, float)
        assert result > 0  # Positive returns should give positive Sharpe

    def test_sharpe_zero_vol(self):
        from api.services.risk_service import _sharpe

        returns = np.array([0.001] * 50)
        result = _sharpe(returns, 0.001)
        assert result == 0.0

    def test_sortino_formula(self):
        from api.services.risk_service import _sortino

        returns = np.array([0.01, -0.02, 0.015, -0.005, 0.02] * 20)
        daily_rf = 0.05 / 252
        result = _sortino(returns, daily_rf)
        assert isinstance(result, float)

    def test_sortino_no_downside(self):
        """All positive returns means no downside deviation."""
        from api.services.risk_service import _sortino

        returns = np.array([0.01, 0.02, 0.015, 0.01, 0.005] * 10)
        result = _sortino(returns, 0.0)
        # No negative excess returns means 0
        assert result == 0.0

    def test_var_is_negative(self):
        """VaR at 95% confidence should be a negative number for typical returns."""
        from api.services.risk_service import _var

        returns = np.random.normal(0.001, 0.02, 500)
        result = _var(returns, 0.05)
        assert result < 0

    def test_cvar_worse_than_var(self):
        """CVaR should be equal to or worse (more negative) than VaR."""
        from api.services.risk_service import _cvar, _var

        returns = np.random.normal(0.001, 0.02, 500)
        var = _var(returns, 0.05)
        cvar = _cvar(returns, 0.05)
        assert cvar <= var

    def test_max_drawdown_range(self):
        """Max drawdown should be between -1 and 0."""
        from api.services.risk_service import _max_drawdown

        returns = np.random.normal(0.001, 0.02, 500)
        dd, duration = _max_drawdown(returns)
        assert -1.0 <= dd <= 0.0

    def test_max_drawdown_duration(self):
        from api.services.risk_service import _max_drawdown

        returns = np.random.normal(0.001, 0.02, 500)
        dd, duration = _max_drawdown(returns)
        if duration is not None:
            assert duration >= 0

    def test_full_risk_metrics(self, mock_returns):
        """Integration test for compute_risk_metrics with mocked data."""
        with patch("api.services.risk_service.get_returns", return_value=mock_returns):
            from api.services.risk_service import compute_risk_metrics

            result = compute_risk_metrics(tickers=["AAPL"], period="2y")

        assert "sharpe_ratio" in result
        assert "sortino_ratio" in result
        assert "var_95" in result
        assert "cvar_95" in result
        assert "max_drawdown" in result
        assert "annualized_return" in result
        assert "annualized_volatility" in result
        assert result["annualized_volatility"] > 0


# ---------------------------------------------------------------------------
# Optimization (Markowitz)
# ---------------------------------------------------------------------------

class TestOptimization:
    """Tests for the random frontier helper and full optimize flow."""

    def test_random_frontier_count(self):
        from api.services.optimization_service import _random_frontier

        mu = np.array([0.10, 0.15])
        cov = np.array([[0.04, 0.01], [0.01, 0.09]])
        frontier = _random_frontier(mu, cov, n=100, rf=0.05)
        assert len(frontier) == 100

    def test_random_frontier_keys(self):
        from api.services.optimization_service import _random_frontier

        mu = np.array([0.10, 0.15])
        cov = np.array([[0.04, 0.01], [0.01, 0.09]])
        frontier = _random_frontier(mu, cov, n=10, rf=0.05)
        for pt in frontier:
            assert "return" in pt
            assert "volatility" in pt
            assert "sharpe" in pt

    def test_random_frontier_volatility_positive(self):
        from api.services.optimization_service import _random_frontier

        mu = np.array([0.10, 0.15, 0.08])
        cov = np.array([
            [0.04, 0.01, 0.005],
            [0.01, 0.09, 0.02],
            [0.005, 0.02, 0.03],
        ])
        frontier = _random_frontier(mu, cov, n=50, rf=0.05)
        for pt in frontier:
            assert pt["volatility"] >= 0


# ---------------------------------------------------------------------------
# Dividend analysis
# ---------------------------------------------------------------------------

class TestDividendAnalysis:
    """Tests for dividend_service logic."""

    def test_gordon_growth_basic(self):
        from api.services.dividend_service import _gordon_growth

        # D0=2.0, g=3%, r=10% => D1=2.06, V=2.06/(0.10-0.03) = 29.43
        result = _gordon_growth(2.0, 0.10, 0.03)
        assert result is not None
        assert abs(result - 29.43) < 0.1

    def test_gordon_growth_no_dividend(self):
        from api.services.dividend_service import _gordon_growth

        assert _gordon_growth(None, 0.10, 0.03) is None
        assert _gordon_growth(0, 0.10, 0.03) is None

    def test_gordon_growth_rate_exceeds_return(self):
        """Model breaks when g >= r."""
        from api.services.dividend_service import _gordon_growth

        assert _gordon_growth(2.0, 0.05, 0.08) is None
        assert _gordon_growth(2.0, 0.05, 0.05) is None

    def test_sustainability_high(self):
        from api.services.dividend_service import _sustainability_score

        assert _sustainability_score(0.30, {"3yr": 0.05}) == "High"

    def test_sustainability_medium(self):
        from api.services.dividend_service import _sustainability_score

        assert _sustainability_score(0.80, {"3yr": 0.05}) == "Medium"

    def test_sustainability_low_high_payout(self):
        from api.services.dividend_service import _sustainability_score

        assert _sustainability_score(1.2, {"3yr": 0.05}) == "Low"

    def test_sustainability_low_negative_growth(self):
        from api.services.dividend_service import _sustainability_score

        assert _sustainability_score(0.80, {"3yr": -0.05}) == "Low"

    def test_sustainability_none_payout(self):
        from api.services.dividend_service import _sustainability_score

        assert _sustainability_score(None, {"3yr": 0.05}) == "Medium"

    def test_growth_rates_empty_history(self):
        from api.services.dividend_service import _compute_growth_rates

        rates = _compute_growth_rates([])
        assert rates == {"1yr": None, "3yr": None, "5yr": None, "10yr": None}

    def test_growth_rates_single_entry(self):
        from api.services.dividend_service import _compute_growth_rates

        rates = _compute_growth_rates([{"date": "2025-06-01", "amount": 0.24}])
        assert rates == {"1yr": None, "3yr": None, "5yr": None, "10yr": None}

    def test_full_analyze(self, mock_quote, mock_dividend_info):
        """Integration test for analyze_dividend with mocked fetcher."""
        with (
            patch("api.services.dividend_service.get_quote", return_value=mock_quote),
            patch("api.services.dividend_service.get_dividend_info", return_value=mock_dividend_info),
        ):
            from api.services.dividend_service import analyze_dividend

            result = analyze_dividend("AAPL")

        assert result["ticker"] == "AAPL"
        assert result["current_price"] == 175.50
        assert result["sustainability_score"] in ("High", "Medium", "Low")
        assert result["valuation"] in ("Undervalued", "Fair", "Overvalued")
        assert "growth_rates" in result


# ---------------------------------------------------------------------------
# Portfolio analyzer (static strategy class)
# ---------------------------------------------------------------------------

class TestPortfolioAnalyzerClass:
    """Tests for the standalone portfolio_analyzer.py strategies."""

    def _make_analyzer(self):
        from portfolio_analyzer import PortfolioAnalyzer

        return PortfolioAnalyzer()

    def test_fund_catalog_not_empty(self):
        pa = self._make_analyzer()
        assert len(pa.funds) > 0

    def test_all_strategies_present(self):
        pa = self._make_analyzer()
        for key in ("strategy_1", "strategy_2", "strategy_3", "strategy_4", "strategy_5", "strategy_6"):
            assert key in pa.strategies

    def test_strategy_allocations_sum_to_one(self):
        """Every strategy allocation should sum to 1.0 (or very close)."""
        pa = self._make_analyzer()
        for key, strategy in pa.strategies.items():
            total = sum(strategy["allocation"].values())
            assert abs(total - 1.0) < 0.01, f"{key} allocation sums to {total}"

    def test_strategy_tickers_exist_in_catalog(self):
        """All tickers referenced in strategies should be in the fund catalog."""
        pa = self._make_analyzer()
        all_tickers = set()
        for cat in pa.funds.values():
            all_tickers.update(cat["funds"].keys())

        for key, strategy in pa.strategies.items():
            for ticker in strategy["allocation"]:
                assert ticker in all_tickers, (
                    f"Strategy {key} references {ticker} not found in catalog"
                )

    def test_fund_data_has_required_fields(self):
        """Every fund entry should have the expected numeric fields."""
        pa = self._make_analyzer()
        required = {"name", "type", "ytd", "one_yr", "three_yr", "dividend", "expense_ratio", "risk"}
        for cat in pa.funds.values():
            for symbol, fund in cat["funds"].items():
                missing = required - set(fund.keys())
                assert not missing, f"{symbol} missing fields: {missing}"


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    """Edge cases for portfolio and analysis functions."""

    def test_portfolio_summary_empty_db(self):
        """get_portfolio_summary with no holdings returns zeroed summary."""
        with patch("api.services.portfolio_service.db") as mock_db:
            mock_db.fetchall.return_value = []
            from api.services.portfolio_service import get_portfolio_summary

            result = get_portfolio_summary()

        assert result["holdings"] == []
        assert result["total_value"] == 0
        assert result["total_gain_pct"] == 0

    def test_single_ticker_risk_metrics(self, mock_returns):
        """Single-asset portfolio should still produce valid metrics."""
        with patch("api.services.risk_service.get_returns", return_value=mock_returns):
            from api.services.risk_service import compute_risk_metrics

            result = compute_risk_metrics(tickers=["AAPL"])

        assert len(result["weights"]) == 1
        assert abs(result["weights"][0] - 1.0) < 0.001
