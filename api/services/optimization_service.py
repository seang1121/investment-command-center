"""Portfolio optimization using PyPortfolioOpt.

Computes efficient frontier, max-Sharpe, and min-volatility portfolios.
"""

import numpy as np
import pandas as pd
from pypfopt import EfficientFrontier, expected_returns, risk_models

from api.services.data_fetcher import get_history

TRADING_DAYS = 252


def optimize_portfolio(
    tickers: list[str],
    period: str = "2y",
    risk_free_rate: float = 0.05,
    num_portfolios: int = 5000,
) -> dict:
    """Compute efficient frontier and optimal portfolios."""
    # Build price DataFrame
    price_data = {}
    for ticker in tickers:
        history = get_history(ticker, period=period)
        price_data[ticker] = pd.Series(
            {h["date"]: h["close"] for h in history}
        )

    prices = pd.DataFrame(price_data).dropna()
    prices.index = pd.to_datetime(prices.index)

    if len(prices) < 60:
        raise ValueError("Need at least 60 days of overlapping data")

    # Expected returns and covariance
    mu = expected_returns.mean_historical_return(prices)
    cov = risk_models.sample_cov(prices)

    # Max Sharpe portfolio
    ef_sharpe = EfficientFrontier(mu, cov)
    ef_sharpe.max_sharpe(risk_free_rate=risk_free_rate)
    sharpe_weights = ef_sharpe.clean_weights()
    sharpe_perf = ef_sharpe.portfolio_performance(
        risk_free_rate=risk_free_rate
    )

    max_sharpe = {
        "return": round(sharpe_perf[0], 4),
        "volatility": round(sharpe_perf[1], 4),
        "sharpe": round(sharpe_perf[2], 4),
        "weights": {k: round(v, 4) for k, v in sharpe_weights.items()},
    }

    # Min volatility portfolio
    ef_min = EfficientFrontier(mu, cov)
    ef_min.min_volatility()
    min_weights = ef_min.clean_weights()
    min_perf = ef_min.portfolio_performance(risk_free_rate=risk_free_rate)

    min_vol = {
        "return": round(min_perf[0], 4),
        "volatility": round(min_perf[1], 4),
        "sharpe": round(min_perf[2], 4),
        "weights": {k: round(v, 4) for k, v in min_weights.items()},
    }

    # Generate frontier points via random portfolios
    frontier = _random_frontier(
        mu.values, cov.values, num_portfolios, risk_free_rate
    )

    # Individual asset risk/return
    daily_returns = prices.pct_change().dropna()
    individual = []
    for ticker in tickers:
        ann_ret = float(daily_returns[ticker].mean() * TRADING_DAYS)
        ann_vol = float(daily_returns[ticker].std() * np.sqrt(TRADING_DAYS))
        individual.append({
            "ticker": ticker,
            "return": round(ann_ret, 4),
            "volatility": round(ann_vol, 4),
        })

    return {
        "frontier": frontier,
        "max_sharpe": max_sharpe,
        "min_volatility": min_vol,
        "individual_assets": individual,
    }


def _random_frontier(
    mu: np.ndarray,
    cov: np.ndarray,
    n: int,
    rf: float,
) -> list[dict]:
    """Generate random portfolio points for frontier visualization."""
    results = []
    num_assets = len(mu)

    for _ in range(n):
        w = np.random.random(num_assets)
        w /= w.sum()

        ret = float(w @ mu)
        vol = float(np.sqrt(w @ cov @ w))
        sharpe = (ret - rf) / vol if vol > 0 else 0

        results.append({
            "return": round(ret, 4),
            "volatility": round(vol, 4),
            "sharpe": round(sharpe, 4),
        })

    return results
