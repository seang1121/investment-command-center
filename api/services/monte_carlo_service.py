"""Monte Carlo simulation engine.

Runs 10,000+ stochastic paths for portfolio projections
using historical return distributions (log-normal).
Supports contributions (accumulation) and withdrawals (retirement).
"""

import numpy as np
import pandas as pd

from api.services.data_fetcher import get_returns

TRADING_DAYS = 252
MONTHS_PER_YEAR = 12


def run_simulation(
    tickers: list[str],
    weights: list[float] | None = None,
    initial_investment: float = 10000,
    time_horizon_years: int = 5,
    monthly_contribution: float = 0,
    monthly_withdrawal: float = 0,
    num_simulations: int = 10000,
    target_value: float | None = None,
    period: str = "5y",
) -> dict:
    """Run Monte Carlo simulation and return percentile paths."""
    n = len(tickers)
    if weights is None:
        weights = [1.0 / n] * n

    w = np.array(weights)
    w = w / w.sum()

    # Fetch and combine returns
    returns_list = []
    for ticker in tickers:
        ret = get_returns(ticker, period=period)
        returns_list.append(ret)

    returns_df = pd.concat(returns_list, axis=1, keys=tickers).dropna()
    if len(returns_df) < 60:
        raise ValueError("Need at least 60 days of overlapping data")

    # Portfolio daily returns
    port_daily = returns_df.values @ w

    # Convert to monthly stats (approx 21 trading days/month)
    monthly_mean = float(np.mean(port_daily) * 21)
    monthly_std = float(np.std(port_daily, ddof=1) * np.sqrt(21))

    total_months = time_horizon_years * MONTHS_PER_YEAR
    net_monthly = monthly_contribution - monthly_withdrawal

    # Simulate paths: (num_simulations x total_months)
    monthly_returns = np.random.normal(
        monthly_mean, monthly_std, (num_simulations, total_months)
    )

    # Build value paths
    paths = np.zeros((num_simulations, total_months + 1))
    paths[:, 0] = initial_investment

    for m in range(total_months):
        paths[:, m + 1] = (
            paths[:, m] * (1 + monthly_returns[:, m]) + net_monthly
        )
        # Floor at zero (can't go negative)
        paths[:, m + 1] = np.maximum(paths[:, m + 1], 0)

    # Extract percentiles
    months = list(range(total_months + 1))
    percentiles = {}
    for p, label in [
        (5, "5th"),
        (25, "25th"),
        (50, "50th"),
        (75, "75th"),
        (95, "95th"),
    ]:
        percentiles[label] = np.percentile(paths, p, axis=0).tolist()

    # Also add mean path
    percentiles["mean"] = np.mean(paths, axis=0).tolist()

    final_values = paths[:, -1]

    result = {
        "percentiles": percentiles,
        "months": months,
        "expected_final": round(float(np.mean(final_values)), 2),
        "median_final": round(float(np.median(final_values)), 2),
        "worst_case": round(float(np.percentile(final_values, 5)), 2),
        "best_case": round(float(np.percentile(final_values, 95)), 2),
        "prob_loss": round(
            float(np.mean(final_values < initial_investment)) * 100, 1
        ),
        "prob_target": None,
    }

    if target_value is not None:
        result["prob_target"] = round(
            float(np.mean(final_values >= target_value)) * 100, 1
        )

    return result
