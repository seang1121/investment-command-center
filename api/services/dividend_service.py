"""Dividend analysis engine.

Gordon Growth Model (DDM), payout ratio sustainability,
dividend growth rates, and calendar projections.
"""

import logging
from datetime import datetime

import numpy as np

from api.services.data_fetcher import get_dividend_info, get_quote

logger = logging.getLogger(__name__)


def analyze_dividend(
    ticker: str,
    required_return: float = 0.10,
    growth_rate: float | None = None,
) -> dict:
    """Full dividend analysis for a single ticker."""
    quote = get_quote(ticker)
    div_info = get_dividend_info(ticker)

    price = quote["price"]
    div_yield = div_info.get("dividend_yield")
    div_rate = div_info.get("dividend_rate")
    payout = div_info.get("payout_ratio")
    history = div_info.get("history", [])

    # Compute growth rates from history
    growth_rates = _compute_growth_rates(history)

    # Auto-detect growth rate if not provided
    if growth_rate is None:
        growth_rate = growth_rates.get("3yr") or growth_rates.get("1yr") or 0.03

    # Gordon Growth Model: V = D1 / (r - g)
    ddm_value = _gordon_growth(div_rate, required_return, growth_rate)

    # Valuation assessment
    valuation = "Fair"
    if ddm_value is not None:
        ratio = price / ddm_value
        if ratio < 0.85:
            valuation = "Undervalued"
        elif ratio > 1.15:
            valuation = "Overvalued"

    # Sustainability score
    sustainability = _sustainability_score(payout, growth_rates)

    return {
        "ticker": ticker.upper(),
        "current_price": price,
        "dividend_yield": div_yield,
        "annual_dividend": div_rate,
        "payout_ratio": payout,
        "sustainability_score": sustainability,
        "ddm_fair_value": round(ddm_value, 2) if ddm_value else None,
        "valuation": valuation,
        "growth_rates": growth_rates,
        "upcoming_ex_date": div_info.get("ex_dividend_date"),
        "history": history,
    }


def _gordon_growth(
    dividend_rate: float | None,
    required_return: float,
    growth_rate: float,
) -> float | None:
    """DDM: V = D1 / (r - g), where D1 = D0 * (1 + g)."""
    if not dividend_rate or dividend_rate <= 0:
        return None
    if required_return <= growth_rate:
        return None  # Model breaks down

    d1 = dividend_rate * (1 + growth_rate)
    return d1 / (required_return - growth_rate)


def _compute_growth_rates(
    history: list[dict],
) -> dict[str, float | None]:
    """Compute 1yr, 3yr, 5yr, 10yr dividend growth CAGR."""
    if len(history) < 2:
        return {"1yr": None, "3yr": None, "5yr": None, "10yr": None}

    amounts = [h["amount"] for h in history]
    dates = [datetime.strptime(h["date"], "%Y-%m-%d") for h in history]
    rates = {}

    for label, years in [("1yr", 1), ("3yr", 3), ("5yr", 5), ("10yr", 10)]:
        cutoff = datetime.now().replace(year=datetime.now().year - years)
        past = [
            (d, a) for d, a in zip(dates, amounts) if d >= cutoff
        ]
        if len(past) < 2:
            rates[label] = None
            continue

        # Annual totals
        annual = {}
        for d, a in past:
            annual.setdefault(d.year, 0)
            annual[d.year] += a

        yearly = sorted(annual.items())
        if len(yearly) < 2 or yearly[0][1] <= 0:
            rates[label] = None
            continue

        cagr = (yearly[-1][1] / yearly[0][1]) ** (
            1 / max(len(yearly) - 1, 1)
        ) - 1
        rates[label] = round(cagr, 4)

    return rates


def _sustainability_score(
    payout_ratio: float | None,
    growth_rates: dict,
) -> str:
    """Score dividend sustainability as High/Medium/Low."""
    if payout_ratio is None:
        return "Medium"

    if payout_ratio > 1.0:
        return "Low"
    if payout_ratio > 0.75:
        # Check if growth is negative
        g = growth_rates.get("3yr")
        if g is not None and g < 0:
            return "Low"
        return "Medium"
    if payout_ratio > 0.35:
        return "High"
    return "High"
