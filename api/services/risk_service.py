"""Risk metrics computation engine.

Calculates Sharpe, Sortino, Treynor, VaR, CVaR, max drawdown,
beta, alpha for any set of tickers with optional weights.
"""

import numpy as np
import pandas as pd

from api.services.data_fetcher import get_returns

TRADING_DAYS = 252


def compute_risk_metrics(
    tickers: list[str],
    weights: list[float] | None = None,
    period: str = "2y",
    risk_free_rate: float = 0.05,
) -> dict:
    """Compute full risk metrics for a portfolio."""
    n = len(tickers)
    if weights is None:
        weights = [1.0 / n] * n

    weights = np.array(weights)
    weights = weights / weights.sum()  # Normalize

    # Fetch returns for all tickers
    returns_list = []
    for ticker in tickers:
        ret = get_returns(ticker, period=period)
        returns_list.append(ret)

    # Align dates across all tickers
    returns_df = pd.concat(returns_list, axis=1, keys=tickers).dropna()
    if returns_df.empty or len(returns_df) < 30:
        raise ValueError("Insufficient data for risk calculation")

    # Portfolio daily returns
    port_returns = returns_df.values @ weights
    daily_rf = risk_free_rate / TRADING_DAYS

    # Annualized metrics
    ann_return = float(np.mean(port_returns) * TRADING_DAYS)
    ann_vol = float(np.std(port_returns, ddof=1) * np.sqrt(TRADING_DAYS))

    # Sharpe ratio
    sharpe = _sharpe(port_returns, daily_rf)

    # Sortino ratio (downside deviation only)
    sortino = _sortino(port_returns, daily_rf)

    # VaR and CVaR at 95%
    var_95 = _var(port_returns, 0.05)
    cvar_95 = _cvar(port_returns, 0.05)

    # Max drawdown
    dd, dd_duration = _max_drawdown(port_returns)

    # Beta and alpha (vs S&P 500)
    beta_val, alpha_val, treynor_val = _market_metrics(
        port_returns, risk_free_rate, period
    )

    # Calmar ratio
    calmar = ann_return / abs(dd) if dd != 0 else None

    return {
        "tickers": tickers,
        "weights": weights.tolist(),
        "sharpe_ratio": round(sharpe, 4),
        "sortino_ratio": round(sortino, 4),
        "treynor_ratio": round(treynor_val, 4) if treynor_val else None,
        "beta": round(beta_val, 4) if beta_val else None,
        "alpha": round(alpha_val, 4) if alpha_val else None,
        "var_95": round(var_95, 4),
        "cvar_95": round(cvar_95, 4),
        "max_drawdown": round(dd, 4),
        "max_drawdown_duration_days": dd_duration,
        "annualized_return": round(ann_return, 4),
        "annualized_volatility": round(ann_vol, 4),
        "calmar_ratio": round(calmar, 4) if calmar else None,
    }


def _sharpe(returns: np.ndarray, daily_rf: float) -> float:
    excess = returns - daily_rf
    if np.std(excess, ddof=1) == 0:
        return 0.0
    return float(
        np.mean(excess) / np.std(excess, ddof=1) * np.sqrt(TRADING_DAYS)
    )


def _sortino(returns: np.ndarray, daily_rf: float) -> float:
    excess = returns - daily_rf
    downside = excess[excess < 0]
    if len(downside) == 0 or np.std(downside, ddof=1) == 0:
        return 0.0
    return float(
        np.mean(excess) / np.std(downside, ddof=1) * np.sqrt(TRADING_DAYS)
    )


def _var(returns: np.ndarray, alpha: float) -> float:
    """Historical Value at Risk (annualized)."""
    return float(np.percentile(returns, alpha * 100) * np.sqrt(TRADING_DAYS))


def _cvar(returns: np.ndarray, alpha: float) -> float:
    """Conditional VaR / Expected Shortfall (annualized)."""
    threshold = np.percentile(returns, alpha * 100)
    tail = returns[returns <= threshold]
    if len(tail) == 0:
        return _var(returns, alpha)
    return float(np.mean(tail) * np.sqrt(TRADING_DAYS))


def _max_drawdown(returns: np.ndarray) -> tuple[float, int | None]:
    """Max drawdown and its duration in trading days."""
    cumulative = np.cumprod(1 + returns)
    peak = np.maximum.accumulate(cumulative)
    drawdowns = (cumulative - peak) / peak
    max_dd = float(np.min(drawdowns))

    # Duration: days from peak to trough
    try:
        trough_idx = int(np.argmin(drawdowns))
        peak_idx = int(np.argmax(cumulative[:trough_idx + 1]))
        duration = trough_idx - peak_idx
    except (ValueError, IndexError):
        duration = None

    return max_dd, duration


def _market_metrics(
    port_returns: np.ndarray,
    risk_free_rate: float,
    period: str,
) -> tuple[float | None, float | None, float | None]:
    """Beta, alpha, Treynor vs S&P 500."""
    try:
        mkt_returns = get_returns("SPY", period=period)
        # Align lengths
        min_len = min(len(port_returns), len(mkt_returns))
        pr = port_returns[-min_len:]
        mr = mkt_returns.values[-min_len:]

        daily_rf = risk_free_rate / TRADING_DAYS
        cov = np.cov(pr, mr)
        beta = float(cov[0, 1] / cov[1, 1]) if cov[1, 1] != 0 else None

        if beta is not None:
            ann_port = float(np.mean(pr) * TRADING_DAYS)
            ann_mkt = float(np.mean(mr) * TRADING_DAYS)
            alpha = ann_port - (risk_free_rate + beta * (ann_mkt - risk_free_rate))
            treynor = (ann_port - risk_free_rate) / beta if beta != 0 else None
            return beta, alpha, treynor
    except Exception:
        pass
    return None, None, None
